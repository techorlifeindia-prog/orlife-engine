import { NextResponse } from 'next/server';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_GLOBAL_KEY = process.env.EVOLUTION_GLOBAL_KEY || '';

export async function GET() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      headers: { apikey: EVOLUTION_GLOBAL_KEY },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) return NextResponse.json([]);
    const data = await res.json();
    return NextResponse.json(data || []);
  } catch {
    clearTimeout(timer);
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);

  try {
    const { instanceName } = await req.json();
    const res = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: EVOLUTION_GLOBAL_KEY,
      },
      body: JSON.stringify({
        instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      return NextResponse.json({ error: 'WhatsApp Engine offline' }, { status: 503 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    clearTimeout(timer);
    return NextResponse.json({ error: 'Failed to connect to WhatsApp Engine' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);

  try {
    const { instanceName } = await req.json();
    const res = await fetch(`${EVOLUTION_API_URL}/instance/logout/${instanceName}`, {
      method: 'DELETE',
      headers: { apikey: EVOLUTION_GLOBAL_KEY },
      signal: controller.signal,
    });
    clearTimeout(timer);

    return NextResponse.json({ success: res.ok });
  } catch {
    clearTimeout(timer);
    return NextResponse.json({ error: 'Failed to logout instance' }, { status: 500 });
  }
}


