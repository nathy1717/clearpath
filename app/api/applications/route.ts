import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { isClearpathApplication } from "@/lib/application-validation";
import { getDb } from "@/lib/db";
import { rejectCrossOriginWrite } from "@/lib/security/request-origin";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 1024 * 1024;

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = getDb();
  const rows = await sql`
    SELECT id, payload->>'name' AS name, payload->>'type' AS type,
      payload->>'organization' AS organization, payload->>'deadline' AS deadline,
      updated_at
    FROM applications
    WHERE user_id = ${userId}
    ORDER BY updated_at DESC
  `;
  return NextResponse.json({ applications: rows });
}

export async function POST(request: NextRequest) {
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

  if (!isClearpathApplication(body) || body.isDemo || body.id === "demo") {
    return NextResponse.json({ error: "Workspace data is invalid." }, { status: 400 });
  }

  const sql = getDb();
  const rows = await sql`
    INSERT INTO applications (id, user_id, payload)
    VALUES (${body.id}, ${userId}, ${JSON.stringify(body)}::jsonb)
    ON CONFLICT (id) DO UPDATE
      SET payload = EXCLUDED.payload, updated_at = now()
      WHERE applications.user_id = EXCLUDED.user_id
    RETURNING payload
  `;

  if (!rows[0]) {
    return NextResponse.json(
      { error: "A workspace with this ID already exists." },
      { status: 409 },
    );
  }
  return NextResponse.json({ application: rows[0].payload }, { status: 201 });
}
