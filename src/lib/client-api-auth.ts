import fs from "fs";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), "whatsapp-engine", "system-config.json");

/** Returns client key list from system-config.json */
function getClientKeys(): string[] {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
      return Array.isArray(cfg.clientKeys) ? cfg.clientKeys : [];
    }
  } catch {}
  return [];
}

/**
 * Validates Bearer token from Authorization header.
 * Returns null if valid, or an error message string if invalid.
 */
export function validateClientApiKey(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return "Missing Authorization header";
  const token = authHeader.slice(7).trim();
  if (!token.startsWith("orl_client_")) return "Invalid API key prefix";
  const validKeys = getClientKeys();
  if (!validKeys.includes(token)) return "Unauthorized: API key not found";
  return null; // valid
}
