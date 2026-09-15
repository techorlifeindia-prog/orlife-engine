import { NextResponse } from "next/server";
import { validateClientApiKey } from "@/lib/client-api-auth";

const AI_HUB_URL = process.env.AI_HUB_URL || "http://localhost:8090";
const WA_URL = process.env.EVOLUTION_API_URL || "http://localhost:8080";
const WA_KEY = process.env.EVOLUTION_GLOBAL_KEY || "";

export async function POST(req: Request) {
  const authError = validateClientApiKey(req.headers.get("authorization"));
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  try {
    const { phone, userMessage, instanceName, systemPrompt } = await req.json();
    if (!phone || !userMessage || !instanceName)
      return NextResponse.json({ error: "phone, userMessage, instanceName are required" }, { status: 400 });

    // Step 1: Get AI reply
    const aiRes = await fetch(`${AI_HUB_URL}/ai-hub/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage, systemPrompt }),
    });
    if (!aiRes.ok) return NextResponse.json({ error: "AI Hub unavailable" }, { status: 502 });
    const { reply: aiReply } = await aiRes.json();
    if (!aiReply) return NextResponse.json({ error: "AI returned empty reply" }, { status: 502 });

    // Step 2: Send AI reply via WhatsApp
    const cleanPhone = phone.replace(/\D/g, "");
    const waRes = await fetch(`${WA_URL}/message/sendText/${instanceName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: WA_KEY },
      body: JSON.stringify({
        number: cleanPhone,
        options: { delay: 1200, presence: "composing" },
        textMessage: { text: aiReply },
      }),
    });
    if (!waRes.ok) return NextResponse.json({ error: "WhatsApp gateway error", aiReply }, { status: 502 });

    return NextResponse.json({ status: "SENT", aiReply, phone: cleanPhone });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 });
  }
}
