# 🚀 OrLife WhatsApp Engine - API Integration Guide

This guide explains how to connect **ANY external project** (Node.js, PHP, Python, React, Laravel, WordPress, Mobile Apps, or ERP systems) to the OrLife WhatsApp API engine.

---

## 📌 Base API URL
- **Local Engine URL:** `http://localhost:8080`
- **OrLife AI Hub Bridge Port:** `http://localhost:8090`
- **OrLife AI Hub Frontend / Webhook Receiver Port:** `http://localhost:7001`
- **Next.js Proxy API URL:** `http://localhost:3002/api/evolution`
- **Oracle / Cloud Production URL:** `http://<YOUR_SERVER_IP>:8080`

---

## 1. 📤 Send Text Message

Send bulk or transactional WhatsApp messages (OTP, order alerts, notifications).

### **Endpoint**
`POST http://localhost:8080/message/sendText/:instanceName`

### **Headers**
`Content-Type: application/json`

### **Request Payload (JSON)**
```json
{
  "number": "919876543210",
  "textMessage": {
    "text": "Hello! Your OTP code is 987654. Valid for 10 minutes."
  }
}
```

> **Note:** The `number` parameter automatically handles 10-digit Indian numbers (`9876543210` -> `919876543210`).

---

### 💡 **Code Examples**

#### **A. Node.js / JavaScript (Fetch / Axios)**
```javascript
async function sendWhatsAppSMS(phone, text) {
  const res = await fetch("http://localhost:8080/message/sendText/device_1788680296230", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      number: phone,
      textMessage: { text: text }
    })
  });
  const data = await res.json();
  return data;
}

// Usage:
sendWhatsAppSMS("9876543210", "Hello from Node.js project!");
```

#### **B. PHP (WordPress / Laravel / Core PHP)**
```php
<?php
function sendWhatsAppMessage($phone, $message) {
    $url = "http://localhost:8080/message/sendText/device_1788680296230";
    $payload = array(
        "number" => $phone,
        "textMessage" => array("text" => $message)
    );

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
}

// Usage:
sendWhatsAppMessage("9876543210", "Your order #1001 has been dispatched!");
?>
```

#### **C. Python (Django / Flask / FastApi / Scripts)**
```python
import requests

def send_whatsapp_message(phone, message):
    url = "http://localhost:8080/message/sendText/device_1788680296230"
    payload = {
        "number": phone,
        "textMessage": { "text": message }
    }
    response = requests.post(url, json=payload)
    return response.json()

# Usage:
send_whatsapp_message("9876543210", "Hello from Python Script!")
```

#### **D. cURL (Terminal / Shell Scripting)**
```bash
curl -X POST http://localhost:8080/message/sendText/device_1788680296230 \
  -H "Content-Type: application/json" \
  -d '{
    "number": "919876543210",
    "textMessage": { "text": "Testing WhatsApp API from terminal!" }
  }'
```

---

## 2. 🖼️ Send Image / Media Message

Send promotional images, PDF invoices, or media attachments with captions.

### **Endpoint**
`POST http://localhost:8080/message/sendMedia/:instanceName`

### **Request Payload (JSON)**
```json
{
  "number": "919876543210",
  "mediaUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "caption": "Check out our new product catalog! 🚀"
}
```

---

## 3. 🔍 Check Active Devices Status

Fetch all connected WhatsApp numbers and connection status (`open`, `close`, `connecting`).

### **Endpoint**
`GET http://localhost:8080/instance/fetchInstances`

### **Response (JSON)**
```json
[
  {
    "instanceName": "device_1788680296230",
    "status": "open",
    "owner": "+91 80028 21800",
    "profileName": "Chamunda Industries Babulal Akoli"
  }
]
```

---

## 4. 👥 Fetch WhatsApp Groups & Members

Extract all joined WhatsApp groups and participant lists.

### **Endpoint**
`GET http://localhost:8080/group/fetchAllGroups/:instanceName`

---

## 🔑 Summary Matrix

| Action | HTTP Method | Endpoint Path |
| :--- | :--- | :--- |
| **Send Text SMS** | `POST` | `/message/sendText/:instanceName` |
| **Send Image / Media** | `POST` | `/message/sendMedia/:instanceName` |
| **Fetch Connected Devices** | `GET` | `/instance/fetchInstances` |
| **Fetch WhatsApp Groups** | `GET` | `/group/fetchAllGroups/:instanceName` |
| **Generate QR Code** | `GET` | `/instance/connect/:instanceName` |
| **Delete / Logout Device** | `DELETE` | `/instance/logout/:instanceName` |
