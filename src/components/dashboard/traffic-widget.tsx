"use client";

import { Activity, CheckCircle2 } from "lucide-react";

interface TrafficWidgetProps {
  engineOnline: boolean;
}

export function TrafficWidget({ engineOnline }: TrafficWidgetProps) {
  return (
    <div className="rounded-2xl glass-card border border-[#163546] p-6 space-y-5 shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4 border-b border-[#163546] pb-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Real-time Traffic
          </h3>
          <span className="text-xs text-slate-400 font-mono">Live Sync</span>
        </div>

        <div className="h-28 w-full pt-2">
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

      <div className="space-y-2.5 pt-2 border-t border-[#163546]">
        <div className="flex items-center justify-between text-xs bg-[#081822] p-3 rounded-xl border border-[#163546]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-white">Baileys Engine</span>
          </div>
          <span className="text-emerald-400 font-mono text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
            {engineOnline ? "ONLINE" : "OFFLINE"}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs bg-[#081822] p-3 rounded-xl border border-[#163546]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-white">Next.js API Proxy</span>
          </div>
          <span className="text-emerald-400 font-mono text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
            ONLINE
          </span>
        </div>
      </div>
    </div>
  );
}
