const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Prevent transient Baileys socket errors from crashing the server
process.on('uncaughtException', (err) => {
  console.error('[WhatsApp Engine] Uncaught Exception caught safely:', err?.message || err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[WhatsApp Engine] Unhandled Rejection caught safely:', reason?.message || reason);
});

const PORT = 8080;
const SESSIONS_DIR = path.join(__dirname, 'sessions');

if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

// In-memory store for active sessions and latest QR codes
const sessions = new Map();

// Per-instance message counters (resets on server restart — persistent version uses file below)
const messageCounters = new Map(); // instanceName → { sent: number, failed: number }
const COUNTERS_FILE = path.join(__dirname, 'message_counts.json');

// Load persisted counts from disk on startup
function loadCounters() {
  try {
    if (fs.existsSync(COUNTERS_FILE)) {
      const data = JSON.parse(fs.readFileSync(COUNTERS_FILE, 'utf8'));
      for (const [k, v] of Object.entries(data)) {
        messageCounters.set(k, v);
      }
      console.log('[Counter] Loaded persisted message counts from disk.');
    }
  } catch (e) {
    console.warn('[Counter] Could not load counts file:', e.message);
  }
}

// Persist counts to disk (debounced — max once every 10s)
let _saveTimer = null;
function saveCounters() {
  if (_saveTimer) return;
  _saveTimer = setTimeout(() => {
    try {
      const obj = {};
      for (const [k, v] of messageCounters) obj[k] = v;
      fs.writeFileSync(COUNTERS_FILE, JSON.stringify(obj, null, 2));
    } catch (e) {
      console.warn('[Counter] Could not save counts file:', e.message);
    }
    _saveTimer = null;
  }, 10000);
}

function incrementCounter(instanceName, success = true, source = 'manual') {
  const current = messageCounters.get(instanceName) || { sent: 0, failed: 0, aiSent: 0, bulkSent: 0 };
  if (success) {
    current.sent += 1;
    if (source === 'ai_auto') {
      current.aiSent = (current.aiSent || 0) + 1;
    } else {
      current.bulkSent = (current.bulkSent || 0) + 1;
    }
  } else {
    current.failed += 1;
  }
  messageCounters.set(instanceName, current);
  saveCounters();
}

loadCounters();

// In-memory LRU cache for sent messages to satisfy Baileys Signal retry receipts
const recentSentMessages = new Map();
function cacheSentMessage(keyId, message) {
  if (!keyId || !message) return;
  recentSentMessages.set(keyId, message);
  if (recentSentMessages.size > 2000) {
    const firstKey = recentSentMessages.keys().next().value;
    if (firstKey) recentSentMessages.delete(firstKey);
  }
}

function formatPhoneNumber(rawJid) {
  if (!rawJid) return null;
  const numOnly = rawJid.split(':')[0].split('@')[0].replace(/\D/g, '');
  if (!numOnly) return null;
  return `+${numOnly}`;
}

async function createWhatsAppSession(instanceName) {
  if (sessions.has(instanceName)) {
    return sessions.get(instanceName);
  }

  const sessionPath = path.join(SESSIONS_DIR, instanceName);
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

  const socket = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    defaultQueryTimeoutMs: 60000,
    syncFullHistory: false,
    getMessage: async (key) => {
      if (key && key.id && recentSentMessages.has(key.id)) {
        return recentSentMessages.get(key.id);
      }
      return undefined;
    },
  });

  const sessionObj = {
    socket,
    state,
    qrCodeBase64: null,
    status: 'connecting',
    owner: null,
    profileName: null,
    contacts: new Map(),
  };

  sessions.set(instanceName, sessionObj);

  socket.ev.on('creds.update', saveCreds);

  socket.ev.on('contacts.upsert', (contacts) => {
    for (const c of contacts) {
      const name = c.name || c.notify || c.pushName || c.verifiedName;
      if (name) {
        if (c.id) sessionObj.contacts.set(c.id, name);
        if (c.lid) sessionObj.contacts.set(c.lid, name);
      }
    }
  });

  socket.ev.on('contacts.update', (updates) => {
    for (const c of updates) {
      const name = c.name || c.notify || c.pushName || c.verifiedName;
      if (name) {
        if (c.id) sessionObj.contacts.set(c.id, name);
        if (c.lid) sessionObj.contacts.set(c.lid, name);
      }
    }
  });

  socket.ev.on('messages.upsert', async (m) => {
    if (m.type !== 'notify') return;
    for (const msg of m.messages) {
      if (msg.key.fromMe) continue;
      const fromJid = msg.key.remoteJid;
      if (!fromJid || fromJid === 'status@broadcast' || fromJid.endsWith('@g.us')) continue;
      
      // Skip newsletters / channels / broadcast lists
      if (fromJid.endsWith('@newsletter') || fromJid.endsWith('@broadcast')) continue;

      // Resolve Real Phone JID if incoming message uses LID (Linked Device Identifier) or multi-device format
      let realJid = fromJid;
      const possiblePn = 
        msg.sender_pn ||
        msg.key?.sender_pn ||
        msg.senderPn ||
        msg.key?.senderPn ||
        msg.key?.remoteJidAlt ||
        msg.participant_pn ||
        msg.key?.participant_pn ||
        msg.participant ||
        msg.key?.participant;

      if (possiblePn && typeof possiblePn === 'string' && (possiblePn.includes('@s.whatsapp.net') || possiblePn.includes('@lid'))) {
        realJid = possiblePn;
      }

      const cleanPhone = formatPhoneNumber(realJid) || formatPhoneNumber(fromJid);

      // Only skip if we couldn't resolve any valid phone number OR JID
      if (!cleanPhone && realJid.includes('@lid')) {
        console.log(`[WhatsApp Engine] Skipping unresolvable LID message: ${realJid}`);
        continue;
      }

      const isAudio = !!(msg.message?.audioMessage || msg.message?.ptt);
      const isImage = !!(msg.message?.imageMessage);
      const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.imageMessage?.caption || (isAudio ? '[AUDIO_VOICE_NOTE]' : '');
      const pushName = msg.pushName || 'Customer';

      // Skip messages from our own linked numbers (prevents loop)
      const ownNumbers = ['918002821800', '919346037212'];
      const numOnly = (cleanPhone || '').replace(/\D/g, '');
      if (ownNumbers.some(own => numOnly.includes(own) || own.includes(numOnly))) {
        continue;
      }

      // Store in session contacts for pushName lookups
      if (cleanPhone && cleanPhone.length >= 10 && !cleanPhone.startsWith('14757')) {
        sessionObj.contacts.set(`${cleanPhone}@s.whatsapp.net`, { pushName, name: pushName });
      }

      const webhookPayload = {
        instanceName: instanceName,
        from: cleanPhone,
        rawFrom: fromJid,
        pushname: pushName,
        name: pushName,
        message: body,
        messageType: isAudio ? 'audioMessage' : isImage ? 'imageMessage' : 'text',
        timestamp: msg.messageTimestamp
      };

      console.log(`[WhatsApp Engine] Incoming message from +${cleanPhone}: "${body}" -> Forwarding to AI Hub Webhook`);
      
      try {
        // 1. Forward to Dedicated AI Hub Bridge Server on Port 8090 (Skip for system OTP messages)
        const isOtpMsg = body.includes("OrLife Portal Login OTP") || body.includes("verification code") || body.includes("OTP");
        if (body && body.trim().length > 0 && !isOtpMsg) {
          fetch('http://127.0.0.1:8090/ai-hub/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              instanceName: instanceName,
              senderNumber: (cleanPhone && cleanPhone.length >= 10 && cleanPhone.length <= 13) ? cleanPhone : fromJid,
              messageText: body
            })
          }).catch(err => console.error('[WhatsApp Engine] Port 8090 AI Dispatch error:', err.message));

        }

        // 2. Forward to Port 8001 and 7001 webhooks
        fetch('http://127.0.0.1:8001/api/webhook/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookPayload)
        }).catch(err => {});
        
        fetch('http://127.0.0.1:7001/api/webhook/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookPayload)
        }).catch(err => {});
      } catch (e) {}
    }
  });

  socket.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      try {
        const qrBase64 = await QRCode.toDataURL(qr);
        sessionObj.qrCodeBase64 = qrBase64;
      } catch (err) {
        console.error('Error generating QR code Base64:', err);
      }
    }

    if (connection === 'open') {
      sessionObj.status = 'open';
      sessionObj.qrCodeBase64 = null;
      sessionObj.owner = formatPhoneNumber(socket.user?.id || state.creds.me?.id) || 'Connected WhatsApp Account';
      sessionObj.profileName = socket.user?.name || socket.user?.notify || state.creds.me?.name || 'WhatsApp Account';
      console.log(`[WhatsApp Engine] Connected: ${instanceName} -> ${sessionObj.owner} (${sessionObj.profileName})`);
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      console.log(`[WhatsApp Engine] Connection closed for ${instanceName}, reason code: ${statusCode}`);
      sessionObj.status = 'close';
      sessionObj.qrCodeBase64 = null;

      if (sessionObj.isManualDelete) {
        console.log(`[WhatsApp Engine] Instance "${instanceName}" was manually deleted. Skipping auto-reconnect.`);
        return;
      }

      const isLoggedOut = statusCode === DisconnectReason.loggedOut || statusCode === 401 || statusCode === 403;
      if (isLoggedOut) {
        console.log(`[WhatsApp Engine] Session logged out / expired (${statusCode}) for ${instanceName}. Purging expired credentials.`);
        const sessionPath = path.join(SESSIONS_DIR, instanceName);
        if (fs.existsSync(sessionPath)) {
          fs.rmSync(sessionPath, { recursive: true, force: true });
        }
      }

      console.log(`[WhatsApp Engine] Re-initializing instance for fresh QR scan: ${instanceName}`);
      sessions.delete(instanceName);
      createWhatsAppSession(instanceName);
    }
  });

  return sessionObj;
}

// 1. Fetch All Instances (Return both connected and disconnected instances)
app.get('/instance/fetchInstances', (req, res) => {
  const list = [];
  const processedKeys = new Set();

  sessions.forEach((val, key) => {
    processedKeys.add(key);
    const phoneOwner = formatPhoneNumber(val.socket?.user?.id || val.state?.creds?.me?.id) || val.owner;
    const nameOwner = val.socket?.user?.name || val.socket?.user?.notify || val.state?.creds?.me?.name || val.profileName;
    list.push({
      instanceName: key,
      status: val.status || 'close',
      owner: phoneOwner || null,
      profileName: nameOwner || key,
    });
  });

  // Also check session directories on disk in case session folder exists but session is closed
  if (fs.existsSync(SESSIONS_DIR)) {
    const folders = fs.readdirSync(SESSIONS_DIR);
    for (const folder of folders) {
      if (!processedKeys.has(folder)) {
        const fullPath = path.join(SESSIONS_DIR, folder);
        if (fs.statSync(fullPath).isDirectory()) {
          list.push({
            instanceName: folder,
            status: 'close',
            owner: null,
            profileName: folder,
          });
        }
      }
    }
  }

  res.json(list);
});

// 2. Create Instance
app.post('/instance/create', async (req, res) => {
  const { instanceName } = req.body;
  if (!instanceName) {
    return res.status(400).json({ error: 'instanceName is required' });
  }

  const sessionObj = await createWhatsAppSession(instanceName);
  res.json({
    instance: {
      instanceName,
      status: sessionObj.status,
    },
  });
});

// 3. Connect & Fetch Real QR Code Base64
app.get('/instance/connect/:instanceName', async (req, res) => {
  const { instanceName } = req.params;
  let sessionObj = sessions.get(instanceName);

  if (!sessionObj || sessionObj.status === 'close') {
    if (sessionObj) sessions.delete(instanceName);
    sessionObj = await createWhatsAppSession(instanceName);
  }

  const phoneOwner = formatPhoneNumber(sessionObj.socket?.user?.id || sessionObj.state?.creds?.me?.id) || sessionObj.owner;
  const nameOwner = sessionObj.socket?.user?.name || sessionObj.socket?.user?.notify || sessionObj.state?.creds?.me?.name || sessionObj.profileName;

  res.json({
    code: 'real-whatsapp-qr',
    base64: sessionObj.qrCodeBase64 || null,
    status: sessionObj.status,
    owner: phoneOwner || null,
    profileName: nameOwner || null,
  });
});

const sendRateTracker = new Map();

function getInstanceRateLimit(instanceName) {
  try {
    const CONFIG_FILE = path.join(__dirname, 'ai-config.json');
    if (fs.existsSync(CONFIG_FILE)) {
      const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      const key = (instanceName || 'default').trim();
      const inst = data.instances?.[key] || data.instances?.['OrLife Local'] || data.instances?.['default'] || data.instances?.['OrLifeBot'];
      if (inst && inst.rateLimitPerMin) {
        return Number(inst.rateLimitPerMin) || 30;
      }
      if (data.rateLimitPerMin) {
        return Number(data.rateLimitPerMin) || 30;
      }
    }
  } catch (e) {}
  return 30;
}

function checkAndRecordRateLimit(instanceName, isOtp = false) {
  const maxRate = getInstanceRateLimit(instanceName);
  const now = Date.now();
  const windowMs = 60 * 1000;
  const key = (instanceName || 'default').trim().toLowerCase();

  if (!sendRateTracker.has(key)) {
    sendRateTracker.set(key, []);
  }

  const validTimestamps = sendRateTracker.get(key).filter(t => now - t < windowMs);
  sendRateTracker.set(key, validTimestamps);

  // OTP authentication messages bypass strict rate limiter
  if (isOtp) {
    validTimestamps.push(now);
    return { allowed: true, currentRate: validTimestamps.length, maxRate };
  }

  if (validTimestamps.length >= maxRate) {
    console.warn(`[WhatsApp Engine] 🛑 Rate limit exceeded for "${instanceName}": ${validTimestamps.length}/${maxRate} msgs in last 60s.`);
    return { allowed: false, currentRate: validTimestamps.length, maxRate };
  }

  validTimestamps.push(now);
  return { allowed: true, currentRate: validTimestamps.length, maxRate };
}

// 4a. Send Text Message
app.post('/message/sendText/:instanceName', async (req, res) => {
  const { instanceName } = req.params;
  const { number, textMessage, text, message } = req.body || {};
  const source = req.headers['x-source'] || 'manual';

  const sessionObj = sessions.get(instanceName);
  if (!sessionObj || sessionObj.status !== 'open') {
    return res.status(400).json({ error: 'WhatsApp instance is not connected. Please scan QR first.' });
  }

  if (!number || (typeof number !== 'string' && typeof number !== 'number')) {
    return res.status(400).json({ error: 'Recipient phone number is required' });
  }

  const msgContent = typeof textMessage === 'object' && textMessage?.text
    ? textMessage.text
    : (typeof textMessage === 'string' ? textMessage : (text || message || ''));

  if (!msgContent) {
    return res.status(400).json({ error: 'Message content text is required' });
  }

  const isOtp = msgContent.includes("OrLife Portal Login OTP") || msgContent.includes("verification code") || msgContent.includes("OTP");

  // 🛑 Strict Rate Limit Check across ALL message sources (Max X msgs per minute)
  const rateLimitCheck = checkAndRecordRateLimit(instanceName, isOtp);
  if (!rateLimitCheck.allowed) {
    return res.status(429).json({
      error: `Rate limit of ${rateLimitCheck.maxRate} messages/minute exceeded for instance "${instanceName}". (${rateLimitCheck.currentRate}/${rateLimitCheck.maxRate} sent in last 60 seconds).`
    });
  }

  try {
    let rawStr = String(number);
    let jid = rawStr;
    if (!jid.includes('@')) {
      let cleanNumber = rawStr.replace(/\D/g, '');
      if (cleanNumber.length === 10) {
        cleanNumber = '91' + cleanNumber;
      }
      jid = `${cleanNumber}@s.whatsapp.net`;
    }

    console.log(`[WhatsApp Engine] Sending Text to JID: ${jid} (source: ${source}, Rate: ${rateLimitCheck.currentRate}/${rateLimitCheck.maxRate})`);
    const sentMsg = await sessionObj.socket.sendMessage(jid, { text: msgContent });
    if (sentMsg?.key?.id && sentMsg?.message) {
      cacheSentMessage(sentMsg.key.id, sentMsg.message);
    }
    incrementCounter(instanceName, true, source);
    res.json({ status: 'SENT', key: sentMsg.key, to: jid });
  } catch (error) {
    console.error('Error sending message:', error);
    incrementCounter(instanceName, false, source);
    res.status(500).json({ error: 'Failed to send WhatsApp message', details: error.message });
  }
});


// 4a2. Send Presence Update (Typing / Composing) for Anti-Ban Human Simulation
app.post('/presence/send/:instanceName', async (req, res) => {
  const { instanceName } = req.params;
  const { number, presence } = req.body;

  const sessionObj = sessions.get(instanceName);
  if (!sessionObj || sessionObj.status !== 'open') {
    return res.status(400).json({ error: 'WhatsApp instance is not connected.' });
  }

  try {
    let jid = number;
    if (!jid.includes('@')) {
      let cleanNumber = number.replace(/\D/g, '');
      if (cleanNumber.length === 10) cleanNumber = '91' + cleanNumber;
      jid = `${cleanNumber}@s.whatsapp.net`;
    }

    if (sessionObj.socket?.sendPresenceUpdate) {
      await sessionObj.socket.sendPresenceUpdate(presence || 'composing', jid);
    }
    res.json({ status: 'PRESENCE_SENT', presence: presence || 'composing', to: jid });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send presence update', details: error.message });
  }
});

// 4b. Send Image / Media Message
app.post('/message/sendMedia/:instanceName', async (req, res) => {
  const { instanceName } = req.params;
  const { number, mediaUrl, caption } = req.body;

  const sessionObj = sessions.get(instanceName);
  if (!sessionObj || sessionObj.status !== 'open') {
    return res.status(400).json({ error: 'WhatsApp instance is not connected. Please scan QR first.' });
  }

  // 🛑 Strict Rate Limit Check for Media
  const rateLimitCheck = checkAndRecordRateLimit(instanceName, false);
  if (!rateLimitCheck.allowed) {
    return res.status(429).json({
      error: `Rate limit of ${rateLimitCheck.maxRate} messages/minute exceeded for instance "${instanceName}". (${rateLimitCheck.currentRate}/${rateLimitCheck.maxRate} sent in last 60 seconds).`
    });
  }

  try {
    let cleanNumber = number.replace(/\D/g, '');
    if (cleanNumber.length === 10) cleanNumber = '91' + cleanNumber;

    if (cleanNumber.length < 11) {
      return res.status(400).json({ error: `Invalid number: "${number}".` });
    }

    const jid = `${cleanNumber}@s.whatsapp.net`;
    console.log(`[WhatsApp Engine] Preparing Media Image for JID: ${jid} (Rate: ${rateLimitCheck.currentRate}/${rateLimitCheck.maxRate})`);

    let imageContent;
    let mimeType = 'image/jpeg';

    if (mediaUrl.startsWith('data:')) {
      const mimeMatch = mediaUrl.match(/^data:(image\/[a-zA-Z0-9\-\+]+);base64,/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
      const base64Data = mediaUrl.replace(/^data:image\/[a-zA-Z0-9\-\+]+;base64,/, '');
      imageContent = Buffer.from(base64Data, 'base64');
    } else {
      imageContent = { url: mediaUrl };
    }

    const mediaPayload = {
      image: imageContent,
      caption: caption || '',
      mimetype: mimeType,
    };

    const sentMsg = await sessionObj.socket.sendMessage(jid, mediaPayload);
    if (sentMsg?.key?.id && sentMsg?.message) {
      cacheSentMessage(sentMsg.key.id, sentMsg.message);
    }
    incrementCounter(instanceName, true);
    console.log(`[WhatsApp Engine] Media image successfully sent to ${jid}, Msg ID: ${sentMsg.key?.id}`);
    res.json({ status: 'SENT', key: sentMsg.key, to: `+${cleanNumber}` });
  } catch (error) {
    console.error('[WhatsApp Engine] Error sending media message:', error);
    incrementCounter(instanceName, false);
    res.status(500).json({ error: 'Failed to send WhatsApp media message', details: error.message });
  }
});

// 5. Fetch Joined Groups
app.get('/group/fetchAllGroups/:instanceName', async (req, res) => {
  const { instanceName } = req.params;
  const sessionObj = sessions.get(instanceName);

  if (!sessionObj || sessionObj.status !== 'open') {
    return res.json([]);
  }

  try {
    const groupMap = await sessionObj.socket.groupFetchAllParticipating();
    const groups = Object.values(groupMap).map((g) => ({
      id: g.id,
      subject: g.subject,
      size: g.participants?.length || 0,
      participants: (g.participants || []).map((p) => {
        const jid = p.jid || p.id;
        const lid = p.lid || p.id;
        const knownName = sessionObj.contacts?.get(jid) || sessionObj.contacts?.get(lid) || sessionObj.contacts?.get(p.id) || p.notify || p.name || p.pushName || '';
        return {
          id: jid,
          jid: jid,
          lid: lid,
          admin: p.admin || null,
          notify: knownName,
          name: knownName,
          pushName: knownName,
        };
      }),
    }));
    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.json([]);
  }
});

// 6. Logout & Delete Instance
app.delete('/instance/logout/:instanceName', async (req, res) => {
  const { instanceName } = req.params;
  console.log(`[WhatsApp Engine] Logging out & deleting instance: ${instanceName}`);
  
  const sessionObj = sessions.get(instanceName);
  if (sessionObj?.socket) {
    try {
      await sessionObj.socket.logout();
    } catch (e) {
      // ignore
    }
  }
  
  sessions.delete(instanceName);
  
  const sessionPath = path.join(SESSIONS_DIR, instanceName);
  if (fs.existsSync(sessionPath)) {
    fs.rmSync(sessionPath, { recursive: true, force: true });
  }

  res.json({ success: true, message: `Instance ${instanceName} deleted` });
});

// 7. Message Stats (Real Tracking)
app.get('/stats/all', (req, res) => {
  let totalSent = 0;
  let totalFailed = 0;
  let totalAiSent = 0;
  let totalBulkSent = 0;
  const perInstance = {};
  for (const [name, counts] of messageCounters) {
    totalSent += counts.sent || 0;
    totalFailed += counts.failed || 0;
    const ai = counts.aiSent || 0;
    const bulk = counts.bulkSent !== undefined ? counts.bulkSent : Math.max(0, (counts.sent || 0) - ai);
    totalAiSent += ai;
    totalBulkSent += bulk;
    perInstance[name] = { ...counts, aiSent: ai, bulkSent: bulk };
  }
  res.json({ totalSent, totalFailed, totalAiSent, totalBulkSent, perInstance });
});

app.get('/stats/:instanceName', (req, res) => {
  const { instanceName } = req.params;
  const counts = messageCounters.get(instanceName) || { sent: 0, failed: 0 };
  res.json({ instanceName, ...counts });
});

// 7b. Test Counter Increment (Simulate message send test)
app.post('/test/increment-counter', (req, res) => {
  const { instanceName = 'OrLife Local', source = 'manual' } = req.body || {};
  incrementCounter(instanceName, true, source);
  const counts = messageCounters.get(instanceName) || { sent: 0, failed: 0 };
  res.json({ success: true, instanceName, currentCounts: counts });
});

function loadExistingSessions() {
  if (fs.existsSync(SESSIONS_DIR)) {
    const folders = fs.readdirSync(SESSIONS_DIR);
    for (const folder of folders) {
      const fullPath = path.join(SESSIONS_DIR, folder);
      if (fs.statSync(fullPath).isDirectory()) {
        const credsPath = path.join(fullPath, 'creds.json');
        if (fs.existsSync(credsPath)) {
          console.log(`[WhatsApp Engine] Restoring session on startup: ${folder}`);
          createWhatsAppSession(folder).catch(err => {
            console.error(`Failed to restore session ${folder}:`, err);
          });
        } else {
          // Clean up empty/unlinked session directory
          console.log(`[WhatsApp Engine] Cleaning up empty session folder: ${folder}`);
          fs.rmSync(fullPath, { recursive: true, force: true });
        }
      }
    }
  }
}

app.listen(PORT, () => {
  console.log(`🚀 [Local WhatsApp Engine] Server running on http://localhost:${PORT}`);
  loadExistingSessions();
});

