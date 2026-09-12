import { NextResponse } from 'next/server';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_GLOBAL_KEY = process.env.EVOLUTION_GLOBAL_KEY || '';

export async function POST(req: Request) {
  try {
    const { instanceName, number, text, mediaUrl } = await req.json();

    if (!instanceName || !number) {
      return NextResponse.json({ error: 'Missing required parameters (instanceName, number)' }, { status: 400 });
    }

    // Format phone number (strip non-digits)
    const cleanNumber = number.replace(/\D/g, '');

    // If AOC Portal API is selected as gateway or instanceName is 'aoc'
    if (instanceName === 'aoc' || instanceName === 'AOC Portal API') {
      const aocApiKey = process.env.AOC_API_KEY || "FaD5mRscjpM57s9WZWZVWUBGAvHaA8nv";
      const aocSenderNumber = process.env.AOC_SENDER_NUMBER || "919642218004";
      const aocBaseUrl = (process.env.AOC_BASE_URL || "https://api.aoc-portal.com").replace(/\/+$/, "");

      let cleanPhone = cleanNumber;
      if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;

      const aocRes = await fetch(`${aocBaseUrl}/v1/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": aocApiKey,
        },
        body: JSON.stringify({
          recipient_type: "individual",
          from: aocSenderNumber,
          to: cleanPhone,
          type: "text",
          text: { body: text || "" },
        }),
      });

      if (!aocRes.ok) {
        const errText = await aocRes.text();
        return NextResponse.json({ error: errText, status: "FAILED" }, { status: aocRes.status });
      }

      const aocData = await aocRes.json();
      return NextResponse.json({ status: "SENT", gateway: "AOC_PORTAL_API", data: aocData });
    }

    const endpoint = mediaUrl
      ? `${EVOLUTION_API_URL}/message/sendMedia/${instanceName}`
      : `${EVOLUTION_API_URL}/message/sendText/${instanceName}`;

    const bodyPayload = mediaUrl
      ? { number: cleanNumber, mediaUrl, caption: text || '' }
      : {
          number: cleanNumber,
          options: { delay: 1200, presence: 'composing' },
          textMessage: { text: text || '' },
        };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_GLOBAL_KEY,
      },
      body: JSON.stringify(bodyPayload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.warn(`[API Send Message] Evolution API error (${res.status}):`, errorText);
      return NextResponse.json({ error: errorText, status: 'FAILED' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API Send Message] Exception during send dispatch:', error?.message);
    return NextResponse.json({ error: error?.message || 'Failed to dispatch message' }, { status: 500 });
  }
}
