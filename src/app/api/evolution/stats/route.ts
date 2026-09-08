import { NextResponse } from "next/server";

const ENGINE_URL = process.env.WHATSAPP_ENGINE_URL || "http://localhost:8080";

/**
 * GET /api/evolution/stats — returns aggregate message counts from WhatsApp engine.
 * Proxies to engine's /stats/all endpoint.
 */
export async function GET() {
  try {
    const res = await fetch(`${ENGINE_URL}/stats/all`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      return NextResponse.json({ totalSent: 0, totalFailed: 0, perInstance: {} });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    // Engine offline — return safe defaults
    return NextResponse.json({ totalSent: 0, totalFailed: 0, perInstance: {} });
  }
}
