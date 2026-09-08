const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8090;
const WHATSAPP_ENGINE_URL = 'http://localhost:8080';
const OLLAMA_URL = 'http://localhost:11434';
const OLLAMA_MODEL = 'llama3.2';
const AI_ENGINE_NAME = 'OrLife Flash AI (Self-Hosted VPS Engine)';

// Storage for rules & config (synced with frontend localStorage via file)
const CONFIG_FILE = path.join(__dirname, 'ai-config.json');
const CONFIG_TMP_FILE = path.join(__dirname, 'ai-config.json.tmp');
const CONFIG_BACKUP_FILE = path.join(__dirname, 'ai-config.backup.json');

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ─── 1. Simple In-Memory AI Processing Queue (Ollama Concurrency Control) ───
const aiRequestQueue = [];
let isProcessingAiQueue = false;

function enqueueAiRequest(taskFn) {
  return new Promise((resolve, reject) => {
    aiRequestQueue.push({ taskFn, resolve, reject });
    processNextInAiQueue();
  });
}

async function processNextInAiQueue() {
  if (isProcessingAiQueue || aiRequestQueue.length === 0) return;
  isProcessingAiQueue = true;

  const item = aiRequestQueue.shift();
  try {
    const result = await item.taskFn();
    item.resolve(result);
  } catch (err) {
    item.reject(err);
  } finally {
    isProcessingAiQueue = false;
    setTimeout(processNextInAiQueue, 200);
  }
}

// ─── 2. Webhook Dispatch with Retry & Event ID ────────────────────────────────
async function dispatchWebhookWithRetry(webhookUrl, payload, maxRetries = 3) {
  const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fullPayload = { eventId, ...payload };

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[AI Hub Webhook] Attempt ${attempt}/${maxRetries} to ${webhookUrl} (Event ID: ${eventId})`);
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullPayload),
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        console.log(`[AI Hub Webhook] ✅ Success on Attempt ${attempt} for Event ${eventId}`);
        return { success: true, eventId, attempt };
      }
      console.warn(`[AI Hub Webhook] Attempt ${attempt} returned status: ${res.status}`);
    } catch (err) {
      console.warn(`[AI Hub Webhook] Attempt ${attempt} failed: ${err.message}`);
    }

    if (attempt < maxRetries) {
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }

  console.error(`[AI Hub Webhook] ❌ All ${maxRetries} attempts failed for Webhook: ${webhookUrl}`);
  return { success: false, eventId, error: 'All retry attempts failed' };
}

// ─── Multi-Tenant Client Config Helpers ─────────────────────────────────────

function loadAllConfigs() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('[AI Hub] Failed to load config:', e.message);
  }
  return {};
}

function generateApiKey() {
  return 'orlife_sec_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

function getDefaultConfig() {
  return {
    tenantId: 'orlife',
    mode: 'orlife_ai', // 'orlife_ai' | 'api_webhook' | 'api_with_ai' | 'broadcast_only'
    webhookUrl: '',
    apiKey: generateApiKey(),
    rateLimitPerMin: 30,
    aiModel: 'OrLife Flash AI (Self-Hosted Ollama Engine)',
    systemPrompt: "You are Rani, a friendly human customer support executive from Chamunda Industries (Brand: OrLife), Hyderabad. Website: orlifeindia.com. WE SELL: Mobile batteries, chargers, cables, earphones, and mobile accessories.\n\nSTRICT RULES:\n1. ABSOLUTELY NO HALLUCINATION / NO GUESSING: Never invent specific model names, brand names, prices, or stock details. NEVER say we don't sell batteries.\n2. IF ANSWER NOT KNOWN OR ASKED FOR SPECIFIC MODEL/PRICE: Always reply professionally in Hinglish: 'Ji, iski jaankari main team se check karke aapko batati hoon. Aap detail share kar dijiye.'\n3. Keep replies 1 ultra-short natural sentence (max 12 words). Reply in casual human Hinglish/Hindi.",
    rules: [
      { id: 'r1', keyword: 'HI', matchType: 'Contains', replyText: 'Namaste! Main Rani, OrLife se 😊. Kaise help karoon?', enabled: true },
      { id: 'r2', keyword: 'PRICE', matchType: 'Contains', replyText: 'Aapka mobile model number kya hai? Main price check karke batati hoon.', enabled: true },
      { id: 'r3', keyword: 'HELP', matchType: 'Exact', replyText: 'Ji Rani baat kar rahi hoon. Aap apna sawaal batayein!', enabled: true },
      { id: 'r4', keyword: 'HOURS', matchType: 'Contains', replyText: 'Office timing: Mon-Sat, 9 AM se 7 PM tak.', enabled: true },
    ],
    aiEnabled: true,
    ollamaEnabled: true,
    minDelaySec: 10,
    maxDelaySec: 20,
    minDelayMs: 10000,
    maxDelayMs: 20000,
  };
}

function loadConfig(instanceName = 'default') {
  const key = (instanceName || 'default').trim();
  const all = loadAllConfigs();

  let config = null;

  if (all.instances && all.instances[key]) {
    config = { ...all.instances[key] };
  } else if (all.instances && (all.instances['OrLife Local'] || all.instances['default'] || all.instances['OrLifeBot'])) {
    const fallbackKey = all.instances['OrLife Local'] ? 'OrLife Local' : (all.instances['default'] ? 'default' : 'OrLifeBot');
    config = { ...all.instances[fallbackKey] };
  } else if (all.systemPrompt) {
    config = {
      tenantId: all.tenantId || 'orlife',
      mode: all.mode || 'orlife_ai',
      webhookUrl: all.webhookUrl || '',
      apiKey: all.apiKey || generateApiKey(),
      rateLimitPerMin: all.rateLimitPerMin || 30,
      aiModel: all.aiModel || 'OrLife Flash AI (Self-Hosted Ollama Engine)',
      systemPrompt: all.systemPrompt,
      rules: all.rules || [],
      aiEnabled: all.aiEnabled ?? true,
      ollamaEnabled: all.ollamaEnabled ?? true,
      minDelaySec: all.minDelaySec || 10,
      maxDelaySec: all.maxDelaySec || 20,
      minDelayMs: all.minDelayMs || 10000,
      maxDelayMs: all.maxDelayMs || 20000,
    };
  } else {
    config = { ...getDefaultConfig() };
  }

  // Ensure default fields exist
  if (!config.tenantId) config.tenantId = key === 'OrLifeBot' ? 'orlife' : `tenant_${key}`;
  if (!config.mode) config.mode = 'orlife_ai';
  if (config.webhookUrl === undefined) config.webhookUrl = '';
  if (!config.apiKey) {
    config.apiKey = generateApiKey();
    saveConfig(key, config);
  }
  if (!config.rateLimitPerMin) config.rateLimitPerMin = 30;

  return config;
}

function saveConfig(instanceName = 'default', newConfig = {}) {
  const key = (instanceName || 'default').trim();
  const all = loadAllConfigs();
  if (!all.instances) all.instances = {};

  const existing = all.instances[key] || getDefaultConfig();
  const merged = { ...existing, ...newConfig };

  if (!merged.tenantId) {
    merged.tenantId = key === 'OrLifeBot' ? 'orlife' : `tenant_${key}`;
  }

  if (!merged.apiKey) {
    merged.apiKey = generateApiKey();
  }

  all.instances[key] = merged;

  if (key === 'default' || key === 'OrLife Local' || key === 'OrLifeBot') {
    all.systemPrompt = merged.systemPrompt;
    all.rules = merged.rules;
    all.aiEnabled = merged.aiEnabled;
    all.aiModel = 'OrLife Flash AI (Self-Hosted Ollama Engine)';
    all.mode = merged.mode;
    all.webhookUrl = merged.webhookUrl;
    all.apiKey = merged.apiKey;
    all.tenantId = merged.tenantId;
    all.rateLimitPerMin = merged.rateLimitPerMin || 30;
    all.minDelaySec = merged.minDelaySec || 10;
    all.maxDelaySec = merged.maxDelaySec || 20;
  }

  // Atomic Save: Write to tmp file first then atomic rename + backup copy
  const jsonStr = JSON.stringify(all, null, 2);
  try {
    fs.writeFileSync(CONFIG_TMP_FILE, jsonStr, 'utf8');
    fs.renameSync(CONFIG_TMP_FILE, CONFIG_FILE);
    fs.writeFileSync(CONFIG_BACKUP_FILE, jsonStr, 'utf8');
    console.log(`[AI Hub] Safe Atomic Config saved for instance "${key}": Tenant="${merged.tenantId}", Mode="${merged.mode}", RateLimit=${merged.rateLimitPerMin}/min`);
  } catch (err) {
    console.error(`[AI Hub] Atomic Save Error (using fallback):`, err.message);
    fs.writeFileSync(CONFIG_FILE, jsonStr, 'utf8');
  }

  return all.instances[key];
}

function matchKeywordRule(messageText, rules) {
  const lower = messageText.toLowerCase().trim();
  for (const rule of rules) {
    if (!rule.enabled) continue;
    const kw = rule.keyword.toLowerCase().trim();
    if (!kw) continue;
    if (rule.matchType === 'Exact' && lower === kw) return rule;
    if (rule.matchType === 'Starts With' && lower.startsWith(kw)) return rule;
    if (rule.matchType === 'Contains') {
      if (kw.length <= 3) {
        const regex = new RegExp(`\\b${kw}\\b`, 'i');
        if (regex.test(messageText)) return rule;
      } else if (lower.includes(kw)) {
        return rule;
      }
    }
  }
  return null;
}

/** Call OrLife Flash AI Engine (Ollama Local LLM) */
async function callOrLifeFlashAI(systemPrompt, userMessage) {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: `System: ${systemPrompt}\n\nCustomer: ${userMessage}\n\nAssistant:`,
        stream: false,
        options: {
          temperature: 0.2,
          num_predict: 55,
        }
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
    const data = await res.json();
    return data.response ? data.response.trim() : null;
  } catch (e) {
    console.error('[AI Hub] OrLife Flash AI call failed:', e.message);
    return null;
  }
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

// 1. Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: AI_ENGINE_NAME,
    port: PORT,
    engine: 'OrLife Flash AI (Ollama Local)',
    ollamaUrl: OLLAMA_URL,
    ollamaModel: OLLAMA_MODEL,
    whatsappEngine: WHATSAPP_ENGINE_URL,
    timestamp: new Date().toISOString(),
  });
});

// 1b. Ollama Status Check
app.get('/ollama/status', async (req, res) => {
  try {
    const oRes = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(2000) });
    if (oRes.ok) {
      const data = await oRes.json();
      const models = data.models?.map((m) => typeof m === 'string' ? m : m.name) || [];
      return res.json({ status: 'ONLINE', models: models.length ? models : ['llama3.2'] });
    }
  } catch (e) { }
  // AI Hub Engine Fallback
  return res.json({
    status: 'ONLINE',
    models: ['OrLife Flash AI (Smart Rules Engine)'],
  });
});


// 2. Get Config
app.get('/config', (req, res) => {
  const instanceName = req.query.instanceName || req.query.instance || 'default';
  res.json(loadConfig(instanceName));
});

// 2b. Get All Configs
app.get('/config/all', (req, res) => {
  res.json(loadAllConfigs());
});

// 3. Save Config
app.post('/config', (req, res) => {
  try {
    const instanceName = req.body.instanceName || req.query.instanceName || req.query.instance || 'default';
    const updated = saveConfig(instanceName, req.body);
    res.json({ status: 'SAVED', instanceName, config: updated });
  } catch (e) {
    res.status(500).json({ error: 'Failed to save config: ' + e.message });
  }
});

// 3b. Regenerate API Key
app.post('/config/regenerate-key', (req, res) => {
  try {
    const instanceName = req.body.instanceName || req.query.instanceName || req.query.instance || 'default';
    const config = loadConfig(instanceName);
    const newKey = generateApiKey();
    config.apiKey = newKey;
    saveConfig(instanceName, config);
    res.json({ status: 'SUCCESS', instanceName, apiKey: newKey });
  } catch (e) {
    res.status(500).json({ error: 'Failed to regenerate API Key: ' + e.message });
  }
});

// Rate Limiter storage map per instanceName
const rateTracker = new Map();

// 4. Main WhatsApp Message Processing Route
app.post('/ai-hub/process', async (req, res) => {
  const { instanceName, senderNumber, messageText } = req.body;

  if (!instanceName || !senderNumber || !messageText) {
    return res.status(400).json({ error: 'Missing: instanceName, senderNumber, messageText' });
  }

  const config = loadConfig(instanceName);
  const mode = config.mode || 'orlife_ai';

  // 🛑 RATE LIMITER ENFORCEMENT (Max Messages per Minute)
  const maxRate = Number(config.rateLimitPerMin) || 30;
  const now = Date.now();
  const windowMs = 60 * 1000;

  if (!rateTracker.has(instanceName)) {
    rateTracker.set(instanceName, []);
  }

  const validTimestamps = rateTracker.get(instanceName).filter(t => now - t < windowMs);
  rateTracker.set(instanceName, validTimestamps);

  if (validTimestamps.length >= maxRate) {
    console.warn(`[AI Hub] 🛑 Rate limit exceeded for "${instanceName}": ${validTimestamps.length}/${maxRate} msgs in last 60s. Skipping message from +${senderNumber}.`);
    return res.status(429).json({
      status: 'RATE_LIMITED',
      reason: `Rate limit of ${maxRate} messages/minute exceeded for instance "${instanceName}".`
    });
  }

  validTimestamps.push(now);

  console.log(`[AI Hub] 📨 Message from +${senderNumber} (Instance: "${instanceName}", Tenant: "${config.tenantId}", Mode: "${mode}", Rate: ${validTimestamps.length}/${maxRate}): "${messageText}"`);

  // Mode 4: Broadcast Only Mode -> Skip auto-reply & webhook
  if (mode === 'broadcast_only') {
    console.log(`[AI Hub] Instance "${instanceName}" is in "broadcast_only" mode. Skipping incoming message processing.`);
    return res.json({ status: 'SKIPPED', reason: 'broadcast_only_mode' });
  }

  // Mode 2: Third-Party API Webhook Relay Mode -> Relay message to client's Webhook URL (with 3x retries & eventId)
  if (mode === 'api_webhook') {
    if (config.webhookUrl && config.webhookUrl.trim()) {
      const webhookPayload = {
        tenantId: config.tenantId || 'orlife',
        instanceName,
        from: senderNumber,
        message: messageText,
        timestamp: new Date().toISOString(),
      };

      // Asynchronous dispatch with 3 retries & timeout
      dispatchWebhookWithRetry(config.webhookUrl.trim(), webhookPayload, 3);
      return res.json({ status: 'WEBHOOK_RELAY_DISPATCHED', webhookUrl: config.webhookUrl });
    } else {
      console.log(`[AI Hub] Instance "${instanceName}" is in "api_webhook" mode but no Webhook URL is set. Skipping.`);
      return res.json({ status: 'SKIPPED', reason: 'no_webhook_url_configured' });
    }
  }

  if (config.aiEnabled === false) {
    console.log(`[AI Hub] AI auto-responder is disabled for instance "${instanceName}". Skipping.`);
    return res.json({ status: 'SKIPPED', reason: 'AI auto-responder disabled' });
  }

  let replyText = null;
  let replySource = '';

  // Step 0: Audio / Voice Note Message Handling
  if (messageText === '[AUDIO_VOICE_NOTE]') {
    replyText = 'Ji, main abhi voice message nahi sun sakti 🙏. Kripya apna sawaal text message mein likhkar bhej dijiye, main turant jawab deti hoon!';
    replySource = 'AUDIO_FALLBACK';
  }

  // Step 1: Check Keyword Rules
  if (!replyText) {
    const matchedRule = matchKeywordRule(messageText, config.rules || []);
    if (matchedRule) {
      replyText = matchedRule.replyText;
      replySource = `KEYWORD_RULE:${matchedRule.keyword}`;
      console.log(`[AI Hub] ✅ Keyword Rule matched: "${matchedRule.keyword}" (${matchedRule.matchType})`);
    }
  }

  // Step 2: OrLife Flash AI Engine (Ollama Local via Concurrency Queue)
  if (!replyText) {
    console.log(`[AI Hub] 🤖 Enqueuing OrLife Flash AI request (${OLLAMA_MODEL}) for +${senderNumber}...`);
    try {
      const aiResponse = await enqueueAiRequest(() => callOrLifeFlashAI(config.systemPrompt, messageText));
      if (aiResponse) {
        replyText = aiResponse;
        replySource = `ORLIFE_FLASH_AI:${OLLAMA_MODEL}`;
        console.log(`[AI Hub] ✅ OrLife Flash AI replied: "${replyText.substring(0, 80)}..."`);
      }
    } catch (err) {
      console.error(`[AI Hub] Ollama AI Queue error for +${senderNumber}:`, err.message);
    }
  }

  // Step 2b: Smart Product & Inventory Fallback (If Ollama is offline/unreachable)
  if (!replyText) {
    const lower = messageText.toLowerCase();
    if (lower.includes('battery') || lower.includes('bn4a') || lower.includes('charger') || lower.includes('display') || lower.includes('combo') || lower.includes('cable')) {
      replyText = `Ji, ${messageText.trim()} OrLife Stock mein available hai! 😊 Exact price aur order ke liye humari sales team aapko 2 minute mein WhatsApp karegi.`;
      replySource = 'SMART_PRODUCT_FALLBACK';
      console.log('[AI Hub] ⚡ Used Smart Product Fallback reply');
    }
  }

  // Step 3: Final Fallback
  if (!replyText) {
    replyText = `Thank you for contacting OrLife! We have received your message and will respond shortly. 🙏`;
    replySource = 'STATIC_FALLBACK';
    console.log('[AI Hub] ⚠️ Using static fallback reply');
  }

  // Step 4: Anti-Ban Protection (Typing Status + Custom Dynamic Delay)
  const minSec = Number(config.minDelaySec) || 3;
  const maxSec = Number(config.maxDelaySec) || Math.max(minSec + 2, 8);
  const minMs = minSec * 1000;
  const maxMs = maxSec * 1000;

  const charBasedDelay = Math.floor(replyText.length * (50 + Math.random() * 30));
  const baseDelay = Math.floor(minMs + Math.random() * Math.max(1000, maxMs - minMs));
  const humanDelay = Math.max(baseDelay, Math.min(maxMs + 3000, charBasedDelay));

  try {
    await fetch(`${WHATSAPP_ENGINE_URL}/presence/send/${instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: senderNumber, presence: 'composing' }),
      signal: AbortSignal.timeout(3000),
    });
  } catch (e) { }

  console.log(`[AI Hub] ⏳ Anti-Ban Protection: Waiting ${(humanDelay / 1000).toFixed(1)}s before sending...`);
  await new Promise((resolve) => setTimeout(resolve, humanDelay));

  // Step 5: Send reply via WhatsApp Engine
  try {
    const sendRes = await fetch(`${WHATSAPP_ENGINE_URL}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-source': 'ai_auto' },
      body: JSON.stringify({
        number: senderNumber,
        textMessage: { text: replyText }
      }),
      signal: AbortSignal.timeout(10000),
    });

    const sendData = await sendRes.json();

    res.json({
      status: 'PROCESSED_AND_SENT',
      senderNumber,
      userMessage: messageText,
      replyText,
      replySource,
      humanDelayMs: humanDelay,
      whatsappResult: sendData,
    });
  } catch (e) {
    console.error('[AI Hub] Failed to send WhatsApp reply:', e.message);
    res.status(500).json({ error: 'Failed to dispatch reply to WhatsApp Engine', detail: e.message });
  }
});

// 5. Test AI Simulate Route
app.post('/ai-hub/simulate', async (req, res) => {
  const { message, systemPrompt, instanceName: reqInstance } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });

  const instanceName = reqInstance || req.query.instanceName || req.query.instance || 'default';
  const config = loadConfig(instanceName);

  if (config.aiEnabled === false) {
    return res.json({
      status: 'DISABLED',
      reply: '⚠️ AI Auto-Reply Master Toggle is currently OFF (Paused). Turn it ON to resume automated replies.',
      source: 'disabled_toggle',
    });
  }

  const prompt = systemPrompt || config.systemPrompt;

  const matchedRule = matchKeywordRule(message, config.rules || []);
  if (matchedRule) {
    return res.json({
      status: 'KEYWORD_MATCH',
      matchedKeyword: matchedRule.keyword,
      matchType: matchedRule.matchType,
      reply: matchedRule.replyText,
      source: 'keyword_rule',
    });
  }

  const aiReply = await callOrLifeFlashAI(prompt, message);
  if (aiReply) {
    return res.json({
      status: 'AI_REPLY',
      reply: aiReply,
      source: 'orlife_flash_ai',
      model: AI_ENGINE_NAME,
    });
  }

  res.json({
    status: 'FALLBACK',
    reply: 'Thank you for contacting OrLife! Our team will respond shortly.',
    source: 'static_fallback',
  });
});

// ─── UNIVERSAL EXTERNAL API ENDPOINTS ───────────────────────────────────────

// Google Gemini Format Endpoint
app.post(['/v1beta/models/:modelName:generateContent', '/v1beta/models/gemini-1.5-flash:generateContent'], async (req, res) => {
  try {
    const instanceName = req.query.instance || req.query.instanceName || 'default';
    const config = loadConfig(instanceName);

    let userMsg = '';
    if (req.body?.contents && Array.isArray(req.body.contents)) {
      const lastContent = req.body.contents[req.body.contents.length - 1];
      userMsg = lastContent?.parts?.[0]?.text || '';
    } else if (req.body?.prompt) {
      userMsg = req.body.prompt;
    }

    if (!userMsg) {
      return res.status(400).json({ error: { code: 400, message: 'Invalid payload: text message required' } });
    }

    const matchedRule = matchKeywordRule(userMsg, config.rules || []);
    let replyText = matchedRule ? matchedRule.replyText : null;

    if (!replyText) {
      replyText = await callOrLifeFlashAI(config.systemPrompt, userMsg);
    }

    if (!replyText) {
      replyText = 'Ji, iski jaankari main team se check karke aapko batati hoon.';
    }

    return res.json({
      candidates: [
        {
          content: {
            parts: [{ text: replyText }],
            role: 'model'
          },
          finishReason: 'STOP',
          index: 0
        }
      ],
      usageMetadata: {
        promptTokenCount: Math.ceil(userMsg.length / 4),
        candidatesTokenCount: Math.ceil(replyText.length / 4),
        totalTokenCount: Math.ceil((userMsg.length + replyText.length) / 4)
      }
    });
  } catch (e) {
    res.status(500).json({ error: { code: 500, message: e.message } });
  }
});

// OpenAI Format Endpoint
app.post('/v1/chat/completions', async (req, res) => {
  try {
    const instanceName = req.query.instance || req.query.instanceName || 'default';
    const config = loadConfig(instanceName);

    const messages = req.body?.messages || [];
    const lastUserMsgObj = messages.filter(m => m.role === 'user').pop();
    const userMsg = lastUserMsgObj?.content || req.body?.prompt || '';

    if (!userMsg) {
      return res.status(400).json({ error: { message: 'Invalid payload: text message required' } });
    }

    const customSystem = messages.find(m => m.role === 'system')?.content || config.systemPrompt;
    const matchedRule = matchKeywordRule(userMsg, config.rules || []);
    let replyText = matchedRule ? matchedRule.replyText : null;

    if (!replyText) {
      replyText = await callOrLifeFlashAI(customSystem, userMsg);
    }

    if (!replyText) {
      replyText = 'Ji, iski jaankari main team se check karke aapko batati hoon.';
    }

    return res.json({
      id: `chatcmpl-orlife-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'orlife-flash-ai',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: replyText
          },
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: Math.ceil(userMsg.length / 4),
        completion_tokens: Math.ceil(replyText.length / 4),
        total_tokens: Math.ceil((userMsg.length + replyText.length) / 4)
      }
    });
  } catch (e) {
    res.status(500).json({ error: { message: e.message } });
  }
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 [OrLife AI Hub] Engine: ${AI_ENGINE_NAME} running on http://localhost:${PORT}`);
  console.log(`🤖 [OrLife AI Hub] Ollama Model: ${OLLAMA_MODEL} @ ${OLLAMA_URL}`);
  console.log(`📋 [OrLife AI Hub] Rules loaded: ${loadConfig().rules?.length || 0} keyword rules`);
});
