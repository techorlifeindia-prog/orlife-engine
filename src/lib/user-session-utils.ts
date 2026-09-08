import { Instance } from "./api-client";

export interface SessionUser {
  name: string;
  role: string;
  email: string;
  phone: string;
}

export interface SessionInfo {
  isImpersonating: boolean;
  isClientView: boolean;
  isSuperAdmin: boolean;
  user: SessionUser;
}

export function getInitialSessionInfo(): SessionInfo {
  // Server-side (SSR) default: Return Client View (isSuperAdmin: false) so Client View users never see Super Admin UI flash
  if (typeof window === "undefined") {
    return {
      isImpersonating: false,
      isClientView: true,
      isSuperAdmin: false,
      user: {
        name: "Client User",
        role: "Client View",
        email: "client@orlife.com",
        phone: "",
      },
    };
  }

  const impersonating = localStorage.getItem("superadmin_impersonating_client");
  if (impersonating) {
    try {
      const parsed = JSON.parse(impersonating);
      return {
        isImpersonating: true,
        isClientView: true,
        isSuperAdmin: false,
        user: {
          name: parsed.businessName || parsed.name || "Client User",
          role: "Client View",
          email: parsed.email || "client@orlife.com",
          phone: parsed.phone || "",
        },
      };
    } catch (e) {}
  }

  const savedUser = localStorage.getItem("orlife_current_user");
  if (savedUser) {
    try {
      const parsed = JSON.parse(savedUser);
      const isSuper = parsed.role === "Super Admin" || (parsed.email && parsed.email.toLowerCase().includes("admin")) || (parsed.phone && parsed.phone.includes("9246574995"));
      return {
        isImpersonating: false,
        isClientView: !isSuper,
        isSuperAdmin: isSuper,
        user: {
          name: parsed.name || (isSuper ? "Super Admin" : "Logged User"),
          role: isSuper ? "Super Admin" : (parsed.role || "Client Account"),
          email: parsed.email || (isSuper ? "admin@orlifeindia.com" : "user@orlife.com"),
          phone: parsed.phone || "",
        },
      };
    } catch (e) {}
  }

  return {
    isImpersonating: false,
    isClientView: true,
    isSuperAdmin: false,
    user: {
      name: "Client User",
      role: "Client View",
      email: "client@orlife.com",
      phone: "",
    },
  };
}

export function getFilteredInstancesForUser(rawInstances: Instance[]): Instance[] {
  if (typeof window === "undefined") return rawInstances;

  let userPhone = "";
  let isSuperAdmin = false;

  const impersonating = localStorage.getItem("superadmin_impersonating_client");
  if (impersonating) {
    try {
      const parsed = JSON.parse(impersonating);
      userPhone = parsed.phone || "";
    } catch (e) {}
  } else {
    const savedUser = localStorage.getItem("orlife_current_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        userPhone = parsed.phone || "";
        if (parsed.role === "Super Admin" || (parsed.email && parsed.email.toLowerCase().includes("admin")) || userPhone.includes("9246574995")) {
          isSuperAdmin = true;
        }
      } catch (e) {}
    } else {
      isSuperAdmin = true;
    }
  }

  if (isSuperAdmin) {
    return rawInstances;
  }

  const cleanUserPhone = userPhone.replace(/\D/g, "");
  if (!cleanUserPhone) {
    return [];
  }

  const filtered = rawInstances.filter((d) => {
    const cleanOwner = (d.owner || "").replace(/\D/g, "");
    if (!cleanOwner) {
      // Keep disconnected / newly created instances visible so user can reconnect
      return true;
    }
    if (cleanUserPhone && (cleanOwner.includes(cleanUserPhone) || cleanUserPhone.includes(cleanOwner))) {
      return true;
    }
    if (d.profileName?.toLowerCase().includes("chamunda") && cleanUserPhone.includes("8002821800")) {
      return true;
    }
    return false;
  });

  return filtered;
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

  const impersonating = localStorage.getItem("superadmin_impersonating_client");
  if (impersonating) {
    try {
      const parsed = JSON.parse(impersonating);
      if (parsed.apiKey) return parsed.apiKey;
      const cleanPhone = (parsed.phone || "").replace(/\D/g, "");
      const cleanName = (parsed.businessName || "client").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10);
      return `orl_sk_live_${cleanName}_${cleanPhone}_sec8f9a2b7c4`;
    } catch (e) {}
  }

  const savedUser = localStorage.getItem("orlife_current_user");
  if (savedUser) {
    try {
      const parsed = JSON.parse(savedUser);
      if (parsed.apiKey) return parsed.apiKey;
      const isSuper = parsed.role === "Super Admin" || parsed.phone?.includes("9246574995") || parsed.email === "super@gmail.com";
      if (isSuper) {
        return "orl_sk_live_superadmin_9246574995_masterkey";
      }
      const cleanPhone = (parsed.phone || "").replace(/\D/g, "");
      return `orl_sk_live_client_${cleanPhone}_sec7f9a3b21`;
    } catch (e) {}
  }

  return "orl_sk_live_superadmin_9246574995_masterkey";
}


