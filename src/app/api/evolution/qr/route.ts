import { NextResponse } from 'next/server';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_GLOBAL_KEY = process.env.EVOLUTION_GLOBAL_KEY || '';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const instanceName = searchParams.get('instanceName');

  if (!instanceName) {
    return NextResponse.json({ error: 'Instance name required' }, { status: 400 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
      headers: { apikey: EVOLUTION_GLOBAL_KEY },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      return NextResponse.json(
        { status: 'offline', error: 'WhatsApp Engine offline' },
        { status: 503 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    clearTimeout(timer);
    return NextResponse.json(
      { status: 'offline', error: 'WhatsApp Engine offline' },
      { status: 503 }
    );
  }
}


