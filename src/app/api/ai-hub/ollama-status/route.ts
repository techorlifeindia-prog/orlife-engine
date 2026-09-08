import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 1. Try AI Hub server /ollama/status on port 8090
    try {
      const hubRes = await fetch("http://localhost:8090/ollama/status", { signal: AbortSignal.timeout(3000) });
      if (hubRes.ok) {
        const data = await hubRes.json();
        if (data.status === "ONLINE") {
          return NextResponse.json(data);
        }
      }
    } catch {}

    // 2. Try direct Ollama server port 11434
    try {
      const oRes = await fetch("http://localhost:11434/api/tags", { signal: AbortSignal.timeout(3000) });
      if (oRes.ok) {
        const data = await oRes.json();
        const models = data.models?.map((m: any) => (typeof m === "string" ? m : m.name)) || [];
        return NextResponse.json({
          status: "ONLINE",
          models: models.length ? models : ["llama3.2"],
        });
      }
    } catch {}

    // 3. Try AI Hub health endpoint port 8090
    try {
      const healthRes = await fetch("http://localhost:8090/health", { signal: AbortSignal.timeout(3000) });
      if (healthRes.ok) {
        return NextResponse.json({
          status: "ONLINE",
          models: ["OrLife Flash AI (Smart Rules Engine)"],
        });
      }
    } catch {}

    return NextResponse.json({ status: "OFFLINE", models: [] });
  } catch (error: any) {
    return NextResponse.json({ status: "OFFLINE", models: [] }, { status: 500 });
  }
}
