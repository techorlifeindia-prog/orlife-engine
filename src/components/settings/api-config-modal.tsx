"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle2, AlertCircle, RefreshCw, Copy, Check, Server, Key, Globe, Sparkles, Send, Eye, EyeOff, Terminal, Zap } from "lucide-react";
import { generateProfessionalApiToken } from "@/lib/user-session-utils";

interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// AI Hub endpoints to display & copy
const AI_HUB_ENDPOINTS = [
  {
    label: "Health Check",
    method: "GET",
    url: "http://localhost:8090/health",
    desc: "Check if AI Hub is online",
    color: "text-emerald-500",
  },
  {
    label: "Test AI Reply (Simulate)",
    method: "POST",
    url: "http://localhost:8090/ai-hub/simulate",
    desc: "Send a test message, get AI reply back",
    color: "text-blue-500",
  },
  {
    label: "OpenAI Format (Universal)",
    method: "POST",
    url: "http://localhost:8090/v1/chat/completions",
    desc: "Use in any OpenAI-compatible project",
    color: "text-purple-500",
  },
  {
    label: "Gemini Format (Universal)",
    method: "POST",
    url: "http://localhost:8090/v1beta/models/gemini-1.5-flash:generateContent",
    desc: "Use in any Gemini-compatible project",
    color: "text-amber-500",
  },
];

export function ApiConfigModal({ isOpen, onClose }: ApiConfigModalProps) {
  const [gatewayUrl, setGatewayUrl] = useState("http://localhost:8080");
  const [aiBridgeUrl, setAiBridgeUrl] = useState("http://localhost:8090/ai-hub/process");
  const [sessionKey, setSessionKey] = useState("OrLifeBot");
  const [apiKey, setApiKey] = useState("orl_sk_live_8f9a2b7c4d1e6f0a9b2c3d4e");
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [activeSection, setActiveSection] = useState<"config" | "ai-api">("config");


  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    engineStatus?: string;
    aiBridgeStatus?: string;
    latencyMs?: number;
  } | null>(null);

  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("orlife_whatsapp_api_config");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.gatewayUrl) setGatewayUrl(parsed.gatewayUrl);
        if (parsed.aiBridgeUrl) setAiBridgeUrl(parsed.aiBridgeUrl);
        if (parsed.sessionKey) setSessionKey(parsed.sessionKey);
        if (parsed.apiKey) setApiKey(parsed.apiKey);
      } catch (e) {
        console.error("Failed to parse saved API config", e);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const startMs = Date.now();
    try {
      const engineRes = await fetch(`${gatewayUrl}/instance/fetchInstances`);
      const engineData = await engineRes.json();

      const bridgeHealthUrl = aiBridgeUrl.replace(/\/ai-hub\/process.*/, "/health");
      let bridgeStatus = "OFFLINE";
      try {
        const bridgeRes = await fetch(bridgeHealthUrl);
        const bridgeData = await bridgeRes.json();
        bridgeStatus = bridgeData.status === "ONLINE" ? "✅ ONLINE" : "UNKNOWN";
      } catch {
        bridgeStatus = "❌ OFFLINE";
      }

      setTestResult({
        success: true,
        message: "API Gateway & AI Hub connected successfully!",
        engineStatus: Array.isArray(engineData) && engineData.length > 0
          ? "✅ ONLINE (Active Session)"
          : "✅ ONLINE (Awaiting QR)",
        aiBridgeStatus: bridgeStatus,
        latencyMs: Date.now() - startMs,
      });
    } catch {
      setTestResult({
        success: false,
        message: `Cannot reach engine at ${gatewayUrl}. Make sure server is running.`,
      });
    }
    setIsTesting(false);
  };

  const handleSaveSettings = () => {
    localStorage.setItem("orlife_whatsapp_api_config", JSON.stringify({
      gatewayUrl, aiBridgeUrl, sessionKey, apiKey,
      updatedAt: new Date().toISOString(),
    }));
    setSavedSuccess(true);
    setTimeout(() => { setSavedSuccess(false); onClose(); }, 1200);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 dark:bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#091720] border border-slate-200 dark:border-[#1b3e54] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-900 dark:text-slate-100">

        {/* ── Header ── */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-[#163244] flex items-center justify-between bg-slate-50 dark:bg-[#051119]/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                WhatsApp API Gateway &amp; AI Hub
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Configure connection settings and copy AI API endpoints
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#122b3b] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Section Tabs ── */}
        <div className="flex border-b border-slate-200 dark:border-[#163244] bg-slate-50 dark:bg-[#051119]/60 px-6 gap-1 shrink-0">
          <button
            onClick={() => setActiveSection("config")}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeSection === "config"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Globe className="w-3.5 h-3.5" /> API Configuration
          </button>
          <button
            onClick={() => setActiveSection("ai-api")}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeSection === "ai-api"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> AI API Endpoints
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-[#18364b] [&::-webkit-scrollbar-thumb]:rounded-full">

          {/* ══ SECTION 1: Config ══ */}
          {activeSection === "config" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* WhatsApp Engine URL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-500" /> WhatsApp Engine URL
                  </label>
                  <input
                    type="text"
                    value={gatewayUrl}
                    onChange={(e) => setGatewayUrl(e.target.value)}
                    placeholder="http://localhost:8080"
                    className="w-full bg-slate-50 dark:bg-[#040e14] border border-slate-200 dark:border-[#17374c] rounded-xl px-3.5 py-2 text-xs font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                  />
                  <span className="text-[11px] text-slate-400">Baileys WhatsApp server (Port 8080)</span>
                </div>

                {/* AI Hub Bridge URL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> AI Hub Bridge URL
                  </label>
                  <input
                    type="text"
                    value={aiBridgeUrl}
                    onChange={(e) => setAiBridgeUrl(e.target.value)}
                    placeholder="http://localhost:8090/ai-hub/process"
                    className="w-full bg-slate-50 dark:bg-[#040e14] border border-slate-200 dark:border-[#17374c] rounded-xl px-3.5 py-2 text-xs font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                  />
                  <span className="text-[11px] text-slate-400">OrLife Flash AI auto-reply bridge (Port 8090)</span>
                </div>

                {/* Session Key */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-emerald-500" /> Session Key / Instance ID
                  </label>
                  <input
                    type="text"
                    value={sessionKey}
                    onChange={(e) => setSessionKey(e.target.value)}
                    placeholder="OrLifeBot"
                    className="w-full bg-slate-50 dark:bg-[#040e14] border border-slate-200 dark:border-[#17374c] rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                  />
                  <span className="text-[11px] text-slate-400">WhatsApp instance name used across all apps</span>
                </div>

                {/* API Key */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-emerald-500" /> Secret API Bearer Token
                    </label>
                    <button
                      type="button"
                      onClick={() => setApiKey(generateProfessionalApiToken("orl_sk_live_"))}
                      className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                      title="Generate unique token"
                    >
                      <Sparkles className="w-2.5 h-2.5" /> Generate
                    </button>
                  </div>
                  <div className="relative flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <input
                        type={showApiKey ? "text" : "password"}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="orl_sk_live_..."
                        className="w-full bg-slate-50 dark:bg-[#040e14] border border-slate-200 dark:border-[#17374c] rounded-xl pl-3.5 pr-8 py-2 text-xs font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey((prev: boolean) => !prev)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition-colors"
                      >
                        {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(apiKey);
                        setCopiedToken(true);
                        setTimeout(() => setCopiedToken(false), 2000);
                      }}
                      className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all shrink-0 active:scale-95"
                    >
                      {copiedToken ? (
                        <><Check className="w-3.5 h-3.5 text-emerald-500" /> Copied!</>
                      ) : (
                        <><Copy className="w-3.5 h-3.5" /> Copy</>
                      )}
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-400">Authorization token for API requests</span>
                </div>
              </div>

              {/* Test Result */}
              {testResult && (
                <div className={`p-4 rounded-xl border text-xs space-y-2 animate-in fade-in ${
                  testResult.success
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-200"
                    : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-200"
                }`}>
                  <div className="flex items-center gap-2 font-semibold">
                    {testResult.success
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      : <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    }
                    <span>{testResult.message}</span>
                    {testResult.latencyMs && (
                      <span className="ml-auto font-mono bg-white dark:bg-[#040e14] px-2 py-0.5 rounded text-[11px] border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                        {testResult.latencyMs}ms
                      </span>
                    )}
                  </div>
                  {testResult.success && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-500/20 text-[11px] font-mono">
                      <div>
                        <span className="text-slate-500 block">Engine (8080):</span>
                        <span className="font-bold">{testResult.engineStatus}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">AI Hub (8090):</span>
                        <span className="font-bold">{testResult.aiBridgeStatus}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ══ SECTION 2: AI API Endpoints ══ */}
          {activeSection === "ai-api" && (
            <div className="space-y-4">
              {/* Info banner */}
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-start gap-3">
                <Zap className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    OrLife Flash AI — Universal API Endpoints
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Inhe copy karke kisi bhi project mein use karo. Ye endpoints OpenAI aur Gemini format support karte hain.
                    AI Hub locally chalana zaroori hai (Port 8090).
                  </p>
                </div>
              </div>

              {/* Endpoint Cards */}
              <div className="space-y-3">
                {AI_HUB_ENDPOINTS.map((ep) => (
                  <div
                    key={ep.url}
                    className="bg-slate-50 dark:bg-[#051119] border border-slate-200 dark:border-[#163244] rounded-xl p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono border ${
                          ep.method === "GET"
                            ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/30"
                            : "text-blue-600 bg-blue-500/10 border-blue-500/30"
                        }`}>
                          {ep.method}
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{ep.label}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(ep.url)}
                        className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#17374c] hover:border-emerald-500/50 text-slate-500 hover:text-emerald-500 transition-all active:scale-95 bg-white dark:bg-[#0a1e2b]"
                      >
                        {copiedUrl === ep.url
                          ? <><Check className="w-3 h-3 text-emerald-500" /> Copied!</>
                          : <><Copy className="w-3 h-3" /> Copy</>
                        }
                      </button>
                    </div>
                    <code className="block text-[11px] font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#02090e] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#112634] truncate">
                      {ep.url}
                    </code>
                    <p className="text-[11px] text-slate-400">{ep.desc}</p>
                  </div>
                ))}
              </div>

              {/* Usage example */}
              <div className="bg-slate-50 dark:bg-[#051119] border border-slate-200 dark:border-[#163244] rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-emerald-500" /> Quick Usage Example (OpenAI Format)
                  </span>
                  <button
                    onClick={() => handleCopy(`await fetch("http://localhost:8090/v1/chat/completions", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    messages: [{ role: "user", content: "Aapka price kya hai?" }]
  })
});`)}
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-semibold flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 dark:border-[#17374c] hover:border-emerald-500/50 transition-all active:scale-95 bg-white dark:bg-[#0a1e2b]"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
                <pre className="text-[11px] font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-[#02090e] p-3 rounded-lg border border-slate-200 dark:border-[#112634] overflow-x-auto leading-relaxed">
{`await fetch("http://localhost:8090/v1/chat/completions", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    messages: [{ role: "user", content: "Aapka price kya hai?" }]
  })
});`}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-[#163244] bg-slate-50 dark:bg-[#051119]/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {activeSection === "config" ? (
            <>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="w-full sm:w-auto bg-slate-100 dark:bg-[#0a1e2b] hover:bg-slate-200 dark:hover:bg-[#112d40] text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? "animate-spin" : ""}`} />
                {isTesting ? "Testing..." : "Test Connection"}
              </button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button type="button" onClick={onClose} className="w-full sm:w-auto bg-slate-100 dark:bg-[#0a1e2b] hover:bg-slate-200 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-[#17374c] transition-colors">
                  Cancel
                </button>
                <button type="button" onClick={handleSaveSettings} className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 active:scale-95">
                  {savedSuccess ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : "💾 Save Settings"}
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex justify-end">
              <button type="button" onClick={onClose} className="bg-slate-100 dark:bg-[#0a1e2b] hover:bg-slate-200 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-[#17374c] transition-colors">
                Close
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
