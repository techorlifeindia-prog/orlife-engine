import { Instance } from "./api-client";
import { SaaSClient, calculateClientStatus } from "./client-utils";

// ─── Private Helpers ─────────────────────────────────────────────────────────

interface RawUser {
  name?: string;
  businessName?: string;
  role?: string;
  email?: string;
  phone?: string;
  password?: string;
  apiKey?: string;
  clientIdCode?: string;
}

/** Safe JSON parse from localStorage — returns null on any failure. */
function lsGet<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** Safe JSON set to localStorage — silently ignores errors. */
function lsSet(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

/** Strips all non-digit characters from a phone string. */
const digitsOnly = (s?: string | null) => (s ?? "").replace(/\D/g, "");

/** Returns true if a raw user object belongs to a Super Admin. */
function isSuperAdminUser(u: RawUser): boolean {
  return (
    u.role === "Super Admin" ||
    (!!u.email && u.email.toLowerCase().includes("admin")) ||
    (!!u.phone && u.phone.includes("9246574995"))
  );
}

/**
 * Single source-of-truth: resolves the active identity
 * (impersonated client > logged-in user > default super admin).
 */
function resolveActiveIdentity(): {
  userPhone: string;
  userName: string;
  isSuperAdmin: boolean;
  isImpersonating: boolean;
  rawUser: RawUser | null;
} {
  const impersonated = lsGet<RawUser>("superadmin_impersonating_client");
  if (impersonated) {
    return {
      userPhone: impersonated.phone ?? "",
      userName: impersonated.businessName ?? impersonated.name ?? "",
      isSuperAdmin: false,
      isImpersonating: true,
      rawUser: impersonated,
    };
  }

  const current = lsGet<RawUser>("orlife_current_user");
  if (current) {
    return {
      userPhone: current.phone ?? "",
      userName: current.name ?? "",
      isSuperAdmin: isSuperAdminUser(current),
      isImpersonating: false,
      rawUser: current,
    };
  }

  // No session at all → treat as Super Admin (dev / first run)
  return { userPhone: "", userName: "", isSuperAdmin: true, isImpersonating: false, rawUser: null };
}

// ─── Public Types ─────────────────────────────────────────────────────────────

export interface SessionUser {
  name: string;
  role: string;
  email: string;
  phone: string;
  password?: string;
}

export interface SessionInfo {
  isImpersonating: boolean;
  isClientView: boolean;
  isSuperAdmin: boolean;
  user: SessionUser;
}

export function getInitialSessionInfo(): SessionInfo {
  // SSR default: safe client view — prevents Super Admin UI flash
  if (typeof window === "undefined") {
    return {
      isImpersonating: false,
      isClientView: true,
      isSuperAdmin: false,
      user: { name: "Client User", role: "Client View", email: "client@orlife.com", phone: "" },
    };
  }

  const { rawUser, isSuperAdmin, isImpersonating } = resolveActiveIdentity();

  if (isImpersonating && rawUser) {
    return {
      isImpersonating: true,
      isClientView: true,
      isSuperAdmin: false,
      user: {
        name: rawUser.businessName ?? rawUser.name ?? "Client User",
        role: "Client View",
        email: rawUser.email ?? "client@orlife.com",
        phone: rawUser.phone ?? "",
        password: rawUser.password ?? "",
      },
    };
  }

  if (rawUser) {
    const savedPass =
      rawUser.password ??
      localStorage.getItem("orlife_superadmin_password") ??
      "orlife123";
    return {
      isImpersonating: false,
      isClientView: !isSuperAdmin,
      isSuperAdmin,
      user: {
        name: rawUser.name ?? (isSuperAdmin ? "Super Admin" : "Logged User"),
        role: isSuperAdmin ? "Super Admin" : (rawUser.role ?? "Client Account"),
        email: rawUser.email ?? (isSuperAdmin ? "admin@orlifeindia.com" : "user@orlife.com"),
        phone: rawUser.phone ?? "",
        password: savedPass,
      },
    };
  }

  return {
    isImpersonating: false,
    isClientView: true,
    isSuperAdmin: false,
    user: { name: "Client User", role: "Client View", email: "client@orlife.com", phone: "" },
  };
}

export function saveClientCreatedDevice(instanceName: string): void {
  const list: string[] = lsGet<string[]>("orlife_my_created_devices") ?? [];
  if (!list.includes(instanceName)) {
    lsSet("orlife_my_created_devices", [...list, instanceName]);
  }
}

export function getFilteredInstancesForUser(rawInstances: Instance[]): Instance[] {
  if (typeof window === "undefined") return rawInstances;

  const { userPhone, isSuperAdmin } = resolveActiveIdentity();
  if (isSuperAdmin) return rawInstances;

  const cleanUserPhone = digitsOnly(userPhone);
  const myCreatedDevices: string[] = lsGet<string[]>("orlife_my_created_devices") ?? [];

  if (!cleanUserPhone || rawInstances.length <= 1) return rawInstances;

  const filtered = rawInstances.filter((d) => {
    // Always show local default instance
    if (d.instanceName === "OrLife Local" || d.instanceName === "default") return true;

    // Devices created in this browser session
    if (myCreatedDevices.includes(d.instanceName)) return true;

    const cleanOwner = digitsOnly(d.owner);
    if (cleanOwner) {
      if (cleanOwner.includes(cleanUserPhone) || cleanUserPhone.includes(cleanOwner)) return true;
      if (d.profileName?.toLowerCase().includes("chamunda") && cleanUserPhone.includes("8002821800")) return true;
    }

    return d.instanceName.includes(cleanUserPhone);
  });

  // Fallback: If filtering resulted in empty array, return all rawInstances so page is never blank
  return filtered.length > 0 ? filtered : rawInstances;
}

export function generateProfessionalApiToken(prefix = "orl_sk_live_"): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let randomPart = "";
  for (let i = 0; i < 24; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}${randomPart}`;
}

export function getUserSpecificApiToken(): string {
  if (typeof window === "undefined") return "orl_sk_live_superadmin_9246574995_masterkey";

  const { rawUser, isSuperAdmin, isImpersonating, userPhone } = resolveActiveIdentity();

  if (rawUser?.apiKey) return rawUser.apiKey;
  if (isSuperAdmin) return "orl_sk_live_superadmin_9246574995_masterkey";

  const cleanPhone = digitsOnly(userPhone);
  if (isImpersonating && rawUser) {
    const cleanName = (rawUser.businessName ?? "client").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10);
    return `orl_sk_live_${cleanName}_${cleanPhone}_sec8f9a2b7c4`;
  }
  return `orl_sk_live_client_${cleanPhone}_sec7f9a3b21`;
}

export function getClientCodeForDevice(device: Instance): string {
  if (typeof window === "undefined") return "CLI-101";

  const cleanOwner = digitsOnly(device.owner);

  // 1. Match against stored clients list
  const clients = lsGet<RawUser[]>("orlife_clients_v2");
  if (clients) {
    for (const c of clients) {
      const cp = digitsOnly(c.phone);
      const phoneMatch = cleanOwner && cp && (cleanOwner.includes(cp) || cp.includes(cleanOwner));
      const nameMatch =
        device.profileName?.toLowerCase().includes("chamunda") &&
        c.businessName?.toLowerCase().includes("chamunda");
      if (phoneMatch || nameMatch) {
        return (c.clientIdCode ?? "CLI-101").replace("#", "");
      }
    }
  }

  // 2. Active impersonation session
  const impersonated = lsGet<RawUser>("superadmin_impersonating_client");
  if (impersonated?.clientIdCode) return impersonated.clientIdCode.replace("#", "");

  // 3. Phone-based fallback defaults
  if (cleanOwner.includes("8002821800") || device.profileName?.toLowerCase().includes("chamunda")) return "CLI-101";
  if (cleanOwner.includes("9246574995")) return "CLI-102";
  if (cleanOwner.includes("9876543210")) return "CLI-103";
  if (cleanOwner.includes("94140")) return "CLI-104";

  return "CLI-101";
}

export function getActiveClientData() {
  const SSR_DEFAULT = {
    businessName: "Chamunda Industries",
    planName: "Enterprise AI" as const,
    startDate: "2026-08-15",
    expiryDate: "2026-09-15",
    daysRemaining: 7,
    messagesSent: 8420,
    messageLimit: 15000,
  };

  if (typeof window === "undefined") return SSR_DEFAULT;

  const { userPhone, userName } = resolveActiveIdentity();
  const cleanPhone = digitsOnly(userPhone);

  const clients = lsGet<SaaSClient[]>("orlife_clients_v2");
  if (clients) {
    const matched = clients.find((c) => {
      const cp = digitsOnly(c.phone);
      if (cleanPhone && cp && (cleanPhone.includes(cp) || cp.includes(cleanPhone))) return true;
      if (c.businessName && userName && c.businessName.toLowerCase().includes(userName.toLowerCase())) return true;
      return false;
    });
    if (matched) {
      const { daysRemaining } = calculateClientStatus(matched.expiryDate);
      return { ...matched, daysRemaining };
    }
  }

  const defaultExpiry = "2026-09-15";
  const { daysRemaining } = calculateClientStatus(defaultExpiry);
  return {
    businessName: userName || "Chamunda Industries",
    planName: "Enterprise AI" as const,
    startDate: "2026-08-15",
    expiryDate: defaultExpiry,
    daysRemaining,
    messagesSent: 8420,
    messageLimit: 15000,
  };
}


