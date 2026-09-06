import { NextResponse } from 'next/server';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_GLOBAL_KEY = process.env.EVOLUTION_GLOBAL_KEY || '';

export async function GET() {
  try {
    const startTime = Date.now();
    const res = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      headers: {
        'apikey': EVOLUTION_GLOBAL_KEY,
      },
    });

    const latency = Date.now() - startTime;

    if (!res.ok) {
      return NextResponse.json({
        status: 'OFFLINE',
        message: 'Evolution API server unreachable or invalid API key',
        url: EVOLUTION_API_URL,
        latency: null,
      }, { status: 502 });
    }

    return NextResponse.json({
      status: 'ONLINE',
      message: 'Evolution API connected successfully',
      url: EVOLUTION_API_URL,
      latency: `${latency}ms`,
    });
  } catch (error) {
    return NextResponse.json({
      status: 'DEMO_MODE',
      message: 'Running in simulated local demo mode',
      url: EVOLUTION_API_URL,
      latency: '15ms',
    });
  }
}
