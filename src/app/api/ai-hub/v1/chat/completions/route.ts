import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const authHeader = req.headers.get("authorization");

    // Port 8090 AI Hub server directly has /v1/chat/completions
    const hubRes = await fetch("http://localhost:8090/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader && { "Authorization": authHeader }),
      },
      body: JSON.stringify(body),
    });

    if (hubRes.ok) {
      const data = await hubRes.json();
      return NextResponse.json(data);
    }

    const errText = await hubRes.text();
    return NextResponse.json({ error: `AI Hub Error: ${errText}` }, { status: hubRes.status });

  } catch (error: any) {
    return NextResponse.json({ error: "AI Hub (Port 8090) not reachable: " + error.message }, { status: 502 });
  }
}
