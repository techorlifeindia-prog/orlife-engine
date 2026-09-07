"use client";

import { RefreshCw, TrendingUp } from "lucide-react";
import { Instance } from "@/lib/api-client";

interface ActivityChartProps {
  instances: Instance[];
  loading: boolean;
  onRefresh: () => void;
}

export function ActivityChart({ instances, loading, onRefresh }: ActivityChartProps) {
  const openInstances = instances.filter((i) => i.status === "open");

  return (
    <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-[#0b1d28] border border-slate-200 dark:border-[#1b3a4e] p-3.5 space-y-2.5 shadow-md">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#183647] pb-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Recent Campaign Activity
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Live dispatch velocity & real-time delivery performance
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-[#06141c] hover:bg-slate-200 dark:hover:bg-[#112937] border border-slate-200 dark:border-[#163546] text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Connected Accounts Live Details */}
      {openInstances.length > 0 ? (
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#06141c] border border-slate-200 dark:border-[#163546] space-y-2">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Connected WhatsApp Account
          </p>
          {openInstances.map((inst) => (
            <div
              key={inst.instanceName}
              className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-[#0b1e28] border border-emerald-500/30"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
                <div>
                  <p className="font-bold text-xs text-slate-900 dark:text-white">
                    {inst.profileName || inst.instanceName}
                  </p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    {inst.owner ? `+${inst.owner.replace(/^\+/, "")}` : "Connected"}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Active & Ready
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 text-center border border-dashed border-slate-300 dark:border-[#163546] rounded-xl text-slate-500 dark:text-slate-400 text-xs">
          Koi device connected nahi hai. Devices page par jaakar WhatsApp QR scan karo.
        </div>
      )}

      {/* SVG Wave Chart Graph */}
      <div className="h-32 w-full relative pt-1 flex items-end">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 500 150">
          <defs>
            <linearGradient id="tealGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path
            d="M 0,110 Q 75,30 150,85 T 300,50 T 450,20 L 500,60 L 500,150 L 0,150 Z"
            fill="url(#tealGradient)"
          />
          <path
            d="M 0,110 Q 75,30 150,85 T 300,50 T 450,20 L 500,60"
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
            className="drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]"
          />
          <circle cx="150" cy="85" r="5" fill="#10b981" className="animate-pulse" />
          <circle cx="300" cy="50" r="5" fill="#10b981" className="animate-pulse" />
          <circle cx="450" cy="20" r="5" fill="#10b981" />
        </svg>
      </div>
    </div>
  );
}
