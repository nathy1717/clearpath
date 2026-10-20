import { auth } from "@clerk/nextjs/server";
import { del, put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { extractSupportedDocument, MAX_DOCUMENT_BYTES } from "@/lib/documents/extract";
import { consumeDailyLimit } from "@/lib/security/rate-limit";
import { rejectCrossOriginWrite } from "@/lib/security/request-origin";

export const runtime = "nodejs";

const MAX_DOCUMENTS_PER_WORKSPACE = 25;
const MAX_TOTAL_WORKSPACE_BYTES = 50 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_DOCUMENT_BYTES + 1024 * 1024;

export async function GET(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = getDb();
  const rows = await sql`
    SELECT d.id, d.filename, d.content_type, d.byte_size, d.document_role, d.created_at
    FROM application_documents d
    INNER JOIN applications a
      ON a.id = d.application_id AND a.user_id = d.user_id
    WHERE d.application_id = ${params.id} AND d.user_id = ${userId}
    ORDER BY d.created_at DESC
  `;
  return NextResponse.json({ documents: rows });
}

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const originResponse = rejectCrossOriginWrite(request);
  if (originResponse) return originResponse;
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!request.headers.get("content-type")?.startsWith("multipart/form-data")) {
    return NextResponse.json({ error: "Upload must use multipart form data." }, { status: 415 });
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return NextResponse.json({ error: "Upload exceeds the 10 MB file limit." }, { status: 413 });
  }

  const sql = getDb();
  const applicationRows = await sql`
    SELECT id FROM applications
    WHERE id = ${params.id} AND user_id = ${userId}
    LIMIT 1
  `;
  if (!applicationRows[0]) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Upload must be a valid multipart form." }, { status: 400 });
  }
  const file = formData.get("file");
  const role = formData.get("role");
  if (
    !(file instanceof File)
    || (role !== "opportunity_notice" && role !== "supporting_evidence")
  ) {
    return NextResponse.json({ error: "Choose a supported document and its purpose." }, { status: 400 });
  }
  if (!file.name || file.size === 0 || file.size > MAX_DOCUMENT_BYTES) {
    return NextResponse.json({ error: "Choose a non-empty file no larger than 10 MB." }, { status: 400 });
  }

  const counts = await sql`
    SELECT COUNT(*)::int AS document_count,
      COALESCE(SUM(byte_size), 0)::bigint AS total_bytes
    FROM application_documents
    WHERE application_id = ${params.id} AND user_id = ${userId}
  `;
  if (Number(counts[0]?.document_count ?? 0) >= MAX_DOCUMENTS_PER_WORKSPACE) {
    return NextResponse.json({ error: "A workspace can contain at most 25 documents." }, { status: 413 });
  }
  if (Number(counts[0]?.total_bytes ?? 0) + file.size > MAX_TOTAL_WORKSPACE_BYTES) {
    return NextResponse.json({ error: "A workspace can store up to 50 MB of documents." }, { status: 413 });
  }

  const safeFilename = file.name.split(/[\\/]/).pop()?.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 200);
  if (!safeFilename) {
    return NextResponse.json({ error: "The document filename is invalid." }, { status: 400 });
  }

  let buffer: Buffer;
  let extracted: Awaited<ReturnType<typeof extractSupportedDocument>>;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
    extracted = await extractSupportedDocument(safeFilename, buffer);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "The document could not be processed." },
      { status: 422 },
    );
  }

  if (!(await consumeDailyLimit(userId, "document_upload", 20))) {
    return NextResponse.json({ error: "Daily document upload limit reached. Try again tomorrow." }, { status: 429 });
  }

  const documentId = crypto.randomUUID();
  const extension = safeFilename.split(".").pop()?.toLowerCase() ?? "bin";
  const pathname = `clearpath/${userId}/${params.id}/${documentId}.${extension}`;
  const blob = await put(pathname, buffer, {
    access: "private",
    contentType: extracted.contentType,
    addRandomSuffix: false,
    cacheControlMaxAge: 60,
  });

  try {
    const rows = await sql`
      INSERT INTO application_documents (
        id, application_id, user_id, filename, content_type, byte_size,
        document_role, blob_url, extracted_text
      )
      SELECT ${documentId}, a.id, a.user_id, ${safeFilename}, ${extracted.contentType},
        ${buffer.length}, ${role}, ${blob.url}, ${extracted.text}
      FROM applications a
      WHERE a.id = ${params.id} AND a.user_id = ${userId}
      RETURNING id, filename, content_type, byte_size, document_role, created_at
    `;
    if (!rows[0]) {
      await del(blob.url);
      return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
    }
    return NextResponse.json({ document: rows[0] }, { status: 201 });
  } catch (error) {
    await del(blob.url);
    throw error;
  }
}
