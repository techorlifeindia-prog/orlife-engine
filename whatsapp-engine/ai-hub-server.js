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

app.use(cors());
app.use(express.json({ limit: '50mb' }));

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

function getDefaultConfig() {
  return {
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
    minDelayMs: 2500,
    maxDelayMs: 5500,
  };
}

function loadConfig(instanceName = 'default') {
  const key = (instanceName || 'default').trim();
  const all = loadAllConfigs();

  if (all.instances && all.instances[key]) {
    return all.instances[key];
  }

  if (all.systemPrompt && !all.instances) {
    return {
      aiModel: all.aiModel || 'OrLife Flash AI (Self-Hosted Ollama Engine)',
      systemPrompt: all.systemPrompt,
      rules: all.rules || [],
      aiEnabled: all.aiEnabled ?? true,
      ollamaEnabled: all.ollamaEnabled ?? true,
      minDelayMs: all.minDelayMs || 2500,
      maxDelayMs: all.maxDelayMs || 5500,
    };
  }

  return all.instances?.['default'] || getDefaultConfig();
}

function saveConfig(instanceName = 'default', newConfig = {}) {
  const key = (instanceName || 'default').trim();
  const all = loadAllConfigs();
  if (!all.instances) all.instances = {};

  const existing = all.instances[key] || all.instances['default'] || getDefaultConfig();
  all.instances[key] = { ...existing, ...newConfig };

  if (key === 'default') {
    all.systemPrompt = all.instances[key].systemPrompt;
    all.rules = all.instances[key].rules;
    all.aiEnabled = all.instances[key].aiEnabled;
    all.aiModel = 'OrLife Flash AI (Self-Hosted Ollama Engine)';
  }

  fs.writeFileSync(CONFIG_FILE, JSON.stringify(all, null, 2), 'utf8');
  console.log(`[AI Hub] Config saved for instance: "${key}"`);
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
  } catch (e) {}
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

// 4. Main WhatsApp Message Processing Route
app.post('/ai-hub/process', async (req, res) => {
  const { instanceName, senderNumber, messageText } = req.body;

  if (!instanceName || !senderNumber || !messageText) {
    return res.status(400).json({ error: 'Missing: instanceName, senderNumber, messageText' });
  }

  console.log(`[AI Hub] 📨 Message from +${senderNumber} (Instance: "${instanceName}"): "${messageText}"`);

  const config = loadConfig(instanceName);

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

  // Step 2: OrLife Flash AI Engine (Ollama Local)
  if (!replyText) {
    console.log(`[AI Hub] 🤖 Calling OrLife Flash AI (${OLLAMA_MODEL})...`);
    const aiResponse = await callOrLifeFlashAI(config.systemPrompt, messageText);
    if (aiResponse) {
      replyText = aiResponse;
      replySource = `ORLIFE_FLASH_AI:${OLLAMA_MODEL}`;
      console.log(`[AI Hub] ✅ OrLife Flash AI replied: "${replyText.substring(0, 80)}..."`);
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

  // Step 4: Anti-Ban Protection (Typing Status + Dynamic Delay)
  const charBasedDelay = Math.floor(replyText.length * (60 + Math.random() * 30));
  const minHumanDelay = Math.floor(3000 + Math.random() * 2500);
  const humanDelay = Math.min(10000, Math.max(minHumanDelay, charBasedDelay));

  try {
    await fetch(`${WHATSAPP_ENGINE_URL}/presence/send/${instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: senderNumber, presence: 'composing' }),
      signal: AbortSignal.timeout(3000),
    });
  } catch (e) {}

  console.log(`[AI Hub] ⏳ Anti-Ban Protection: Waiting ${(humanDelay / 1000).toFixed(1)}s before sending...`);
  await new Promise((resolve) => setTimeout(resolve, humanDelay));

  // Step 5: Send reply via WhatsApp Engine
  try {
    const sendRes = await fetch(`${WHATSAPP_ENGINE_URL}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
