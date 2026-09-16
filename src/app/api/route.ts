import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Health/readiness probe — verifies the SQLite datasource responds.
 * Machine-facing only; UI mutations go through Server Actions.
 */
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", db: true });
  } catch (error) {
    console.error("[health] database probe failed", { error });
    return NextResponse.json({ status: "degraded", db: false }, { status: 503 });
  }
}
