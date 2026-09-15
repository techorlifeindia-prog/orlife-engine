import { NextResponse } from "next/server";
import { validateClientApiKey } from "@/lib/client-api-auth";

const WA_URL = process.env.EVOLUTION_API_URL || "http://localhost:8080";
const WA_KEY = process.env.EVOLUTION_GLOBAL_KEY || "";

export async function POST(req: Request) {
  const authError = validateClientApiKey(req.headers.get("authorization"));
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  try {
    const { phone, message, instanceName } = await req.json();
    if (!phone || !message || !instanceName)
      return NextResponse.json({ error: "phone, message, instanceName are required" }, { status: 400 });

    const cleanPhone = phone.replace(/\D/g, "");
    const res = await fetch(`${WA_URL}/message/sendText/${instanceName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: WA_KEY },
      body: JSON.stringify({
        number: cleanPhone,
        options: { delay: 1200, presence: "composing" },
        textMessage: { text: message },
      }),
    });

    if (!res.ok) return NextResponse.json({ error: "WhatsApp gateway error", status: "FAILED" }, { status: 502 });

    const data = await res.json();
    return NextResponse.json({ status: "SENT", data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 });
  }
}
