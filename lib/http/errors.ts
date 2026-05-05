import { NextResponse } from "next/server";

export function jsonError(
  code: string,
  status: number,
  extra?: Record<string, unknown>,
): NextResponse {
  return NextResponse.json({ error: code, ...extra }, { status });
}
