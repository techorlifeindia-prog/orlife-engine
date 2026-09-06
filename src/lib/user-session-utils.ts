import { Instance } from "./api-client";

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
        if (parsed.role === "Super Admin" || userPhone.includes("9246574995") || parsed.email === "super@gmail.com") {
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
  const filtered = rawInstances.filter((d) => {
    const cleanOwner = (d.owner || "").replace(/\D/g, "");
    if (cleanUserPhone && cleanOwner && (cleanOwner.includes(cleanUserPhone) || cleanUserPhone.includes(cleanOwner))) {
      return true;
    }
    if (d.profileName?.toLowerCase().includes("chamunda") && cleanUserPhone.includes("8002821800")) {
      return true;
    }
    return false;
  });

  return filtered.length > 0 ? filtered : rawInstances.filter((d) => (d.owner || "").includes("8002821800"));
}
