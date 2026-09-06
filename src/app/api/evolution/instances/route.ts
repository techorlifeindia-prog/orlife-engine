import { NextResponse } from 'next/server';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_GLOBAL_KEY = process.env.EVOLUTION_GLOBAL_KEY || '';

export async function GET() {
  try {
    const res = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      headers: {
        'apikey': EVOLUTION_GLOBAL_KEY,
      },
    });

    if (!res.ok) {
      return NextResponse.json([]);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.warn('Evolution API unreachable:', error);
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    const { instanceName } = await req.json();
    const res = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_GLOBAL_KEY,
      },
      body: JSON.stringify({
        instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return NextResponse.json({ error: errData.message || 'Failed to create instance' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to connect to Evolution API' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { instanceName } = await req.json();
    const res = await fetch(`${EVOLUTION_API_URL}/instance/logout/${instanceName}`, {
      method: 'DELETE',
      headers: {
        'apikey': EVOLUTION_GLOBAL_KEY,
      },
    });

    return NextResponse.json({ success: res.ok });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to logout instance' }, { status: 500 });
  }
}
