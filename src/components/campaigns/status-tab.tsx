"use client";

// ============================================================
// Tab 1: Status & Anti-Ban Speed Settings
// ============================================================

import { ShieldCheck, Users, Sparkles, Zap, Smartphone } from "lucide-react";
import type { SpeedMode } from "./types";
import type { Instance } from "@/lib/api-client";

interface StatusTabProps {
  speedMode: SpeedMode;
  onSpeedChange: (mode: SpeedMode) => void;
  deviceProfileName: string;
  deviceOwnerNumber: string;
  isDeviceOnline: boolean;
  instances: Instance[];
  selectedInstance: string;
  onSelectInstance: (instanceName: string) => void;
}

export function StatusTab({
  speedMode,
  onSpeedChange,
  deviceProfileName,
  deviceOwnerNumber,
  isDeviceOnline,
  instances,
  selectedInstance,
  onSelectInstance,
}: StatusTabProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Device Status & Speed Bar */}
      <div className="glass-card rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full shrink-0 ${isDeviceOnline || selectedInstance === "aoc" ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)] animate-pulse" : "bg-slate-400"}`}></div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-emerald-500" /> Active Sending Gateway:
              </span>
              <select
                value={selectedInstance}
                onChange={(e) => onSelectInstance(e.target.value)}
                className="bg-slate-100 dark:bg-[#06141c] border border-slate-200 dark:border-[#1b3a4e] px-2.5 py-1 rounded-lg text-xs font-extrabold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {instances.map((i) => (
                  <option key={i.instanceName} value={i.instanceName} className="bg-[#0b1e28] text-white">
                    📱 {i.profileName || i.instanceName} ({i.owner || "Connected Number"})
                  </option>
                ))}
                <option value="aoc" className="bg-[#0b1e28] text-emerald-400 font-bold">
                  🚀 Official AOC Portal API (+91 96422 18004)
                </option>
              </select>
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono mt-1 font-bold">
              {selectedInstance === "aoc" ? "🟢 Official AOC Portal Gateway (API Key Active)" : `📱 Owner Number: ${deviceOwnerNumber}`}
            </p>
          </div>
        </div>

        {/* Speed / Anti-Ban Delay Selector */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#06141c] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#163546]">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Speed / Delay Mode:</span>
            <select
              value={speedMode === "Turbo" ? "Turbo" : "Slow"}
              onChange={(e) => onSpeedChange(e.target.value as SpeedMode)}
              className="bg-transparent text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none cursor-pointer"
            >
              <option value="Slow" className="bg-[#0b1e28] text-white">⚡ Slow (15s Anti-Ban Protection)</option>
              <option value="Turbo" className="bg-[#0b1e28] text-white">⚡ Turbo (Fast Dispatch)</option>
            </select>
            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
              ✓ Auto-Saved
            </span>
          </div>
        </div>
      </div>

      {/* Anti-Ban Guidelines & Account Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-4 shadow-md space-y-2 hover:border-emerald-500/40 transition-all group">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            Recommended Speed
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Keep speed set to <strong className="text-emerald-500">Normal (7s)</strong> for standard promotional broadcasts to ensure 99.9% delivery without triggering WhatsApp spam filters.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-4 shadow-md space-y-2 hover:border-emerald-500/40 transition-all group">
          <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-bold text-xs">
            <div className="p-1.5 rounded-lg bg-sky-500/10 border border-sky-500/30">
              <Users className="w-3.5 h-3.5" />
            </div>
            Group Audience Dispatch
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Use Tab 2 (<strong className="text-sky-400">Groups & Audience</strong>) to save or extract custom contact lists. Selected groups will auto-load when dispatching campaigns.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-4 shadow-md space-y-2 hover:border-emerald-500/40 transition-all group">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            Variable Personalization
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Use <code className="text-amber-400 font-mono bg-amber-500/10 px-1 py-0.5 rounded">{"{{name}}"}</code> in your message content to dynamically insert recipient names for higher open rates.
          </p>
        </div>
      </div>
    </div>
  );
}
