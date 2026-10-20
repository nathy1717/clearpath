import { NextRequest, NextResponse } from "next/server";

export function rejectCrossOriginWrite(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin === request.nextUrl.origin) return null;
  return NextResponse.json(
    { error: "Write requests must come from this application." },
    { status: 403 },
  );
}
