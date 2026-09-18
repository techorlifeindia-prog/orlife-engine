import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const baseUrl = process.env.AI_HUB_URL || "http://localhost:8090";
    let hubStatus = "OFFLINE";
    let ollamaStatus = "OFFLINE";

    // 1. Try AI Hub health endpoint port 8090
    try {
      const healthRes = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(3000) });
      if (healthRes.ok) {
        hubStatus = "ONLINE";
      }
    } catch {}

    // 2. Try Local AI Hub server /ollama/status on port 8090 as fallback for hubStatus
    try {
      const hubRes = await fetch(`${baseUrl}/ollama/status`, { signal: AbortSignal.timeout(3000) });
      if (hubRes.ok) {
        hubStatus = "ONLINE"; // It only confirms hub is alive, not actual Ollama
      }
    } catch {}

    // 3. Try direct Ollama server port 11434 for ACTUAL Ollama Status
    try {
      const oRes = await fetch("http://localhost:11434/api/tags", { signal: AbortSignal.timeout(3000) });
      if (oRes.ok) {
        ollamaStatus = "ONLINE";
      }
    } catch {}

    let groqStatus = "OFFLINE";

    // 1b. Check Real Groq Status from AI Hub
    try {
      const groqRes = await fetch(`${baseUrl}/groq/status`, { signal: AbortSignal.timeout(3000) });
      if (groqRes.ok) {
        const gData = await groqRes.json();
        groqStatus = gData.status || "OFFLINE";
      }
    } catch {}

    if (hubStatus === "ONLINE") {
      return NextResponse.json({
        status: "ONLINE",
        hubStatus: "ONLINE",
        groqStatus: groqStatus,
        ollamaStatus: ollamaStatus,
        activeEngine: "Groq Cloud AI (llama3-8b-8192)",
        models: ["llama3-8b-8192", "llama-3.3-70b-versatile", "mixtral-8x7b-32768", "llama3.2"]
      });
    }

    return NextResponse.json({ status: "OFFLINE", hubStatus: "OFFLINE", groqStatus: "OFFLINE", ollamaStatus: "OFFLINE", models: [] });
  } catch (error: any) {
    return NextResponse.json({ status: "OFFLINE", models: [] }, { status: 500 });
  }
}
