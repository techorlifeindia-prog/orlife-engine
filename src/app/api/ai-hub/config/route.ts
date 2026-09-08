import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const AI_HUB_URL = "http://localhost:8090";
const CONFIG_FILE_PATH = path.join(process.cwd(), "whatsapp-engine", "ai-config.json");

function readLocalConfigFile() {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const raw = fs.readFileSync(CONFIG_FILE_PATH, "utf8");
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("[API Config] Failed to read local ai-config.json:", e);
  }
  return { instances: {} };
}

function writeLocalConfigFile(allData: any) {
  try {
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(allData, null, 2), "utf8");
  } catch (e) {
    console.error("[API Config] Failed to write local ai-config.json:", e);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const instanceName = (searchParams.get("instanceName") || searchParams.get("instance") || "default").trim();

  // Try HTTP first
  try {
    const fetchUrl = instanceName === "all" ? `${AI_HUB_URL}/config/all` : `${AI_HUB_URL}/config?instanceName=${encodeURIComponent(instanceName)}`;
    const res = await fetch(fetchUrl, { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (e) {
    // Server offline — proceed to local file fallback
  }

  // Fallback to local ai-config.json
  const all = readLocalConfigFile();
  if (instanceName === "all") {
    return NextResponse.json(all);
  }
  const instConfig = (all.instances && all.instances[instanceName]) || all.instances?.default || {
    tenantId: instanceName === "OrLifeBot" ? "orlife" : `tenant_${instanceName}`,
    mode: "orlife_ai",
    webhookUrl: "",
    apiKey: "orl_sk_live_client_sec7f9a3b21",
    rateLimitPerMin: 30,
    systemPrompt: all.systemPrompt || "",
    aiEnabled: true,
    minDelaySec: 3,
    maxDelaySec: 8,
  };

  return NextResponse.json(instConfig);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const instanceName = (body.instanceName || "default").trim();

    // Try HTTP first
    try {
      const res = await fetch(`${AI_HUB_URL}/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(2500),
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      // Server offline — proceed to local file save
    }

    // Save directly to local ai-config.json
    const all = readLocalConfigFile();
    if (!all.instances) all.instances = {};
    const existing = all.instances[instanceName] || {};
    all.instances[instanceName] = { ...existing, ...body };
    writeLocalConfigFile(all);

    return NextResponse.json({ status: "SAVED_LOCAL_FILE", config: all.instances[instanceName] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to save configuration" }, { status: 500 });
  }
}
