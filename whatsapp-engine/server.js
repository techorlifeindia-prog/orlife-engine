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

const PORT = 8080;
const SESSIONS_DIR = path.join(__dirname, 'sessions');

if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

// In-memory store for active sessions and latest QR codes
const sessions = new Map();

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
    defaultQueryTimeoutMs: undefined,
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
      
      // Resolve Real Phone JID if incoming message uses LID (Linked Device Identifier)
      let realJid = fromJid;
      if (msg.key.remoteJidAlt && msg.key.remoteJidAlt.endsWith('@s.whatsapp.net')) {
        realJid = msg.key.remoteJidAlt;
      } else if (msg.key.participant_pn && msg.key.participant_pn.endsWith('@s.whatsapp.net')) {
        realJid = msg.key.participant_pn;
      } else if (msg.participant_pn && msg.participant_pn.endsWith('@s.whatsapp.net')) {
        realJid = msg.participant_pn;
      } else if (msg.key.participant && msg.key.participant.endsWith('@s.whatsapp.net')) {
        realJid = msg.key.participant;
      }

      let cleanPhone = realJid.split('@')[0].split(':')[0].replace(/\D/g, '');
      const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.imageMessage?.caption || '';
      const pushName = msg.pushName || 'Customer';

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
        messageType: msg.message?.imageMessage ? 'imageMessage' : 'text',
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

      if (statusCode !== DisconnectReason.loggedOut) {
        console.log(`[WhatsApp Engine] Auto-reconnecting instance: ${instanceName}`);
        sessions.delete(instanceName);
        createWhatsAppSession(instanceName);
      }
    }
  });

  return sessionObj;
}

// 1. Fetch All Instances (Only return connected instances or active QR sessions)
app.get('/instance/fetchInstances', (req, res) => {
  const list = [];
  sessions.forEach((val, key) => {
    // Only show if connected ('open') or if actively generating/showing QR
    if (val.status === 'open' || val.qrCodeBase64) {
      const phoneOwner = formatPhoneNumber(val.socket?.user?.id || val.state?.creds?.me?.id) || val.owner;
      const nameOwner = val.socket?.user?.name || val.socket?.user?.notify || val.state?.creds?.me?.name || val.profileName;
      list.push({
        instanceName: key,
        status: val.status,
        owner: phoneOwner || 'Connected Account',
        profileName: nameOwner || 'WhatsApp User',
      });
    }
  });

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

  if (!sessionObj) {
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

// 4. Send Text Message
app.post('/message/sendText/:instanceName', async (req, res) => {
  const { instanceName } = req.params;
  const { number, textMessage } = req.body;

  const sessionObj = sessions.get(instanceName);
  if (!sessionObj || sessionObj.status !== 'open') {
    return res.status(400).json({ error: 'WhatsApp instance is not connected. Please scan QR first.' });
  }

  try {
    let jid = number;
    if (!jid.includes('@')) {
      let cleanNumber = number.replace(/\D/g, '');
      if (cleanNumber.length === 10) {
        cleanNumber = '91' + cleanNumber;
      }
      jid = `${cleanNumber}@s.whatsapp.net`;
    }

    console.log(`[WhatsApp Engine] Sending Text to JID: ${jid}`);
    const sentMsg = await sessionObj.socket.sendMessage(jid, { text: textMessage.text });
    res.json({ status: 'SENT', key: sentMsg.key, to: jid });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send WhatsApp message', details: error.message });
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

  try {
    let cleanNumber = number.replace(/\D/g, '');
    if (cleanNumber.length === 10) cleanNumber = '91' + cleanNumber;

    if (cleanNumber.length < 11) {
      return res.status(400).json({ error: `Invalid number: "${number}".` });
    }

    const jid = `${cleanNumber}@s.whatsapp.net`;
    console.log(`[WhatsApp Engine] Preparing Media Image for JID: ${jid}`);

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
    console.log(`[WhatsApp Engine] Media image successfully sent to ${jid}, Msg ID: ${sentMsg.key?.id}`);
    res.json({ status: 'SENT', key: sentMsg.key, to: `+${cleanNumber}` });
  } catch (error) {
    console.error('[WhatsApp Engine] Error sending media message:', error);
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

