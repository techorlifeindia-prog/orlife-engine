import { NextResponse } from "next/server";
import { validateClientApiKey } from "@/lib/client-api-auth";

const AI_HUB_URL = process.env.AI_HUB_URL || "http://localhost:8090";

export async function POST(req: Request) {
  const authError = validateClientApiKey(req.headers.get("authorization"));
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  try {
    const { message, systemPrompt } = await req.json();
    if (!message) return NextResponse.json({ error: "message is required" }, { status: 400 });

    const start = Date.now();
    const res = await fetch(`${AI_HUB_URL}/ai-hub/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, systemPrompt }),
    });

    if (!res.ok) return NextResponse.json({ error: "AI Hub unavailable" }, { status: 502 });

    const data = await res.json();
    return NextResponse.json({
      reply: data.reply,
      source: data.source,
      latencyMs: Date.now() - start,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 });
  }
}
