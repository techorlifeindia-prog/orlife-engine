const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 8090;
const WHATSAPP_ENGINE_URL = 'http://localhost:8080';

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 1. Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'OrLife AI Hub Bridge Engine',
    port: PORT,
    connectedWhatsAppEngine: WHATSAPP_ENGINE_URL,
    timestamp: new Date().toISOString(),
  });
});

// 2. Incoming AI Hub Message Processor & Auto-Reply Dispatcher
app.post('/ai-hub/process', async (req, res) => {
  const { instanceName, senderNumber, messageText } = req.body;

  if (!instanceName || !senderNumber || !messageText) {
    return res.status(400).json({ error: 'Missing required parameters: instanceName, senderNumber, messageText' });
  }

  console.log(`[AI Hub Port 8090] Processing message from ${senderNumber}: "${messageText}"`);

  // AI Logic / Response Generation
  const lowerMsg = messageText.toLowerCase();
  let aiReplyText = "";

  if (lowerMsg.includes("price") || lowerMsg.includes("rate") || lowerMsg.includes("cost")) {
    aiReplyText = "Namaste! OrLife Connect WhatsApp SaaS pricing starts at ₹999/month. Reply DEMO for a live walkthrough!";
  } else if (lowerMsg.includes("chit") || lowerMsg.includes("fund")) {
    aiReplyText = "Namaste! OrLife Chit Fund SaaS module provides auto-instalment WhatsApp receipts & draw winner alerts.";
  } else if (lowerMsg.includes("khata") || lowerMsg.includes("hisab")) {
    aiReplyText = "Namaste! KhataHisab integration automatically sends daily balance summaries & payment links via WhatsApp.";
  } else if (lowerMsg.includes("hello") || lowerMsg.includes("hi") || lowerMsg.includes("hey")) {
    aiReplyText = "Namaste! I am OrLife 24/7 AI Assistant 🤖. How can I help you today?";
  } else {
    aiReplyText = `Thank you for contacting OrLife! Our AI Hub has logged your query: "${messageText}". An agent will respond shortly.`;
  }

  // Dispatch reply back via WhatsApp Engine on Port 8080
  try {
    const fetchResponse = await fetch(`${WHATSAPP_ENGINE_URL}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        number: senderNumber,
        textMessage: { text: aiReplyText }
      })
    });

    const dispatchData = await fetchResponse.json();

    res.json({
      status: 'PROCESSED_AND_SENT',
      aiHubPort: PORT,
      senderNumber,
      userMessage: messageText,
      aiGeneratedReply: aiReplyText,
      whatsappDispatchResult: dispatchData,
    });
  } catch (error) {
    console.error('[AI Hub Port 8090] Error dispatching message to WhatsApp engine:', error);
    res.status(500).json({ error: 'Failed to dispatch AI response to WhatsApp Engine' });
  }
});

// 3. Start AI Hub Server on Port 8090
app.listen(PORT, () => {
  console.log(`🚀 [OrLife AI Hub Server] Dedicated AI Hub Bridge Port running on http://localhost:${PORT}`);
});
