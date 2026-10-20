import { auth } from "@clerk/nextjs/server";
import { del } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { isClearpathApplication } from "@/lib/application-validation";
import { getDb } from "@/lib/db";
import { rejectCrossOriginWrite } from "@/lib/security/request-origin";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 1024 * 1024;

export async function GET(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = getDb();
  const rows = await sql`
    SELECT payload FROM applications
    WHERE id = ${params.id} AND user_id = ${userId}
    LIMIT 1
  `;
  if (!rows[0]) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }
  return NextResponse.json({ application: rows[0].payload });
}

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const originResponse = rejectCrossOriginWrite(request);
  if (originResponse) return originResponse;
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return NextResponse.json({ error: "Request content type must be JSON." }, { status: 415 });
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Workspace is too large." }, { status: 413 });
  }

  let body: unknown;
  try {
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Workspace is too large." }, { status: 413 });
    }
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (
    !isClearpathApplication(body)
    || body.isDemo
    || body.id !== params.id
    || params.id === "demo"
  ) {
    return NextResponse.json({ error: "Workspace data is invalid." }, { status: 400 });
  }

  const sql = getDb();
  const rows = await sql`
    UPDATE applications
    SET payload = ${JSON.stringify(body)}::jsonb, updated_at = now()
    WHERE id = ${params.id} AND user_id = ${userId}
    RETURNING payload
  `;
  if (!rows[0]) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }
  return NextResponse.json({ application: rows[0].payload });
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const originResponse = rejectCrossOriginWrite(request);
  if (originResponse) return originResponse;
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (params.id === "demo") {
    return NextResponse.json({ error: "The demo workspace cannot be deleted here." }, { status: 400 });
  }

  const sql = getDb();
  const documents = await sql`
    SELECT d.blob_url
    FROM application_documents d
    INNER JOIN applications a
      ON a.id = d.application_id AND a.user_id = d.user_id
    WHERE d.application_id = ${params.id} AND d.user_id = ${userId}
  `;
  if (documents.length > 0) {
    await del(documents.map((document) => document.blob_url as string));
  }
  const rows = await sql`
    DELETE FROM applications
    WHERE id = ${params.id} AND user_id = ${userId}
    RETURNING id
  `;
  if (!rows[0]) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
