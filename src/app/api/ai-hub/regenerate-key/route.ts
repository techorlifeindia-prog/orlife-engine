import { NextResponse } from "next/server";

const AI_HUB_URL = "http://localhost:8090";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(`${AI_HUB_URL}/config/regenerate-key`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to regenerate API key" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "AI Hub offline" }, { status: 500 });
  }
}
