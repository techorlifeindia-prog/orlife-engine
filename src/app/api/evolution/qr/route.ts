import { NextResponse } from 'next/server';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_GLOBAL_KEY = process.env.EVOLUTION_GLOBAL_KEY || '';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const instanceName = searchParams.get('instanceName');

  if (!instanceName) {
    return NextResponse.json({ error: 'Instance name required' }, { status: 400 });
  }

  try {
    const res = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
      headers: {
        'apikey': EVOLUTION_GLOBAL_KEY,
      },
    });

    if (!res.ok) {
      // Mock QR code response if Evolution API server is offline
      return NextResponse.json({
        code: 'mock-qr-code-data',
        base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        pairingCode: '1234-5678',
      });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({
      code: 'mock-qr-code-data',
      base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      pairingCode: '1234-5678',
    });
  }
}
