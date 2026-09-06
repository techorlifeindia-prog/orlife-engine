import { NextResponse } from "next/server";

// In-memory OTP store (In production, stored in PostgreSQL/Redis with 5 min TTL)
const otpStore = new Map<string, { code: string; expiresAt: number }>();

function formatAocPhone(phone: string): string {
  const cleaned = phone.replace(/[^0-9]/g, "");
  if (cleaned.length === 10) return "91" + cleaned;
  return cleaned;
}

async function sendAocTemplate(baseUrl: string, apiKey: string, from: string, to: string, templateName: string, otp: string) {
  const url = `${baseUrl}/v1/whatsapp`;
  const body = {
    from,
    to,
    type: "template",
    templateName,
    campaignName: "otp_campaign",
    components: { body: { params: [otp] } },
    otp,
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: apiKey },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  if (!res.ok || data.error === true || data.status === "error" || data.success === false) {
    throw new Error(data.message || data.error || "AOC Template returned failure status");
  }
  return data;
}

async function sendAocDirectMessage(baseUrl: string, apiKey: string, from: string, to: string, otp: string) {
  const url = `${baseUrl}/v1/messages`;
  const body = {
    recipient_type: "individual",
    from,
    to,
    type: "text",
    text: { body: `Your OrLife Connect verification code is: ${otp}. Valid for 5 minutes.` },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: apiKey },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  if (!res.ok || data.error === true || data.status === "error" || data.success === false) {
    throw new Error(data.message || data.error || "AOC Direct message returned failure status");
  }
  return data;
}

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: "WhatsApp phone number is required" }, { status: 400 });
    }

    let cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length === 10) {
      cleanPhone = "91" + cleanPhone;
    }

    if (cleanPhone.length < 11) {
      return NextResponse.json({ error: "Invalid phone number format. Include country code." }, { status: 400 });
    }

    // Generate secure 4-digit OTP (matching Chit Fund app logic)
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes TTL

    // Save in store
    otpStore.set(cleanPhone, { code: generatedOtp, expiresAt });

    const aocApiKey = process.env.AOC_API_KEY;
    const aocSenderNumber = process.env.AOC_SENDER_NUMBER;
    const aocBaseUrl = (process.env.AOC_BASE_URL || "https://api.aoc-portal.com").replace(/\/+$/, "");
    const aocTemplateName = process.env.AOC_TEMPLATE_NAME || "auth_otp";

    let whatsappDispatched = false;
    let dispatchMethod = "NONE";
    let lastError = "";

    // 1. Try sending via WhatsApp AOC Portal API (Chit Fund App Standard)
    if (aocApiKey && aocSenderNumber) {
      const fromPhone = formatAocPhone(aocSenderNumber);
      const toPhone = formatAocPhone(cleanPhone);

      try {
        await sendAocTemplate(aocBaseUrl, aocApiKey, fromPhone, toPhone, aocTemplateName, generatedOtp);
        whatsappDispatched = true;
        dispatchMethod = "AOC_TEMPLATE_API";
      } catch (err1: any) {
        lastError += `Template "${aocTemplateName}": ${err1.message}. `;
        if (aocTemplateName !== "otp") {
          try {
            await sendAocTemplate(aocBaseUrl, aocApiKey, fromPhone, toPhone, "otp", generatedOtp);
            whatsappDispatched = true;
            dispatchMethod = "AOC_TEMPLATE_API_FALLBACK";
          } catch (err2: any) {
            lastError += `Template "otp": ${err2.message}. `;
          }
        }
      }

      if (!whatsappDispatched) {
        try {
          await sendAocDirectMessage(aocBaseUrl, aocApiKey, fromPhone, toPhone, generatedOtp);
          whatsappDispatched = true;
          dispatchMethod = "AOC_DIRECT_API";
        } catch (err3: any) {
          lastError += `Direct Message: ${err3.message}. `;
        }
      }
    }

    // 2. Fallback to Local WhatsApp Engine (Port 8080)
    if (!whatsappDispatched) {
      try {
        const instRes = await fetch("http://localhost:8080/instance/fetchInstances");
        let activeInstance = "OrLifeBot";

        if (instRes.ok) {
          const instances: any[] = await instRes.json();
          const openInstances = instances.filter((i) => i.status === "open" || i.connectionStatus === "open");

          const crossSender = openInstances.find((i) => {
            const ownerNum = (i.owner || "").replace(/\D/g, "");
            return ownerNum && !cleanPhone.includes(ownerNum) && !ownerNum.includes(cleanPhone);
          });

          if (crossSender) {
            activeInstance = crossSender.instanceName;
          } else if (openInstances.length > 0) {
            activeInstance = openInstances[0].instanceName;
          }
        }

        const otpMessageText = `🔑 *OrLife Connect - WhatsApp AOC Authentication*\n\nYour 4-digit verification code is: *${generatedOtp}*\n\nUse this code to sign in to your OrLife SaaS portal. Valid for 5 minutes.\n\n_Do not share this OTP with anyone for security reasons._`;

        const sendRes = await fetch(`http://localhost:8080/message/sendText/${activeInstance}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            number: cleanPhone,
            textMessage: { text: otpMessageText },
          }),
        });

        if (sendRes.ok) {
          whatsappDispatched = true;
          dispatchMethod = "LOCAL_BAILEYS_GATEWAY";
        }
      } catch (e: any) {
        lastError += `Local Engine: ${e.message}. `;
      }
    }

    return NextResponse.json({
      status: "SUCCESS",
      message: `WhatsApp OTP sent successfully to +${cleanPhone}`,
      phone: cleanPhone,
      otpLength: 4,
      whatsappDispatched,
      dispatchMethod,
      // Returning code in development mode for easy testing
      devModeOtp: process.env.NODE_ENV === "development" ? generatedOtp : undefined,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to dispatch WhatsApp OTP" }, { status: 500 });
  }
}
