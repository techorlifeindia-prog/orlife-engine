"use client";

import { useEffect, useState } from "react";
import { getInitialSessionInfo, SessionInfo } from "@/lib/user-session-utils";

/**
 * Returns reactive session info that stays in sync with localStorage changes.
 * Replaces the duplicated useEffect + addEventListener pattern in every component.
 */
export function useSessionInfo(): { session: SessionInfo; mounted: boolean } {
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<SessionInfo>(() => getInitialSessionInfo());

  useEffect(() => {
    setMounted(true);
    setSession(getInitialSessionInfo());

    const syncSession = () => setSession(getInitialSessionInfo());

    window.addEventListener("storage", syncSession);
    window.addEventListener("user_session_changed", syncSession);

    return () => {
      window.removeEventListener("storage", syncSession);
      window.removeEventListener("user_session_changed", syncSession);
    };
  }, []);

  return { session, mounted };
}
