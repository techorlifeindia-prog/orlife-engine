export interface SaaSClient {
  id: string;
  clientIdCode?: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  loginPassword?: string;
  planName: string; 
  planPrice: string;
  status: "Active" | "Expiring Soon" | "Expired";
  startDate: string;
  expiryDate: string;
  daysRemaining: number;
  apiKey: string;
  connectedDevicesCount: number;
  messagesSent: number;
  messageLimit: number;
}

export type WorkingMode = "orlife_ai" | "api_webhook" | "api_with_ai" | "broadcast_only";

export function getPlanDetailsFromMode(mode?: string) {
  if (mode === "broadcast_only" || mode === "orlife_ai") {
    return { planName: "Starter Hub" as const, planPrice: "₹999/mo", messageLimit: 2000 };
  }
  if (mode === "api_webhook") {
    return { planName: "Pro Automation" as const, planPrice: "₹2,499/mo", messageLimit: 10000 };
  }
  if (mode === "api_with_ai") {
    return { planName: "Enterprise AI" as const, planPrice: "₹4,999/mo", messageLimit: 25000 };
  }
  return { planName: "Starter Hub" as const, planPrice: "₹999/mo", messageLimit: 2000 };
}

export function calculateClientStatus(expiryDateStr: string): { daysRemaining: number; status: SaaSClient["status"] } {
  const expDate = new Date(expiryDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expDate.setHours(0, 0, 0, 0);

  const diffTime = expDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const status: SaaSClient["status"] = daysRemaining < 0 ? "Expired" : daysRemaining <= 7 ? "Expiring Soon" : "Active";

  return { daysRemaining, status };
}
