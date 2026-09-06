"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle2, AlertCircle, RefreshCw, Copy, Check, Server, Key, Globe, Shield, Sparkles, Send, Eye, EyeOff, Terminal } from "lucide-react";

interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ApiConfigModal({ isOpen, onClose }: ApiConfigModalProps) {
  const [gatewayUrl, setGatewayUrl] = useState("http://localhost:8080");
  const [aiBridgeUrl, setAiBridgeUrl] = useState("http://localhost:8090/ai-hub/process");
  const [sessionKey, setSessionKey] = useState("OrLifeBot");
  const [apiKey, setApiKey] = useState("orlife_secret_token_2026");
  const [showApiKey, setShowApiKey] = useState(false);

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    engineStatus?: string;
    aiBridgeStatus?: string;
    latencyMs?: number;
  } | null>(null);

  const [copiedCode, setCopiedCode] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    // Load persisted settings from localStorage if available
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
      // Test Port 8080 Engine
      const engineRes = await fetch(`${gatewayUrl}/instance/fetchInstances`);
      const engineData = await engineRes.json();

      // Test Port 8090 AI Bridge
      const bridgeHealthUrl = aiBridgeUrl.replace(/\/ai-hub\/process.*/, '/health');
      let bridgeStatus = "OFFLINE";
      try {
        const bridgeRes = await fetch(bridgeHealthUrl);
        const bridgeData = await bridgeRes.json();
        bridgeStatus = bridgeData.status === "ONLINE" ? "ONLINE (Active)" : "UNKNOWN";
      } catch (e) {
        bridgeStatus = "OFFLINE (Bridge not responding)";
      }

      const latencyMs = Date.now() - startMs;

      setTestResult({
        success: true,
        message: "API Gateway & AI Hub Bridge connected successfully!",
        engineStatus: Array.isArray(engineData) && engineData.length > 0 ? "ONLINE (Active Session)" : "ONLINE (Awaiting QR Scan)",
        aiBridgeStatus: bridgeStatus,
        latencyMs,
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        message: `Connection Failed: Could not reach engine on ${gatewayUrl}. Please ensure server is running.`,
      });
    }

    setIsTesting(false);
  };

  const handleSaveSettings = () => {
    const configData = {
      gatewayUrl,
      aiBridgeUrl,
      sessionKey,
      apiKey,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem("orlife_whatsapp_api_config", JSON.stringify(configData));
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const sampleSnippet = `// Universal WhatsApp API Client Snippet
const API_URL = "${gatewayUrl}";
const SESSION_KEY = "${sessionKey}";

// 1. Fetch QR Code:
const res = await fetch(\`\${API_URL}/instance/connect/\${SESSION_KEY}\`);
const qrData = await res.json(); // returns Base64 QR

// 2. Send WhatsApp Message:
await fetch(\`\${API_URL}/message/sendText/\${SESSION_KEY}\`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    number: '919876543210',
    textMessage: { text: 'Hello from WhatsApp API Gateway!' }
  })
});`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(sampleSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#091720] border border-[#1b3e54] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#163244] flex items-center justify-between bg-[#051119]/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100 tracking-tight">
                  Configure WhatsApp API Gateway
                </h3>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-300 font-mono font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  V2.1 ENTERPRISE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Set central API endpoints for OrLife Connect, OrLife AI Hub, Chit Fund & CRM integration.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#122b3b] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body with Clean Custom Scrollbar */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#18364b] [&::-webkit-scrollbar-thumb]:rounded-full">
          
          {/* Section 1: Main API Endpoint Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Input 1: Base URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp Engine Base URL
              </label>
              <input
                type="text"
                value={gatewayUrl}
                onChange={(e) => setGatewayUrl(e.target.value)}
                placeholder="http://localhost:8080"
                className="w-full bg-[#040e14] border border-[#17374c] rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner"
              />
              <span className="text-[11px] text-slate-400">Main Baileys Sending Server (Port 8080)</span>
            </div>

            {/* Input 2: AI Hub Bridge */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> AI Hub Bridge Webhook URL
              </label>
              <input
                type="text"
                value={aiBridgeUrl}
                onChange={(e) => setAiBridgeUrl(e.target.value)}
                placeholder="http://localhost:8090/ai-hub/process"
                className="w-full bg-[#040e14] border border-[#17374c] rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner"
              />
              <span className="text-[11px] text-slate-400">2-Way AI Auto-Reply Bridge (Port 8090)</span>
            </div>

            {/* Input 3: Session Key */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-emerald-400" /> Session Key / Instance ID
              </label>
              <input
                type="text"
                value={sessionKey}
                onChange={(e) => setSessionKey(e.target.value)}
                placeholder="OrLifeBot"
                className="w-full bg-[#040e14] border border-[#17374c] rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner"
              />
              <span className="text-[11px] text-slate-400">Unique Session Name across all apps</span>
            </div>

            {/* Input 4: Secret API Bearer Token */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-400" /> Secret API Bearer Token
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="orlife_secret_token_2026"
                  className="w-full bg-[#040e14] border border-[#17374c] rounded-xl pl-3.5 pr-10 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-400 transition-colors p-1"
                  title={showApiKey ? "Hide Token" : "Show Token"}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4 text-emerald-400" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[11px] text-slate-400">Security token (Ends in ...2026)</span>
            </div>
          </div>

          {/* Section 2: Test Connection Result Banner */}
          {testResult && (
            <div
              className={`p-4 rounded-xl border text-xs space-y-2 animate-in fade-in transition-all ${
                testResult.success
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                  : "bg-red-500/10 border-red-500/30 text-red-200"
              }`}
            >
              <div className="flex items-center justify-between font-semibold">
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
                {testResult.latencyMs && (
                  <span className="font-mono bg-[#040e14] px-2 py-0.5 rounded text-[11px] border border-emerald-500/30 text-emerald-400">
                    {testResult.latencyMs}ms Latency
                  </span>
                )}
              </div>

              {testResult.success && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-500/20 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-400 block">Engine Status (8080):</span>
                    <span className="text-emerald-400 font-bold">{testResult.engineStatus}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">AI Bridge Status (8090):</span>
                    <span className="text-emerald-400 font-bold">{testResult.aiBridgeStatus}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 3: Universal Integration Code Box */}
          <div className="bg-[#051119] border border-[#163244] rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" /> Universal Copy-Paste Integration Snippet
              </span>

              <button
                onClick={handleCopyCode}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5 bg-[#0a1e2b] px-3 py-1 rounded-lg border border-[#17374c] hover:border-emerald-500/50 transition-all active:scale-95 shadow-sm"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode ? "Copied!" : "Copy Code"}
              </button>
            </div>

            <pre className="text-[11px] font-mono text-slate-300 bg-[#02090e] p-3 rounded-lg border border-[#112634] max-h-36 overflow-y-auto leading-relaxed [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#18364b] [&::-webkit-scrollbar-thumb]:rounded-full">
              {sampleSnippet}
            </pre>
          </div>
        </div>

        {/* Modal Action Bar Footer */}
        <div className="px-6 py-4 border-t border-[#163244] bg-[#051119]/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="w-full sm:w-auto bg-[#0a1e2b] hover:bg-[#112d40] text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? "animate-spin" : ""}`} />
            {isTesting ? "Testing Gateway..." : "Test Connection"}
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto bg-[#0a1e2b] hover:bg-[#142d3e] text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold border border-[#17374c] transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveSettings}
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" /> Saved!
                </>
              ) : (
                <>💾 Save API Settings</>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
