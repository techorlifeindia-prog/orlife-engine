"use client";

import { Activity, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { getInitialSessionInfo } from "@/lib/user-session-utils";

interface TrafficWidgetProps {
  engineOnline: boolean;
}

export function TrafficWidget({ engineOnline }: TrafficWidgetProps) {
  const [session, setSession] = useState(() => getInitialSessionInfo());
  const isClientView = session.isClientView;

  useEffect(() => {
    setSession(getInitialSessionInfo());
    const syncSession = () => {
      setSession(getInitialSessionInfo());
    };

    window.addEventListener("storage", syncSession);
    window.addEventListener("user_session_changed", syncSession);

    return () => {
      window.removeEventListener("storage", syncSession);
      window.removeEventListener("user_session_changed", syncSession);
    };
  }, []);

  return (
    <div className="rounded-2xl bg-white dark:bg-[#0b1d28] border border-slate-200 dark:border-[#1b3a4e] p-3.5 space-y-2.5 shadow-md flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2 border-b border-slate-200 dark:border-[#183647] pb-2">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Real-time Traffic
          </h3>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Live Sync</span>
        </div>

        <div className="h-20 w-full pt-1">
          <svg className="w-full h-full" viewBox="0 0 200 80">
            <path
              d="M 0,60 Q 30,70 60,30 T 120,40 T 180,10 L 200,30"
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              className="drop-shadow-[0_0_8px_rgba(16,185,129,0.7)]"
            />
          </svg>
        </div>
      </div>

      <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-[#183647]">
        {isClientView ? (
          <>
            <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-[#06141c] p-2 rounded-lg border border-slate-200 dark:border-[#163546]">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="font-semibold text-slate-900 dark:text-white text-xs">Delivered Messages</span>
              </div>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[10px] bg-emerald-500/10 px-1.5 py-0.2 rounded-md border border-emerald-500/30">
                1,230 (98.4%)
              </span>
            </div>

            <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-[#06141c] p-2 rounded-lg border border-slate-200 dark:border-[#163546]">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span className="font-semibold text-slate-900 dark:text-white text-xs">Failed / Bounced</span>
              </div>
              <span className="text-amber-600 dark:text-amber-400 font-mono text-[10px] bg-amber-500/10 px-1.5 py-0.2 rounded-md border border-amber-500/30">
                20 (1.6%)
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-[#06141c] p-2 rounded-lg border border-slate-200 dark:border-[#163546]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="font-semibold text-slate-900 dark:text-white text-xs">Baileys Engine</span>
              </div>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[10px] bg-emerald-500/10 px-1.5 py-0.2 rounded-md border border-emerald-500/30">
                {engineOnline ? "ONLINE" : "OFFLINE"}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-[#06141c] p-2 rounded-lg border border-slate-200 dark:border-[#163546]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="font-semibold text-slate-900 dark:text-white text-xs">Next.js API Proxy</span>
              </div>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[10px] bg-emerald-500/10 px-1.5 py-0.2 rounded-md border border-emerald-500/30">
                ONLINE
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
