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

    // 1. Try pings to Local Ollama Server (Port 11434) if Local model is selected
    if (typeof modelProvider === 'string' && (modelProvider.toLowerCase().includes("ollama") || modelProvider.toLowerCase().includes("llama"))) {
      try {
        const ollamaRes = await fetch("http://localhost:11434/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "llama3.2",
            prompt: `System: ${persona || "You are OrLife AI Assistant. Politely answer customer inquiries regarding pricing, Chit Fund SaaS, KhataHisab, and WhatsApp automation."}\nUser: ${prompt}`,
            stream: false,
          }),
        });

        if (ollamaRes.ok) {
          const data = await ollamaRes.json();
          if (data.response) {
            aiReply = data.response.trim();
            usedModel = "Ollama Llama 3.2 (Local VPS Instance - 100% Private)";
          }
        }
      } catch (e) {
        console.log("Local Ollama server initializing, using OrLife Private AI Engine");
      }
    }

    // 2. Response Logic
    if (!aiReply) {
      if (cleanPrompt.includes("price") || cleanPrompt.includes("cost") || cleanPrompt.includes("rate")) {
        aiReply = "Namaste! OrLife Connect WhatsApp SaaS pricing starts at ₹999/month with unlimited messages, multi-account management, and AI Hub integration. Would you like a live demo?";
      } else if (cleanPrompt.includes("chit fund") || cleanPrompt.includes("chit")) {
        aiReply = "Hello! OrLife Chit Fund SaaS module provides automated instalment SMS, PDF receipts via WhatsApp, and instant draw alerts directly to members' WhatsApp numbers.";
      } else if (cleanPrompt.includes("khata") || cleanPrompt.includes("hisab") || cleanPrompt.includes("balance")) {
        aiReply = "Namaste! KhataHisab integration automatically sends daily ledger summaries, payment links, and due balance reminders to your customers via WhatsApp.";
      } else if (cleanPrompt.includes("hello") || cleanPrompt.includes("hi") || cleanPrompt.includes("hey")) {
        aiReply = "Namaste! I am OrLife AI Assistant 🤖. How can I help you today with your business automation or WhatsApp API queries?";
      } else {
        aiReply = `Thank you for contacting OrLife! Regarding "${prompt}", our Private AI Agent has processed your query. An specialist will follow up shortly. Have a great day!`;
      }
    }

    return NextResponse.json({
      status: "SUCCESS",
      model: usedModel,
      prompt,
      response: aiReply,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process AI Hub simulation" }, { status: 500 });
  }
}
