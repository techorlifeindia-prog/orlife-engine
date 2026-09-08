"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { getInitialSessionInfo, generateProfessionalApiToken, getUserSpecificApiToken } from "@/lib/user-session-utils";
import {
  Webhook, ShieldCheck, Globe, Key, Send, Eye, EyeOff,
  RefreshCw, CheckCircle2, AlertCircle, Sparkles, Copy,
  Check, Zap, Server, Lock, User, Save
} from "lucide-react";

const AI_ENDPOINTS = [
  { label: "Health Check",   method: "GET",  url: "http://localhost:8090/health",                                                    desc: "Check AI Hub online status" },
  { label: "Test AI Reply",  method: "POST", url: "http://localhost:8090/ai-hub/simulate",                                           desc: "Simulate a customer message & get reply" },
  { label: "OpenAI Format",  method: "POST", url: "http://localhost:8090/v1/chat/completions",                                       desc: "Universal OpenAI-compatible endpoint" },
  { label: "Gemini Format",  method: "POST", url: "http://localhost:8090/v1beta/models/gemini-1.5-flash:generateContent",            desc: "Universal Gemini-compatible endpoint" },
];

type Section = "whatsapp" | "ai" | "system";

export default function SettingsPage() {
  const [openSection, setOpenSection] = useState<Section>("whatsapp");
  const [session, setSession] = useState(() => getInitialSessionInfo());
  const [apiToken, setApiToken] = useState(() => getUserSpecificApiToken());

  useEffect(() => {
    setSession(getInitialSessionInfo());
    setApiToken(getUserSpecificApiToken());

    // Check query params for tab selection (e.g. /settings?tab=whatsapp)
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get("tab") as Section;
      if (tabParam && ["whatsapp", "ai", "system"].includes(tabParam)) {
        setOpenSection(tabParam);
      }
    }

    const syncSession = () => {
      const sess = getInitialSessionInfo();
      setSession(sess);
      setApiToken(getUserSpecificApiToken());
    };
    window.addEventListener("storage", syncSession);
    window.addEventListener("user_session_changed", syncSession);
    return () => {
      window.removeEventListener("storage", syncSession);
      window.removeEventListener("user_session_changed", syncSession);
    };
  }, []);

  const isClientView = session.isClientView;

  // WhatsApp
  const [gatewayUrl, setGatewayUrl] = useState("http://localhost:8080");
  const [sessionKey, setSessionKey]  = useState("OrLifeBot");
  const [showToken,  setShowToken]   = useState(false);
  const [isTesting,  setIsTesting]   = useState(false);
  const [isSaved,    setIsSaved]     = useState(false);
  const [testResult, setTestResult]  = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);


  // AI Hub Config state
  const [aiBaseUrl, setAiBaseUrl] = useState("http://localhost:8090");
  const [aiModelName, setAiModelName] = useState("llama3.2");
  const [aiSecretKey, setAiSecretKey] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("orlife_ai_hub_config");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.aiSecretKey) return parsed.aiSecretKey;
        } catch (e) {}
      }
    }
    return "orl_sec_ai_9a8b7c6d5e4f3a2b1c0d9e8f";
  });
  const [showAiKey, setShowAiKey] = useState(false);
  const [isAiTesting, setIsAiTesting] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);
  const [isAiSaved, setIsAiSaved] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const handleCopyToken = (tokenText: string, id: string) => {
    navigator.clipboard.writeText(tokenText);
    setCopiedToken(id);
    setTimeout(() => setCopiedToken(null), 2000);
  };


  // Webhook + Anti-Ban
  const [webhookUrl, setWebhookUrl] = useState("http://localhost:7001/api/webhook/whatsapp");
  const [events, setEvents] = useState({ MESSAGES_UPSERT: true, CONNECTION_UPDATE: true, QRCODE_UPDATED: true, SEND_MESSAGE: false });

  const handleTestAi = async () => {
    setIsAiTesting(true);
    setAiTestResult(null);
    const start = Date.now();
    try {
      const res = await fetch(`${aiBaseUrl}/health`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        setAiTestResult({
          success: true,
          message: `AI Hub Online — Engine Status: ${data.ollama || "Ready"}`,
          latencyMs: Date.now() - start,
        });
      } else {
        setAiTestResult({ success: false, message: `Server returned ${res.status} from ${aiBaseUrl}` });
      }
    } catch {
      setAiTestResult({ success: false, message: `Cannot reach AI Hub at ${aiBaseUrl}. Ensure server is running.` });
    }
    setIsAiTesting(false);
  };

  const handleSaveAiConfig = () => {
    localStorage.setItem("orlife_ai_hub_config", JSON.stringify({ aiBaseUrl, aiModelName, aiSecretKey, updatedAt: new Date().toISOString() }));
    setIsAiSaved(true);
    setTimeout(() => setIsAiSaved(false), 2000);
  };

  const handleTest = async () => {
    setIsTesting(true); setTestResult(null);
    const t = Date.now();
    try {
      const res  = await fetch(`${gatewayUrl}/instance/fetchInstances`);
      const data = await res.json();
      setTestResult({ success: true, message: Array.isArray(data) && data.length ? "Engine online — active session found!" : "Engine online — awaiting QR scan.", latencyMs: Date.now() - t });
    } catch {
      setTestResult({ success: false, message: `Cannot reach engine at ${gatewayUrl}.` });
    }
    setIsTesting(false);
  };

  const handleSave = () => {
    localStorage.setItem("orlife_whatsapp_api_config", JSON.stringify({ gatewayUrl, sessionKey, apiToken, updatedAt: new Date().toISOString() }));
    setIsSaved(true); setTimeout(() => setIsSaved(false), 2000);
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url); setTimeout(() => setCopiedUrl(null), 2000);
  };

  // ── Tab card config ──────────────────────────────────────
  const TABS: { key: Section; icon: React.ReactNode; title: string; sub: string; badge?: string }[] = [
    { key: "whatsapp", icon: <Server     className="w-4 h-4" />, title: "WhatsApp Gateway", sub: "Engine · Session · Token", badge: undefined },
    { key: "ai",       icon: <Sparkles   className="w-4 h-4" />, title: "Flash AI Hub",     sub: "Copy API Endpoints",       badge: "ACTIVE"  },
    { key: "system",   icon: <ShieldCheck className="w-4 h-4" />, title: "System Config",    sub: "Webhooks · Anti-Ban",      badge: undefined },
  ];

  return (
    <div className="min-h-full pb-8">
      <Header title="System Settings" />

      <div className="px-3 py-4 w-full space-y-4">

        {/* ════ Client View Read-Only Banner ════ */}
        {isClientView && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-700 dark:text-amber-300 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Client View Mode — System Configuration Read-Only</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  WhatsApp API Gateway, Flash AI Hub credentials, and System Webhooks are managed globally by Super Admin.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-extrabold px-3 py-1 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 shrink-0 self-start sm:self-auto">
              🔒 READ ONLY
            </span>
          </div>
        )}

        {/* ════ Compact Horizontal Tab Bar ════ */}
        <div className="flex items-center gap-2 bg-white dark:bg-[#0b1d28] border border-slate-200 dark:border-[#1b3a4e] rounded-2xl p-1.5 shadow-sm">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setOpenSection(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                openSection === tab.key
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#112d40]"
              }`}
            >
              {tab.icon}
              <span>{tab.title}</span>
              {tab.badge && openSection !== tab.key && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════
            CONTENT PANEL — below the 3 cards
        ════════════════════════════════════════════ */}
        <div className="bg-white dark:bg-[#0b1d28] border border-slate-200 dark:border-[#1b3a4e] rounded-2xl shadow-sm p-6 animate-in fade-in duration-200">

          {/* ── PANEL 1: WhatsApp Gateway ── */}
          {openSection === "whatsapp" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Server className="w-5 h-5 text-emerald-500" /> WhatsApp API Gateway
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Configure your Baileys WhatsApp Engine connection settings.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-500" /> Engine Base URL
                  </label>
                  <input type="text" value={gatewayUrl} onChange={e => setGatewayUrl(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#06141c] border border-slate-200 dark:border-[#1b3a4e] rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 text-slate-900 dark:text-slate-100 transition-all" />
                  <span className="text-[11px] text-slate-400">Baileys server — Port 8080</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-emerald-500" /> Session Key / Instance ID
                  </label>
                  <input type="text" value={sessionKey} onChange={e => setSessionKey(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#06141c] border border-slate-200 dark:border-[#1b3a4e] rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all" />
                  <span className="text-[11px] text-slate-400">WhatsApp instance name</span>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-emerald-500" /> Secret API Bearer Token
                    </label>
                    <button
                      type="button"
                      onClick={() => setApiToken(generateProfessionalApiToken("orl_sk_live_"))}
                      className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                      title="Generate new unique professional token"
                    >
                      <Sparkles className="w-3 h-3" /> Generate Unique Token
                    </button>
                  </div>
                  <div className="relative flex items-center gap-2">
                    <div className="relative flex-1">
                      <input type={showToken ? "text" : "password"} value={apiToken} onChange={e => setApiToken(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#06141c] border border-slate-200 dark:border-[#1b3a4e] rounded-xl pl-3.5 pr-10 py-2.5 text-xs font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 text-slate-900 dark:text-slate-100 transition-all" />
                      <button type="button" onClick={() => setShowToken(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition-colors">
                        {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyToken(apiToken, "whatsapp_token")}
                      className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 active:scale-95"
                    >
                      {copiedToken === "whatsapp_token" ? (
                        <><Check className="w-4 h-4 text-emerald-500" /> Copied!</>
                      ) : (
                        <><Copy className="w-4 h-4" /> Copy Token</>
                      )}
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-400">Authorization token for API requests (Format: <code>orl_sk_live_...</code>)</span>
                </div>
              </div>

              {testResult && (
                <div className={`p-3 rounded-xl border text-[11px] flex items-start gap-2 ${
                  testResult.success ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                    : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"}`}>
                  {testResult.success
                    ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    : <AlertCircle  className="w-4 h-4 shrink-0 mt-0.5" />}
                  <span>{testResult.message}</span>
                  {testResult.latencyMs && <span className="ml-auto font-mono font-bold shrink-0">{testResult.latencyMs}ms</span>}
                </div>
              )}

              <div className="flex items-center gap-3 pt-1">
                <button onClick={handleTest} disabled={isTesting}
                  className="flex-1 bg-slate-50 dark:bg-[#06141c] hover:bg-slate-100 dark:hover:bg-[#112d40] text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 active:scale-95">
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? "animate-spin" : ""}`} />
                  {isTesting ? "Testing..." : "Test Connection"}
                </button>
                <button onClick={handleSave}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 active:scale-95">
                  {isSaved ? <><CheckCircle2 className="w-3.5 h-3.5" /> Saved!</> : "💾 Save Settings"}
                </button>
              </div>
            </div>
          )}

          {/* ── PANEL 2: AI Hub Configuration & API Integration ── */}
          {openSection === "ai" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-500" /> OrLife Flash AI Hub Integration
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 ml-1">ACTIVE</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Configure your self-hosted Local Ollama AI or VPS production server.</p>
              </div>

              {/* Server Credentials */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-[#06141c] border border-slate-200 dark:border-[#1b3a4e] p-4 rounded-xl">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-500" /> Server Base URL
                  </label>
                  <input type="text" value={aiBaseUrl} onChange={e => setAiBaseUrl(e.target.value)}
                    placeholder="http://localhost:8001"
                    className="w-full bg-white dark:bg-[#0b1d28] border border-slate-200 dark:border-[#1b3a4e] rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500" />
                  <span className="text-[10px] text-slate-400">Local (8090) or VPS IP/Domain</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> Model Name
                  </label>
                  <input type="text" value={aiModelName} onChange={e => setAiModelName(e.target.value)}
                    placeholder="llama3.2"
                    className="w-full bg-white dark:bg-[#0b1d28] border border-slate-200 dark:border-[#1b3a4e] rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-emerald-500" />
                  <span className="text-[10px] text-slate-400">Ollama AI model identifier</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-emerald-500" /> API Secret Token
                    </label>
                    <button
                      type="button"
                      onClick={() => setAiSecretKey(generateProfessionalApiToken("orl_sec_ai_"))}
                      className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                      title="Generate new unique AI token"
                    >
                      <Sparkles className="w-2.5 h-2.5" /> Generate
                    </button>
                  </div>
                  <div className="relative flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <input type={showAiKey ? "text" : "password"} value={aiSecretKey} onChange={e => setAiSecretKey(e.target.value)}
                        className="w-full bg-white dark:bg-[#0b1d28] border border-slate-200 dark:border-[#1b3a4e] rounded-xl pl-3 pr-7 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500" />
                      <button type="button" onClick={() => setShowAiKey(p => !p)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500">
                        {showAiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyToken(aiSecretKey, "ai_token")}
                      className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all shrink-0 active:scale-95"
                      title="Copy API Secret Token"
                    >
                      {copiedToken === "ai_token" ? (
                        <><Check className="w-3.5 h-3.5 text-emerald-500" /> Copied!</>
                      ) : (
                        <><Copy className="w-3.5 h-3.5" /> Copy</>
                      )}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400">Secret key for authorization</span>
                </div>


                <div className="md:col-span-3 flex items-center gap-3 pt-1">
                  <button onClick={handleTestAi} disabled={isAiTesting}
                    className="flex-1 bg-white dark:bg-[#0b1d28] hover:bg-slate-100 dark:hover:bg-[#112d40] text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 active:scale-95">
                    <RefreshCw className={`w-3.5 h-3.5 ${isAiTesting ? "animate-spin" : ""}`} />
                    {isAiTesting ? "Testing AI..." : "Test AI Connection"}
                  </button>
                  <button onClick={handleSaveAiConfig}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 active:scale-95">
                    {isAiSaved ? <><CheckCircle2 className="w-3.5 h-3.5" /> Saved!</> : "💾 Save Settings"}
                  </button>
                </div>

                {aiTestResult && (
                  <div className={`md:col-span-3 p-3 rounded-xl border text-[11px] flex items-center justify-between ${
                    aiTestResult.success ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                      : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"}`}>
                    <div className="flex items-center gap-2">
                      {aiTestResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
                      <span>{aiTestResult.message}</span>
                    </div>
                    {aiTestResult.latencyMs && <span className="font-mono font-bold">{aiTestResult.latencyMs}ms</span>}
                  </div>
                )}
              </div>

              {/* Single Clear Copy API Link Card */}
              <div className="bg-slate-50 dark:bg-[#06141c] border border-slate-200 dark:border-[#1b3a4e] p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-500" /> Copy Universal AI Integration Endpoint
                  </h4>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                    OpenAI & Gemini Compatible
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Is API Link ko copy karke kisi bhi project (jaise AI Hub ya external SaaS) mein paste karein:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white dark:bg-[#0b1d28] border border-slate-200 dark:border-[#1b3a4e] p-2.5 rounded-xl font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold truncate">
                    {`${aiBaseUrl}/v1/chat/completions`}
                  </code>
                  <button onClick={() => handleCopy(`${aiBaseUrl}/v1/chat/completions`)}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md transition-all active:scale-95 shrink-0">
                    {copiedUrl === `${aiBaseUrl}/v1/chat/completions`
                      ? <><Check className="w-4 h-4" /> Copied!</>
                      : <><Copy className="w-4 h-4" /> Copy API Link</>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── PANEL 3: System Config ── */}
          {openSection === "system" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-green-500" /> System Configuration
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Webhook events and anti-ban broadcast limits.</p>
              </div>

              {/* Webhooks */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Webhook className="w-3.5 h-3.5" /> Webhook Event Sync
                </h4>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">Global Webhook Endpoint URL</label>
                  <input type="text" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#06141c] border border-slate-200 dark:border-[#1b3a4e] rounded-xl px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100" />
                  <p className="text-[11px] text-slate-400 mt-1">All WhatsApp events will be forwarded here in real-time.</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(events).map(([evt, isChecked]) => (
                    <label key={evt} className="flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-[#1b3a4e] bg-slate-50 dark:bg-[#06141c] cursor-pointer hover:border-emerald-500/40 transition-colors text-center">
                      <input type="checkbox" checked={isChecked} onChange={() => setEvents(prev => ({ ...prev, [evt]: !prev[evt as keyof typeof events] }))} className="w-4 h-4 accent-emerald-500" />
                      <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 leading-tight">{evt.replace("_", "_\n")}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        isChecked ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-600"}`}>
                        {isChecked ? "ON" : "OFF"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-[#1b3a4e]" />

              {/* Anti-Ban */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Anti-Ban Safety Thresholds
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-[#1b3a4e] bg-slate-50 dark:bg-[#06141c] space-y-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Max Messages Per Hour</span>
                    <input type="number" defaultValue={150} className="w-full bg-white dark:bg-[#0b1d28] border border-slate-200 dark:border-[#1b3a4e] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100" />
                    <span className="text-[11px] text-slate-400">Limits hourly rate to prevent ban flags.</span>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-[#1b3a4e] bg-slate-50 dark:bg-[#06141c] space-y-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Message Interval (seconds)</span>
                    <input type="number" defaultValue={8} className="w-full bg-white dark:bg-[#0b1d28] border border-slate-200 dark:border-[#1b3a4e] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100" />
                    <span className="text-[11px] text-slate-400">Sleep time between each message in campaigns.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
