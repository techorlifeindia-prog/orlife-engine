"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ApiConfigModal } from "@/components/settings/api-config-modal";
import { Settings, Server, Bot, Webhook, ShieldCheck, RefreshCw, CheckCircle2, AlertCircle, Plus, Trash2, Save, ToggleLeft, ToggleRight, Sparkles, Key, Globe, SlidersHorizontal } from "lucide-react";

interface AutoReplyRule {
  id: string;
  keyword: string;
  matchType: "Exact" | "Contains" | "Starts With";
  replyText: string;
  enabled: boolean;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"api" | "aihub" | "bot" | "webhook" | "general">("aihub");
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);

  // API Config State
  const [apiUrl, setApiUrl] = useState("http://localhost:8080");
  const [apiKey, setApiKey] = useState("42960089370CC00550B1B63C056D42A4");
  const [healthStatus, setHealthStatus] = useState<{ status: string; message: string; latency?: string } | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);

  // AI Hub Integration State
  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiModel, setAiModel] = useState("Ollama Llama 3.2 (100% Private Local Model)");
  const [aiPersona, setAiPersona] = useState(
    "You are OrLife AI Assistant. Politely answer customer inquiries regarding pricing, Chit Fund SaaS, KhataHisab, and WhatsApp automation."
  );
  const [testPrompt, setTestPrompt] = useState("What is the price of OrLife Connect?");
  const [testAiResult, setTestAiResult] = useState<{ model?: string; response?: string } | null>(null);
  const [isTestingAi, setIsTestingAi] = useState(false);

  const handleTestAiResponse = async () => {
    if (!testPrompt.trim()) return;
    setIsTestingAi(true);
    try {
      const res = await fetch("/api/ai-hub/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: testPrompt, persona: aiPersona, modelProvider: aiModel }),
      });
      const data = await res.json();
      setTestAiResult(data);
    } catch (e) {
      console.error(e);
    }
    setIsTestingAi(false);
  };

  // Auto-Responder Bot Rules
  const [botRules, setBotRules] = useState<AutoReplyRule[]>([
    {
      id: "1",
      keyword: "PRICE",
      matchType: "Contains",
      replyText: "Hello! Our pricing starts at $10/mo for OrLife Connect. Reply INFO for details.",
      enabled: true,
    },
    {
      id: "2",
      keyword: "HELP",
      matchType: "Exact",
      replyText: "OrLife Support Team here! Please leave your question and our agent will respond shortly.",
      enabled: true,
    },
    {
      id: "3",
      keyword: "HOURS",
      matchType: "Contains",
      replyText: "Our working hours are Monday - Saturday, 9:00 AM to 7:00 PM IST.",
      enabled: false,
    },
  ]);

  const [newKeyword, setNewKeyword] = useState("");
  const [newMatchType, setNewMatchType] = useState<AutoReplyRule["matchType"]>("Contains");
  const [newReplyText, setNewReplyText] = useState("");

  // Webhook State (Pre-configured for AI Hub Frontend / Backend on Port 7001)
  const [webhookUrl, setWebhookUrl] = useState("http://localhost:7001/api/webhook/whatsapp");
  const [events, setEvents] = useState({
    MESSAGES_UPSERT: true,
    CONNECTION_UPDATE: true,
    QRCODE_UPDATED: true,
    SEND_MESSAGE: false,
  });

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const res = await fetch("/api/evolution/settings");
      const data = await res.json();
      setHealthStatus(data);
    } catch (error) {
      setHealthStatus({
        status: "DEMO_MODE",
        message: "Running in local simulated demo mode",
        latency: "12ms",
      });
    }
    setTestingConnection(false);
  };

  const handleAddRule = () => {
    if (!newKeyword.trim() || !newReplyText.trim()) {
      alert("Please provide both keyword and reply text!");
      return;
    }

    const newRule: AutoReplyRule = {
      id: Date.now().toString(),
      keyword: newKeyword.trim().toUpperCase(),
      matchType: newMatchType,
      replyText: newReplyText.trim(),
      enabled: true,
    };

    setBotRules(prev => [newRule, ...prev]);
    setNewKeyword("");
    setNewReplyText("");
  };

  const toggleRule = (id: string) => {
    setBotRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const deleteRule = (id: string) => {
    setBotRules(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="min-h-full pb-8">
      <Header title="System Settings & Auto-Responder Bot" />

      {/* Render Dialog Box Modal */}
      <ApiConfigModal isOpen={isApiModalOpen} onClose={() => setIsApiModalOpen(false)} />

      <div className="px-3 py-4 w-full space-y-5">
        {/* Top Floating Button for Open API Gateway Dialog Box */}
        <div className="flex justify-end">
          <button
            onClick={() => setIsApiModalOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
          >
            <SlidersHorizontal className="w-4 h-4" /> Configure WhatsApp API Gateway (Dialog Box)
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-border gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab("aihub")}
            className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-sm rounded-t-xl transition-all ${
              activeTab === "aihub"
                ? "bg-card border-t border-x border-border text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-400" /> OrLife AI Hub Integration
          </button>

          <button
            onClick={() => setActiveTab("api")}
            className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-sm rounded-t-xl transition-all ${
              activeTab === "api"
                ? "bg-card border-t border-x border-border text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Server className="w-4 h-4" /> API Server & Health
          </button>

          <button
            onClick={() => setActiveTab("bot")}
            className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-sm rounded-t-xl transition-all ${
              activeTab === "bot"
                ? "bg-card border-t border-x border-border text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bot className="w-4 h-4" /> Auto-Responder Bot
          </button>

          <button
            onClick={() => setActiveTab("webhook")}
            className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-sm rounded-t-xl transition-all ${
              activeTab === "webhook"
                ? "bg-card border-t border-x border-border text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Webhook className="w-4 h-4" /> Webhooks & Events
          </button>

          <button
            onClick={() => setActiveTab("general")}
            className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-sm rounded-t-xl transition-all ${
              activeTab === "general"
                ? "bg-card border-t border-x border-border text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Anti-Ban Defaults
          </button>
        </div>

        {/* Tab 0: AI Hub Integration & Live Tester */}
        {activeTab === "aihub" && (
          <div className="space-y-6">
            <div className="bg-[#0b1d28] border border-[#1b3a4e] p-6 rounded-2xl shadow-lg space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#183647] pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-400" /> OrLife AI Hub & Gemini LLM Bridge
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Connect 2-Way AI Agent auto-responder to answer customer queries 24/7 on WhatsApp.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-semibold text-slate-300">AI Auto-Responder:</span>
                  <button
                    type="button"
                    onClick={() => setAiEnabled((prev) => !prev)}
                    className={`text-xs px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                      aiEnabled
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                    }`}
                  >
                    {aiEnabled ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4" />}
                    {aiEnabled ? "Active (24/7)" : "Disabled"}
                  </button>
                </div>
              </div>

              {/* Model & Persona Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Selected AI Model Engine
                  </label>
                  <select
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    className="w-full bg-[#06141c] border border-[#1b3a4e] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-emerald-400 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Ollama Llama 3.2 (100% Private Local Model)">🔒 Ollama Llama 3.2 (100% Private Self-Hosted VPS Model)</option>
                    <option value="Gemini 1.5 Flash (OrLife AI Hub Engine)">⚡ Gemini 1.5 Flash (Recommended - Low Latency)</option>
                    <option value="Groq Llama 3.3 (Ultra-Fast Engine)">🚀 Groq Llama 3.3 (Ultra-Fast Cloud API)</option>
                    <option value="OpenAI GPT-4o Integration">🤖 OpenAI GPT-4o Integration</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    AI Agent System Persona Prompt
                  </label>
                  <textarea
                    rows={2}
                    value={aiPersona}
                    onChange={(e) => setAiPersona(e.target.value)}
                    className="w-full bg-[#06141c] border border-[#1b3a4e] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none font-sans"
                  />
                </div>
              </div>

              {/* Live Interactive AI WhatsApp Tester */}
              <div className="bg-[#06141c] border border-emerald-500/30 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Live AI WhatsApp Simulator Test
                  </h4>
                  <span className="text-[11px] text-slate-400">Simulate customer message response</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type sample customer prompt (e.g. What is the price of OrLife Connect?)"
                    value={testPrompt}
                    onChange={(e) => setTestPrompt(e.target.value)}
                    className="flex-1 bg-[#0b1d28] border border-[#1b3a4e] text-slate-100 placeholder:text-slate-500 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-emerald-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleTestAiResponse}
                    disabled={isTestingAi || !testPrompt.trim()}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 active:scale-95 shrink-0 disabled:opacity-50"
                  >
                    {isTestingAi ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Thinking...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" /> Test AI Reply
                      </>
                    )}
                  </button>
                </div>

                {/* AI Response Output Card */}
                {testAiResult && (
                  <div className="bg-[#0b1d28] border border-emerald-500/40 p-3.5 rounded-xl space-y-1.5 animate-in fade-in">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Generated WhatsApp AI Reply:
                      </span>
                      <span className="font-mono text-slate-400">{testAiResult.model}</span>
                    </div>
                    <p className="text-xs text-slate-100 font-sans leading-relaxed bg-[#06141c] p-3 rounded-lg border border-[#183647]">
                      "{testAiResult.response}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 1: API Configuration */}
        {activeTab === "api" && (
          <div className="space-y-6">
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-5">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" /> Evolution API Connection
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Connect your Next.js Dashboard to your Evolution API instance (Oracle Cloud / Local Docker).
                  </p>
                </div>

                <button
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
                  Test Connection
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Evolution API Base URL</label>
                  <input
                    type="text"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Global API Key</label>
                  <div className="relative">
                    <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl pl-9 pr-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {healthStatus && (
                <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium ${
                  healthStatus.status === 'ONLINE' ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                }`}>
                  <div className="flex items-center gap-2">
                    {healthStatus.status === 'ONLINE' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>{healthStatus.message}</span>
                  </div>
                  {healthStatus.latency && <span className="font-mono bg-card/60 px-2 py-0.5 rounded border border-border">{healthStatus.latency}</span>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Auto-Responder Bot */}
        {activeTab === "bot" && (
          <div className="space-y-6">
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-5">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary" /> Auto-Responder Keyword Rules
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Set automatic instant responses when customers text specific keywords.
                </p>
              </div>

              {/* Add New Rule Form */}
              <div className="bg-muted/40 border border-border/70 p-4 rounded-xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-primary" /> Add New Keyword Rule
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <input
                      type="text"
                      placeholder="Keyword (e.g. PRICE)"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <select
                      value={newMatchType}
                      onChange={(e) => setNewMatchType(e.target.value as AutoReplyRule["matchType"])}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="Contains">Contains Keyword</option>
                      <option value="Exact">Exact Match Only</option>
                      <option value="Starts With">Starts With Keyword</option>
                    </select>
                  </div>

                  <button
                    onClick={handleAddRule}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Add Rule
                  </button>
                </div>

                <div>
                  <textarea
                    rows={2}
                    placeholder="Automated response text..."
                    value={newReplyText}
                    onChange={(e) => setNewReplyText(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>
              </div>

              {/* Rules List */}
              <div className="space-y-3">
                {botRules.map((rule) => (
                  <div key={rule.id} className="p-4 rounded-xl border border-border bg-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm hover:shadow transition-shadow">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-primary/10 text-primary font-mono text-xs font-bold px-2.5 py-0.5 rounded border border-primary/20">
                          {rule.keyword}
                        </span>
                        <span className="text-[11px] bg-muted px-2 py-0.5 rounded text-muted-foreground">
                          {rule.matchType}
                        </span>
                      </div>
                      <p className="text-xs text-foreground font-sans mt-1">{rule.replyText}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => toggleRule(rule.id)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                          rule.enabled ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {rule.enabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        {rule.enabled ? 'Active' : 'Disabled'}
                      </button>

                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Webhooks */}
        {activeTab === "webhook" && (
          <div className="space-y-6">
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-5">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Webhook className="w-5 h-5 text-primary" /> Webhook Event Sync
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Receive live WhatsApp events in your external server or CRM.
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Global Webhook Endpoint</label>
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Subscribed Events</h4>
                {Object.entries(events).map(([evt, isChecked]) => (
                  <label key={evt} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => setEvents(prev => ({ ...prev, [evt]: !prev[evt as keyof typeof events] }))}
                      className="w-4 h-4 rounded text-primary focus:ring-primary"
                    />
                    <span className="text-xs font-mono font-semibold">{evt}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: General Anti-Ban Controls */}
        {activeTab === "general" && (
          <div className="space-y-6">
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-5">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-green-500" /> Global Anti-Ban Safety Thresholds
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Default safety limits applied across all WhatsApp broadcast campaigns.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
                  <span className="text-xs font-semibold block">Max Messages Per Hour</span>
                  <input
                    type="number"
                    defaultValue={150}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono"
                  />
                  <span className="text-[11px] text-muted-foreground">Limits hourly dispatch rate to prevent flags.</span>
                </div>

                <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
                  <span className="text-xs font-semibold block">Default Message Interval</span>
                  <input
                    type="number"
                    defaultValue={8}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono"
                  />
                  <span className="text-[11px] text-muted-foreground">Default sleep interval in seconds.</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
