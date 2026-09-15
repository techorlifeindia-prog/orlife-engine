import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CONFIG_FILE_PATH = path.join(process.cwd(), "whatsapp-engine", "system-config.json");

// Default system configurations
const DEFAULT_CONFIG = {
  whatsapp: {
    gatewayUrl: "http://localhost:8080",
    sessionKey: "OrLifeBot",
    apiToken: "orl_sk_live_master",
  },
  ai: {
    aiBaseUrl: "http://localhost:8090",
    aiModelName: "llama3.2",
    aiSecretKey: "orl_sec_ai_master_key",
  },
  system: {
    webhookUrl: "http://localhost:7001/api/webhook/whatsapp",
    events: {
      MESSAGES_UPSERT: true,
      CONNECTION_UPDATE: true,
      QRCODE_UPDATED: true,
      SEND_MESSAGE: false,
    }
  }
};

function readConfigFile() {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const raw = fs.readFileSync(CONFIG_FILE_PATH, "utf8");
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error("[System Config] Failed to read local system-config.json:", e);
  }
  return DEFAULT_CONFIG;
}

function writeConfigFile(data: any) {
  try {
    // Ensure directory exists
    const dir = path.dirname(CONFIG_FILE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("[System Config] Failed to write local system-config.json:", e);
  }
}

export async function GET() {
  const config = readConfigFile();
  return NextResponse.json(config);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const currentConfig = readConfigFile();
    
    // Deep merge the incoming body with current config
    const updatedConfig = {
      whatsapp: { ...currentConfig.whatsapp, ...(body.whatsapp || {}) },
      ai: { ...currentConfig.ai, ...(body.ai || {}) },
      system: { ...currentConfig.system, ...(body.system || {}) },
    };

    writeConfigFile(updatedConfig);
    return NextResponse.json({ status: "success", config: updatedConfig });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to save system configuration" }, { status: 500 });
  }
}
