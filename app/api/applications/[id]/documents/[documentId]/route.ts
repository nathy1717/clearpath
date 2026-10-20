import { auth } from "@clerk/nextjs/server";
import { del, get } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { rejectCrossOriginWrite } from "@/lib/security/request-origin";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string; documentId: string }> };

async function findDocument(applicationId: string, documentId: string, userId: string) {
  const sql = getDb();
  const rows = await sql`
    SELECT d.id, d.filename, d.content_type, d.byte_size, d.blob_url
    FROM application_documents d
    INNER JOIN applications a
      ON a.id = d.application_id AND a.user_id = d.user_id
    WHERE d.application_id = ${applicationId}
      AND d.id = ${documentId}
      AND d.user_id = ${userId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function GET(_request: NextRequest, props: RouteContext) {
  const params = await props.params;
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const document = await findDocument(params.id, params.documentId, userId);
  if (!document) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  const blob = await get(document.blob_url as string, { access: "private", useCache: false });
  if (!blob || blob.statusCode !== 200) {
    return NextResponse.json({ error: "Document content is unavailable." }, { status: 404 });
  }
  const filename = encodeURIComponent(document.filename as string);
  return new Response(blob.stream, {
    headers: {
      "Content-Type": document.content_type as string,
      "Content-Length": String(document.byte_size),
      "Content-Disposition": `attachment; filename*=UTF-8''${filename}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function DELETE(request: NextRequest, props: RouteContext) {
  const params = await props.params;
  const originResponse = rejectCrossOriginWrite(request);
  if (originResponse) return originResponse;
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const document = await findDocument(params.id, params.documentId, userId);
  if (!document) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  await del(document.blob_url as string);
  const sql = getDb();
  await sql`
    DELETE FROM application_documents
    WHERE id = ${params.documentId}
      AND application_id = ${params.id}
      AND user_id = ${userId}
  `;
  return new NextResponse(null, { status: 204 });
}
