import { NextResponse } from "next/server";
import { getSession } from "@/lib/session-helper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const session = await getSession();
    session.destroy();
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Error destroying session:", err);
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
