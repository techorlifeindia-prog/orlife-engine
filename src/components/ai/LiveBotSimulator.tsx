"use client";

import { useState } from "react";
import { Sparkles, RefreshCw, Zap, CheckCircle2, Bot, AlertCircle } from "lucide-react";

interface LiveBotSimulatorProps {
  systemPrompt?: string;
  className?: string;
}

export function LiveBotSimulator({ systemPrompt, className = "" }: LiveBotSimulatorProps) {
  const [simMessage, setSimMessage] = useState("");
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState<{
    reply: string;
    source: string;
    matchedKeyword?: string;
    latencyMs?: number;
  } | null>(null);

  const handleRunSimulator = async () => {
    if (!simMessage.trim()) return;
    setSimLoading(true);
    setSimResult(null);
    const start = Date.now();

    try {
      const res = await fetch("/api/ai-hub/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: simMessage, systemPrompt }),
        signal: AbortSignal.timeout(15000),
      });

      const latencyMs = Date.now() - start;

      if (res.ok) {
        const data = await res.json();
        setSimResult({
          reply: data.reply || data.response || "No reply generated",
          source: data.source || "Groq Flash AI",
          matchedKeyword: data.matchedKeyword,
          latencyMs,
        });
      } else {
        const errData = await res.json().catch(() => ({}));
        setSimResult({
          reply: errData.error || "AI Engine is offline or starting up.",
          source: "ERROR",
          latencyMs,
        });
      }
    } catch (e: any) {
      setSimResult({
        reply: "Failed to connect to AI Hub Engine on Port 8090.",
        source: "OFFLINE",
        latencyMs: Date.now() - start,
      });
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <div className={`glass-card p-5 rounded-2xl shadow-lg space-y-4 border border-slate-200 dark:border-[#183647] bg-white dark:bg-[#06141c] ${className}`}>
      <div className="border-b border-slate-200 dark:border-[#183647] pb-3 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#10b981]" /> Live Bot Simulator
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Test how AI & Keyword rules reply to customer messages</p>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
          LIVE TEST
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Enter Test Message</label>
          <input
            type="text"
            placeholder="e.g. Hi, what is the price?"
            value={simMessage}
            onChange={(e) => setSimMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRunSimulator()}
            className="w-full bg-slate-50 dark:bg-[#0b1d28] border border-slate-200 dark:border-[#1b3a4e] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#10b981] font-medium"
          />
        </div>

        <button
          onClick={handleRunSimulator}
          disabled={simLoading || !simMessage.trim()}
          className="w-full py-2.5 bg-[#10b981] hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md shadow-[#10b981]/20 flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer transition-all"
        >
          {simLoading ? (
            <><RefreshCw className="w-4 h-4 animate-spin" /> Thinking...</>
          ) : (
            <><Zap className="w-4 h-4" /> Test AI Auto-Reply</>
          )}
        </button>

        {simResult && (
          <div className={`p-3.5 rounded-xl space-y-2 animate-in fade-in duration-200 border ${
            simResult.source === "ERROR" || simResult.source === "OFFLINE"
              ? "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"
              : "bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
          }`}>
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold flex items-center gap-1">
                {simResult.source === "ERROR" || simResult.source === "OFFLINE" ? (
                  <><AlertCircle className="w-3.5 h-3.5 text-red-500" /> Connection Error</>
                ) : simResult.source.startsWith("KEYWORD") ? (
                  <>🏷️ Keyword Rule: {simResult.matchedKeyword || "Matched"}</>
                ) : (
                  <><Bot className="w-3.5 h-3.5 text-emerald-500" /> AI Reply ({simResult.source})</>
                )}
              </span>
              {simResult.latencyMs !== undefined && (
                <span className="font-mono text-[10px] text-slate-400">{simResult.latencyMs}ms</span>
              )}
            </div>
            <div className="bg-white dark:bg-[#0b1d28] p-3 rounded-lg border border-slate-200 dark:border-[#183647] text-xs text-slate-900 dark:text-white leading-relaxed font-medium">
              &quot;{simResult.reply}&quot;
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
