import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { prompt, persona, modelProvider } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const cleanPrompt = prompt.toLowerCase();
    let aiReply = "";
    let usedModel = modelProvider || "Ollama Llama 3.2 (100% Private Local Model)";

    // Call AI Hub Server (Port 8090) which handles Hybrid Logic (Keyword Rules + Ollama AI)
    try {
      const hubRes = await fetch("http://localhost:8090/ai-hub/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          systemPrompt: persona,
        }),
      });

      if (hubRes.ok) {
        const hubData = await hubRes.json();
        if (hubData.reply) {
          const modelLabel = hubData.source === 'keyword_rule' 
            ? `Keyword Rule Match (${hubData.matchedKeyword || 'Rule'})` 
            : `Ollama Llama 3.2 (Local VPS Instance - 100% Private)`;

          return NextResponse.json({
            status: "SUCCESS",
            model: modelLabel,
            prompt,
            response: hubData.reply,
            source: hubData.source,
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (e) {
      console.log("AI Hub Server (Port 8090) not reachable, falling back to direct Ollama");
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process AI Hub simulation" }, { status: 500 });
  }
}
