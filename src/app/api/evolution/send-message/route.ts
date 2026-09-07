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
