"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Zap, Cpu, AlertTriangle, WifiOff } from "lucide-react";

export function AiEngineStatusCard({ className = "" }: { className?: string }) {
  const [status, setStatus] = useState<{
    hubStatus: string;
    groqStatus: string;
    ollamaStatus: string;
    activeEngine?: string;
  }>({
    hubStatus: "CHECKING",
    groqStatus: "CHECKING",
    ollamaStatus: "CHECKING",
  });
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai-hub/ollama-status", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setStatus({
          hubStatus: data.hubStatus || "OFFLINE",
          groqStatus: data.groqStatus || (data.hubStatus === "ONLINE" ? "ONLINE" : "OFFLINE"),
          ollamaStatus: data.ollamaStatus || "OFFLINE",
          activeEngine: data.activeEngine || "Groq Cloud AI",
        });
      } else {
        setStatus({ hubStatus: "OFFLINE", groqStatus: "OFFLINE", ollamaStatus: "OFFLINE" });
      }
    } catch {
      setStatus({ hubStatus: "OFFLINE", groqStatus: "OFFLINE", ollamaStatus: "OFFLINE" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className={`px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#1b3a4e] bg-slate-50 dark:bg-[#06141c] flex flex-wrap items-center justify-between gap-3 ${className}`}>
      {/* Title */}
      <div className="flex items-center gap-2">
        <Cpu className="w-4 h-4 text-emerald-500 shrink-0" />
        <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 whitespace-nowrap">
          Live AI Engine Health:
        </span>
      </div>

      {/* Badges in 1 single compact horizontal row */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {/* Hub 8090 */}
        <div className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#163546] bg-white dark:bg-[#0b1d28] flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-400">Hub 8090:</span>
          {status.hubStatus === "CHECKING" ? (
            <span className="font-bold text-slate-400 flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin text-emerald-500" /> Checking</span>
          ) : status.hubStatus === "ONLINE" ? (
            <span className="font-extrabold text-emerald-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active 🟢</span>
          ) : (
            <span className="font-bold text-red-500 flex items-center gap-1"><WifiOff className="w-3 h-3" /> Offline ❌</span>
          )}
        </div>

        {/* Groq Cloud AI */}
        <div className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#163546] bg-white dark:bg-[#0b1d28] flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-400">Groq AI:</span>
          {status.groqStatus === "CHECKING" ? (
            <span className="font-bold text-slate-400 flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin text-emerald-500" /> Checking</span>
          ) : status.groqStatus === "ONLINE" ? (
            <span className="font-extrabold text-emerald-500 flex items-center gap-1"><Zap className="w-3 h-3 fill-emerald-500/20" /> Active ⚡</span>
          ) : status.groqStatus === "INVALID_KEY" || status.groqStatus === "NO_KEY" ? (
            <span className="font-extrabold text-red-500 flex items-center gap-1"><WifiOff className="w-3 h-3" /> Invalid API Key ❌</span>
          ) : (
            <span className="font-bold text-red-500 flex items-center gap-1"><WifiOff className="w-3 h-3" /> Offline ❌</span>
          )}
        </div>

        {/* Local Ollama */}
        <div className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#163546] bg-white dark:bg-[#0b1d28] flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-400">Ollama:</span>
          {status.ollamaStatus === "CHECKING" ? (
            <span className="font-bold text-slate-400 flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin text-emerald-500" /> Checking</span>
          ) : status.ollamaStatus === "ONLINE" ? (
            <span className="font-extrabold text-emerald-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Ready 🟢</span>
          ) : (
            <span className="font-bold text-amber-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-amber-500" /> Offline ⚠️</span>
          )}
        </div>
      </div>

      {/* Refresh Button */}
      <button
        type="button"
        onClick={fetchStatus}
        disabled={loading}
        className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer shrink-0 ml-auto"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
      </button>
    </div>
  );
}
