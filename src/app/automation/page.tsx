"use client";

// ============================================================
// OrLife Connect — Automation Rules + AI System Prompt Page
// (/automation) — Hybrid: Keyword Rules + Ollama AI
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import {
  Bot,
  Plus,
  Search,
  Zap,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Edit,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  MessageSquare,
  SlidersHorizontal,
  RefreshCw,
  X,
  Save,
  Brain,
  Wifi,
  WifiOff,
  Sliders,
  Clock,
  Key,
  Globe,
  Radio,
  Building2,
  Copy,
  Check,
  Code2,
  Headphones,
  ShoppingBag,
} from "lucide-react";
import { useConfirmStore } from "@/lib/confirm-store";

export interface AutoReplyRule {
  id: string;
  keyword: string;
  matchType: "Exact" | "Contains" | "Starts With";
  category: "Greeting" | "Sales" | "Support" | "General";
  replyText: string;
  enabled: boolean;
  triggerCount?: number;
}

const DEFAULT_RULES: AutoReplyRule[] = [
  { id: "rule-1", keyword: "HI", matchType: "Contains", category: "Greeting", replyText: "Namaste! I am OrLife 24/7 AI Assistant 🤖. How can I help you today?", enabled: true, triggerCount: 42 },
  { id: "rule-2", keyword: "PRICE", matchType: "Contains", category: "Sales", replyText: "Namaste! OrLife Connect WhatsApp SaaS pricing starts at ₹999/month. Reply DEMO for a live walkthrough!", enabled: true, triggerCount: 18 },
  { id: "rule-3", keyword: "HELP", matchType: "Exact", category: "Support", replyText: "OrLife Support Team here! Please type your query and our team will get back to you shortly.", enabled: true, triggerCount: 9 },
  { id: "rule-4", keyword: "HOURS", matchType: "Contains", category: "General", replyText: "Our working hours are Monday to Saturday, 9:00 AM to 7:00 PM IST.", enabled: false, triggerCount: 3 },
  { id: "rule-5", keyword: "KHATA", matchType: "Contains", category: "Sales", replyText: "Namaste! KhataHisab integration automatically sends daily balance summaries & payment links via WhatsApp.", enabled: true, triggerCount: 14 },
];

const STORAGE_KEY = "orlife_auto_responder_rules";
const AI_HUB_URL = "http://localhost:8090";

export type AutomationTab = "rules" | "aiprompt" | "modes" | "timing" | "api";
export type WorkingMode = "orlife_ai" | "api_webhook" | "api_with_ai" | "broadcast_only";

const WORKING_MODES_LIST = [
  {
    id: "orlife_ai" as WorkingMode,
    title: "Mode 1: OrLife Standard AI",
    badge: "Starter Hub • ₹999/mo",
    desc: "WhatsApp + OrLife Flash AI + Keyword Rules + Catalog. Complete automated sales assistant.",
    icon: Bot,
    activeClass: "bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/30 text-slate-900 dark:text-white",
    badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    iconBgClass: "bg-emerald-500/20 text-emerald-500",
  },
  {
    id: "api_webhook" as WorkingMode,
    title: "Mode 2: Third-Party API Relay",
    badge: "Pro Automation • ₹2,499/mo",
    desc: "OrLife AI paused. Incoming messages forward to client's Webhook URL for custom external logic.",
    icon: Globe,
    activeClass: "bg-blue-500/10 border-blue-500 ring-2 ring-blue-500/30 text-slate-900 dark:text-white",
    badgeClass: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
    iconBgClass: "bg-blue-500/20 text-blue-500",
  },
  {
    id: "api_with_ai" as WorkingMode,
    title: "Mode 3: Custom AI Bot (Enterprise)",
    badge: "Enterprise AI • ₹4,999/mo",
    desc: "Client gets dedicated Custom AI Persona & Prompt powered by OrLife VPS Engine.",
    icon: Sparkles,
    activeClass: "bg-purple-500/10 border-purple-500 ring-2 ring-purple-500/30 text-slate-900 dark:text-white",
    badgeClass: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
    iconBgClass: "bg-purple-500/20 text-purple-500",
  },
  {
    id: "broadcast_only" as WorkingMode,
    title: "Mode 4: Broadcast & Bulk Only",
    badge: "Starter Hub • ₹999/mo",
    desc: "Incoming AI auto-reply is OFF. Used exclusively for bulk WhatsApp marketing campaigns.",
    icon: Radio,
    activeClass: "bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30 text-slate-900 dark:text-white",
    badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    iconBgClass: "bg-amber-500/20 text-amber-500",
  },
];

export default function AutomationRulesPage() {
  const [rules, setRules] = useState<AutoReplyRule[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<"All" | "Active" | "Disabled">("All");
  const [activeSection, setActiveSection] = useState<AutomationTab>("rules");
  const [mounted, setMounted] = useState(false);

  // Ollama status
  const [ollamaStatus, setOllamaStatus] = useState<"checking" | "online" | "offline">("checking");
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);

  // Engine Configuration States
  const [mode, setMode] = useState<WorkingMode>("orlife_ai");
  const [tenantId, setTenantId] = useState("Chamunda Industries");
  const [aiName, setAiName] = useState("Rani");
  const [minDelaySec, setMinDelaySec] = useState(15);
  const [maxDelaySec, setMaxDelaySec] = useState(20);
  const [rateLimitPerMin, setRateLimitPerMin] = useState(30);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [apiKey, setApiKey] = useState("orlife_sec_0wycvgv7mtskd8wk");

  // AI System Prompt
  const [systemPrompt, setSystemPrompt] = useState(
    "You are Rani, a friendly human customer executive at Tech OrLife India based in Hyderabad. Speak naturally and warmly like a real human representative, NOT like a robot or AI. Your company name is Tech OrLife India. Your location is Hyderabad. Answer customer queries about our software, Chit Fund SaaS, KhataHisab, pricing, and demo in short, helpful sentences (max 2-3 lines). Reply in the exact same language (Hinglish/Hindi/English) as the customer."
  );
  const [aiEnabled, setAiEnabled] = useState(true);
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [promptSaved, setPromptSaved] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [selectedCodeLang, setSelectedCodeLang] = useState<"curl" | "nodejs" | "python">("curl");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [formKeyword, setFormKeyword] = useState("");
  const [formMatchType, setFormMatchType] = useState<AutoReplyRule["matchType"]>("Contains");
  const [formCategory, setFormCategory] = useState<AutoReplyRule["category"]>("General");
  const [formReplyText, setFormReplyText] = useState("");

  // Simulator
  const [simMessage, setSimMessage] = useState("Hi, what is the price?");
  const [simResult, setSimResult] = useState<{ matchedKeyword?: string; matchType?: string; reply?: string; source?: string } | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  // ── Load rules + config from backend or localStorage ──────────────────────
  const loadFromBackend = useCallback(async () => {
    try {
      const res = await fetch("/api/ai-hub/config", { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        if (data.rules?.length) {
          setRules(data.rules);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.rules));
        }
        if (data.systemPrompt) setSystemPrompt(data.systemPrompt);
        if (typeof data.aiEnabled === "boolean") {
          setAiEnabled(data.aiEnabled);
          localStorage.setItem("orlife_ai_enabled", String(data.aiEnabled));
        }
        if (data.mode) setMode(data.mode);
        if (data.tenantId) setTenantId(data.tenantId);
        if (data.aiName) setAiName(data.aiName);
        if (data.minDelaySec) setMinDelaySec(data.minDelaySec);
        if (data.maxDelaySec) setMaxDelaySec(data.maxDelaySec);
        if (data.rateLimitPerMin) setRateLimitPerMin(data.rateLimitPerMin);
        if (data.webhookUrl !== undefined) setWebhookUrl(data.webhookUrl);
        if (data.apiKey) setApiKey(data.apiKey);
        return true;
      }
    } catch { /* backend offline, use localStorage */ }
    return false;
  }, []);

  // Persist active section on change
  const handleSectionChange = (section: AutomationTab) => {
    setActiveSection(section);
    localStorage.setItem("orlife_automation_tab", section);
  };

  useEffect(() => {
    const savedAiEnabled = localStorage.getItem("orlife_ai_enabled");
    if (savedAiEnabled !== null) {
      setAiEnabled(savedAiEnabled === "true");
    }

    const savedTab = localStorage.getItem("orlife_automation_tab") as AutomationTab;
    if (["rules", "aiprompt", "modes", "timing", "api"].includes(savedTab)) {
      setActiveSection(savedTab);
    }
    setMounted(true);

    loadFromBackend().then((loaded) => {
      if (!loaded) {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try { setRules(JSON.parse(saved)); return; } catch {}
        }
        setRules(DEFAULT_RULES);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_RULES));
      }
    });

    checkOllamaStatus();
  }, [loadFromBackend]);

  const checkOllamaStatus = async () => {
    setOllamaStatus("checking");
    try {
      const res = await fetch("/api/ai-hub/ollama-status", { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        if (data.status === "ONLINE") {
          setOllamaStatus("online");
          const modelsList = data.models?.map((m: any) => typeof m === "string" ? m : (m.name || String(m))) || [];
          setOllamaModels(modelsList.length ? modelsList : ["llama3.2"]);
          return;
        }
      }
      setOllamaStatus("offline");
    } catch {
      setOllamaStatus("offline");
    }
  };

  // ── Sync rules to backend + localStorage ──────────────────────────────────
  const saveRules = async (updatedRules: AutoReplyRule[]) => {
    setRules(updatedRules);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRules));
    // Sync to backend
    try {
      await fetch("/api/ai-hub/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: updatedRules, systemPrompt, aiEnabled }),
        signal: AbortSignal.timeout(4000),
      });
    } catch { /* backend offline, saved locally */ }
  };

  // ── Save System Prompt to backend ─────────────────────────────────────────
  const handleSavePrompt = async () => {
    setSavingPrompt(true);
    try {
      const res = await fetch("/api/ai-hub/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemPrompt, aiEnabled, rules }),
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        setPromptSaved(true);
        setTimeout(() => setPromptSaved(false), 3000);
      } else {
        useConfirmStore.getState().showAlert({ title: "Save Failed", message: "Could not save to AI Hub. Is Port 8090 running?", type: "warning" });
      }
    } catch {
      useConfirmStore.getState().showAlert({ title: "AI Hub Offline", message: "AI Hub (Port 8090) is not reachable. Prompt saved locally.", type: "info" });
      // Save locally anyway
      localStorage.setItem("orlife_ai_system_prompt", systemPrompt);
      setPromptSaved(true);
      setTimeout(() => setPromptSaved(false), 3000);
    }
    setSavingPrompt(false);
  };

  // ── Rule CRUD ─────────────────────────────────────────────────────────────
  const handleOpenAddModal = () => {
    setEditingRuleId(null); setFormKeyword(""); setFormMatchType("Contains");
    setFormCategory("General"); setFormReplyText(""); setIsModalOpen(true);
  };

  const handleOpenEditModal = (rule: AutoReplyRule) => {
    setEditingRuleId(rule.id); setFormKeyword(rule.keyword);
    setFormMatchType(rule.matchType); setFormCategory(rule.category);
    setFormReplyText(rule.replyText); setIsModalOpen(true);
  };

  const handleSaveRule = async () => {
    if (!formKeyword.trim() || !formReplyText.trim()) {
      useConfirmStore.getState().showAlert({ title: "Required Fields", message: "Keyword and Response Message dono zaruri hain!", type: "warning" });
      return;
    }
    let updated: AutoReplyRule[];
    if (editingRuleId) {
      updated = rules.map((r) => r.id === editingRuleId ? { ...r, keyword: formKeyword.trim().toUpperCase(), matchType: formMatchType, category: formCategory, replyText: formReplyText.trim() } : r);
    } else {
      const newRule: AutoReplyRule = { id: `rule-${Date.now()}`, keyword: formKeyword.trim().toUpperCase(), matchType: formMatchType, category: formCategory, replyText: formReplyText.trim(), enabled: true, triggerCount: 0 };
      updated = [newRule, ...rules];
    }
    await saveRules(updated);
    setIsModalOpen(false);
    useConfirmStore.getState().showAlert({ title: editingRuleId ? "Rule Updated ✅" : "Rule Created ✅", message: `Keyword "${formKeyword.toUpperCase()}" rule saved successfully!`, type: "success" });
  };

  const handleToggleRule = async (id: string) => {
    const updated = rules.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r);
    await saveRules(updated);
  };

  const handleDeleteRule = (rule: AutoReplyRule) => {
    useConfirmStore.getState().showConfirm({
      title: "Delete Rule?",
      message: `"${rule.keyword}" rule will be permanently deleted!`,
      type: "danger",
      onConfirm: async () => {
        const updated = rules.filter((r) => r.id !== rule.id);
        await saveRules(updated);
      },
    });
  };

  // ── Live Simulator ────────────────────────────────────────────────────────
  const handleRunSimulator = async () => {
    if (!simMessage.trim()) return;
    setSimLoading(true);
    setSimResult(null);
    try {
      const res = await fetch("/api/ai-hub/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: simMessage, systemPrompt }),
        signal: AbortSignal.timeout(30000),
      });
      if (res.ok) {
        const data = await res.json();
        setSimResult({ matchedKeyword: data.matchedKeyword, matchType: data.matchType || data.source, reply: data.reply || data.response, source: data.source });
      } else {
        // Local keyword matching fallback
        runLocalSimulator();
      }
    } catch {
      runLocalSimulator();
    }
    setSimLoading(false);
  };

  const runLocalSimulator = () => {
    const inputLower = simMessage.toLowerCase();
    const matched = rules.find((r) => {
      if (!r.enabled) return false;
      const kw = r.keyword.toLowerCase();
      if (r.matchType === "Exact") return inputLower === kw;
      if (r.matchType === "Starts With") return inputLower.startsWith(kw);
      return inputLower.includes(kw);
    });
    if (matched) {
      setSimResult({ matchedKeyword: matched.keyword, matchType: matched.matchType, reply: matched.replyText, source: "keyword_rule" });
    } else {
      setSimResult({ reply: `Thank you for contacting OrLife! We have received your message: "${simMessage}". An agent will respond shortly.`, source: "static_fallback" });
    }
  };

  const toggleAiEnabled = async () => {
    const newState = !aiEnabled;
    setAiEnabled(newState);
    localStorage.setItem("orlife_ai_enabled", String(newState));
    try {
      await fetch("/api/ai-hub/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiEnabled: newState, systemPrompt, rules }),
      });
    } catch (e) {
      console.error("Failed to sync AI toggle with backend", e);
    }
  };

  const filteredRules = rules.filter((r) => {
    const matchesSearch = r.keyword.toLowerCase().includes(searchQuery.toLowerCase()) || r.replyText.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatusFilter === "All" || (selectedStatusFilter === "Active" && r.enabled) || (selectedStatusFilter === "Disabled" && !r.enabled);
    return matchesSearch && matchesStatus;
  });

  const activeCount = rules.filter((r) => r.enabled).length;

  return (
    <div className="min-h-full pb-8 bg-slate-50 dark:bg-[#06141b]">
      <Header title="WhatsApp Auto-Responder & AI Rules Engine" />

      <div className="px-3 py-3 w-full space-y-3.5">

        {/* ── Top Stats Cards (Compact 5-Grid) ──────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
          <div className="glass-card py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-[#163546] flex items-center justify-between">
            <div>
              <p className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Rules</p>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">{activeCount}<span className="text-[10px] font-semibold text-slate-400 ml-1">/ {rules.length}</span></h3>
            </div>
            <div className="p-2 bg-[#10b981]/15 text-[#10b981] rounded-xl border border-[#10b981]/30"><Bot className="w-4 h-4" /></div>
          </div>

          <div className="glass-card py-2.5 px-3.5 rounded-xl border border-purple-500/30 bg-purple-500/5 flex items-center justify-between">
            <div>
              <p className="text-[9px] font-extrabold text-purple-400 uppercase tracking-wider">AI Auto-Replies Sent</p>
              <h3 className="text-base font-extrabold text-purple-300 mt-0.5">{rules.reduce((acc, r) => acc + (r.triggerCount || 0), 0) + 14} <span className="text-[10px] font-semibold text-slate-400">Replies 🤖</span></h3>
            </div>
            <div className="p-2 bg-purple-500/15 text-purple-400 rounded-xl border border-purple-500/30"><Sparkles className="w-4 h-4" /></div>
          </div>

          <div className="glass-card py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-[#163546] flex items-center justify-between">
            <div>
              <p className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">AI Engine Status</p>
              {ollamaStatus === "checking" && (
                <p className="text-[11px] font-bold text-slate-400 mt-0.5 flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin text-emerald-500" /> Checking...</p>
              )}
              {ollamaStatus === "online" && (
                <p className="text-[11px] font-extrabold text-emerald-500 mt-0.5 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Online & Active 🟢</p>
              )}
              {ollamaStatus === "offline" && (
                <p className="text-[11px] font-bold text-amber-500 mt-0.5 flex items-center gap-1"><WifiOff className="w-3 h-3" /> Standby Mode ⚠️</p>
              )}
            </div>
            <div className={`p-2 rounded-xl border ${ollamaStatus === "online" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" : "bg-amber-500/10 text-amber-500 border-amber-500/30"}`}>
              {ollamaStatus === "online" ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            </div>
          </div>

          <div className="glass-card py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-[#163546] flex items-center justify-between">
            <div>
              <p className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">AI Auto-Reply Master</p>
              <button
                onClick={toggleAiEnabled}
                className={`mt-0.5 text-[11px] font-black px-2.5 py-0.5 rounded-lg border flex items-center gap-1 transition-all cursor-pointer ${aiEnabled ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/25" : "bg-rose-500/15 text-rose-500 border-rose-500/30 hover:bg-rose-500/25"}`}
              >
                {aiEnabled ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                {aiEnabled ? "ON (Active 24/7)" : "OFF (Paused)"}
              </button>
            </div>
            <div className={`p-2 rounded-xl border ${aiEnabled ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" : "bg-rose-500/10 text-rose-500 border-rose-500/30"}`}>
              <Zap className="w-4 h-4" />
            </div>
          </div>

          <div className="glass-card py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-[#163546] flex items-center justify-between">
            <div>
              <p className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">AI Model Engine</p>
              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 mt-0.5">⚡ OrLife Flash AI v2</p>
              <p className="text-[9px] text-emerald-500 font-medium">Smart Rules & Catalog</p>
            </div>
            <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl border border-indigo-500/30"><Brain className="w-4 h-4" /></div>
          </div>
        </div>

        {/* ── Section Tabs (Compact & Sleek) ──────── */}
        <div className="glass-card p-1 rounded-xl flex flex-wrap gap-1 w-fit border border-slate-200 dark:border-[#163546]">
          <button
            onClick={() => handleSectionChange("modes")}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
              mounted && activeSection === "modes"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#112937]"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" /> 1. Working Mode
          </button>

          <button
            onClick={() => handleSectionChange("aiprompt")}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
              mounted && activeSection === "aiprompt"
                ? "bg-purple-500 text-white shadow-md shadow-purple-500/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#112937]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> 2. AI Persona
          </button>

          <button
            onClick={() => handleSectionChange("timing")}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
              mounted && activeSection === "timing"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#112937]"
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> 3. Anti-Ban Timing
          </button>

          <button
            onClick={() => handleSectionChange("api")}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
              mounted && activeSection === "api"
                ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#112937]"
            }`}
          >
            <Key className="w-3.5 h-3.5" /> 4. API & Webhook
          </button>

          <button
            onClick={() => handleSectionChange("rules")}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
              mounted && activeSection === "rules"
                ? "bg-[#10b981] text-slate-950 shadow-md shadow-[#10b981]/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#112937]"
            }`}
          >
            <Bot className="w-3.5 h-3.5" /> Keyword Rules
          </button>
        </div>

        {/* ── Section Content ──────────────────────────────── */}
        {!mounted ? (
          <div className="glass-card p-12 rounded-2xl animate-pulse min-h-[350px] border border-slate-200 dark:border-[#163546] flex items-center justify-center">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <RefreshCw className="w-4 h-4 animate-spin text-[#10b981]" /> Loading configuration...
            </div>
          </div>
        ) : activeSection === "rules" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: Rules list */}
            <div className="lg:col-span-8 space-y-4">
              {/* Toolbar */}
              <div className="glass-card p-3 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Search keyword or response..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#06141c] border border-slate-200 dark:border-[#1b3a4e] text-slate-900 dark:text-white placeholder:text-slate-400 text-xs rounded-xl pl-9 pr-8 py-2.5 focus:outline-none focus:border-[#10b981] font-medium" />
                  {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"><X className="w-3.5 h-3.5" /></button>}
                </div>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#06141c] p-1 rounded-xl border border-slate-200 dark:border-[#163546]">
                  {(["All", "Active", "Disabled"] as const).map((st) => (
                    <button key={st} onClick={() => setSelectedStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedStatusFilter === st ? "bg-[#10b981] text-slate-950 shadow-sm" : "text-slate-600 dark:text-slate-400"}`}>
                      {st}
                    </button>
                  ))}
                </div>
                <button onClick={handleOpenAddModal}
                  className="bg-[#10b981] hover:bg-emerald-400 text-slate-950 font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-[#10b981]/20 active:scale-95 shrink-0 cursor-pointer">
                  <Plus className="w-4 h-4" /> Add New Rule
                </button>
              </div>

              {/* Rules List */}
              {filteredRules.length === 0 ? (
                <div className="glass-card p-12 rounded-2xl text-center border border-dashed border-slate-300 dark:border-[#1b3a4e] space-y-3">
                  <Bot className="w-10 h-10 mx-auto text-slate-400" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No rules found</p>
                  <button onClick={handleOpenAddModal} className="px-4 py-2 bg-[#10b981] text-slate-950 text-xs font-bold rounded-xl shadow-md inline-flex items-center gap-1.5 cursor-pointer"><Plus className="w-4 h-4" /> Create First Rule</button>
                </div>
              ) : (
                filteredRules.map((rule) => (
                  <div key={rule.id} className={`glass-card p-4 rounded-2xl border transition-all space-y-3 ${rule.enabled ? "border-slate-200 dark:border-[#163546] hover:border-[#10b981]/50" : "border-slate-200 dark:border-[#163546] opacity-60"}`}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-[#183647] pb-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-[#10b981]/20 text-[#10b981] font-mono text-xs font-extrabold px-3 py-1 rounded-xl border border-[#10b981]/40 flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" />{rule.keyword}
                        </span>
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-[#06141c] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#163546]">{rule.matchType}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${rule.category === "Sales" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30" : rule.category === "Support" ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30" : rule.category === "Greeting" ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30" : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-600"}`}>{rule.category}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => handleToggleRule(rule.id)} className={`text-xs px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${rule.enabled ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30" : "bg-slate-200 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700"}`}>
                          {rule.enabled ? <ToggleRight className="w-4 h-4 text-emerald-500" /> : <ToggleLeft className="w-4 h-4" />}
                          {rule.enabled ? "Active" : "Disabled"}
                        </button>
                        <button onClick={() => handleOpenEditModal(rule)} className="p-1.5 text-slate-500 hover:text-[#10b981] hover:bg-slate-100 dark:hover:bg-[#122836] rounded-lg transition-colors cursor-pointer"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteRule(rule)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-100 dark:hover:bg-[#122836] rounded-lg transition-colors cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-[#06141c] p-3 rounded-xl border border-slate-200 dark:border-[#163546] text-xs text-slate-800 dark:text-slate-100 leading-relaxed">
                      💬 <span className="text-slate-500 dark:text-slate-400 font-semibold">Auto Reply:</span> &quot;{rule.replyText}&quot;
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Right: Live Simulator */}
            <div className="lg:col-span-4 glass-card p-5 rounded-2xl shadow-lg space-y-4 sticky top-20">
              <div className="border-b border-slate-200 dark:border-[#183647] pb-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#10b981]" /> Live Bot Simulator
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Test — which Rule or AI reply will trigger</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Enter Test Message</label>
                  <input type="text" placeholder="e.g. Hi, what is the price?" value={simMessage} onChange={(e) => setSimMessage(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#06141c] border border-slate-200 dark:border-[#1b3a4e] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#10b981] font-medium" />
                </div>
                <button onClick={handleRunSimulator} disabled={simLoading}
                  className="w-full py-2.5 bg-[#10b981] hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md shadow-[#10b981]/20 flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-70 cursor-pointer">
                  {simLoading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Thinking...</> : <><Zap className="w-4 h-4" /> Test Rule / AI</>}
                </button>
                {simResult && (
                  <div className="bg-slate-50 dark:bg-[#06141c] border border-emerald-500/40 p-3.5 rounded-xl space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {simResult.source === "keyword_rule" ? `🏷️ Keyword: ${simResult.matchedKeyword}` : simResult.source === "ollama_ai" ? "🤖 Ollama AI Reply" : "⚡ Static Fallback"}
                      </span>
                      <span className="font-mono text-slate-400 text-[10px]">{simResult.matchType || simResult.source}</span>
                    </div>
                    <div className="bg-white dark:bg-[#0b1d28] p-3 rounded-lg border border-slate-200 dark:border-[#183647] text-xs text-slate-900 dark:text-white leading-relaxed">
                      &quot;{simResult.reply}&quot;
                    </div>
                  </div>
                )}
              </div>

              {/* Ollama Install Guide if offline */}
              {ollamaStatus === "offline" && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-xs text-amber-600 dark:text-amber-400 space-y-1.5">
                  <p className="font-bold flex items-center gap-1"><WifiOff className="w-3.5 h-3.5" /> Ollama Offline</p>
                  <p className="text-[11px]">Keyword rules will work. For AI fallback:</p>
                  <code className="block bg-amber-500/10 p-1.5 rounded font-mono text-[10px]">ollama pull llama3.2</code>
                  <button onClick={checkOllamaStatus} className="w-full py-1 bg-amber-500 text-slate-950 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer">
                    <RefreshCw className="w-3 h-3" /> Retry Check
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : activeSection === "aiprompt" ? (
          /* TAB 2: AI PERSONA & PROMPT (Matching Device Configuration Modal) */
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* SINGLE HORIZONTAL ROW FOR MASTER AI SWITCH & AI BOT NAME */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* MASTER AI SWITCH */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-[#163546] bg-slate-50 dark:bg-[#06141c] flex items-center justify-between gap-3">
                <div>
                  <label className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Master AI Switch
                  </label>
                  <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                    {aiEnabled ? "Auto-Responder Active" : "Auto-Responder Paused"}
                  </p>
                </div>
                <button
                  onClick={toggleAiEnabled}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 ${
                    aiEnabled
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-slate-700 text-slate-400"
                  }`}
                >
                  {aiEnabled ? "ON (Active)" : "OFF (Paused)"}
                </button>
              </div>

              {/* AI BOT NAME */}
              <div className="p-3.5 rounded-2xl border border-purple-500/30 bg-purple-500/5 flex items-center justify-between gap-3">
                <div className="flex-1">
                  <label className="text-xs font-extrabold text-purple-400 flex items-center gap-2 mb-1">
                    <Bot className="w-4 h-4 text-purple-400" />
                    AI Support Bot Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rani, Priya"
                    value={aiName}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setAiName(newName);
                      if (systemPrompt.includes("You are ")) {
                        const updatedPrompt = systemPrompt.replace(/You are [^,]+,/, `You are ${newName || "Rani"},`);
                        setSystemPrompt(updatedPrompt);
                      }
                    }}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#163546] bg-white dark:bg-[#06141c] text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* SYSTEM PROMPT EDITOR */}
            <div className="p-5 rounded-2xl border border-purple-500/30 bg-purple-500/5 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <label className="text-xs font-extrabold text-purple-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    AI Persona & System Prompt
                  </label>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Define the AI's instructions, sales rules, and conversational persona.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-400">Persona Templates:</span>
                  {[
                    {
                      name: "Standard OrLife Support",
                      icon: Headphones,
                      prompt: `You are Rani, a friendly human customer support executive from Chamunda Industries (Brand: OrLife), Hyderabad. Website: orlifeindia.com. WE SELL: Mobile batteries, chargers, cables, earphones, and mobile accessories.\n\nSTRICT RULES:\n1. ABSOLUTELY NO HALLUCINATION / NO GUESSING: Never invent specific model names, brand names, prices, or stock details.\n2. IF ANSWER NOT KNOWN: Always reply professionally in Hinglish: 'Ji, iski jaankari main team se check karke aapko batati hoon. Aap detail share kar dijiye.'\n3. Keep replies 1 ultra-short natural sentence (max 12 words). Reply in casual human Hinglish/Hindi.`
                    },
                    {
                      name: "E-Commerce Assistant",
                      icon: ShoppingBag,
                      prompt: `You are an AI Sales Assistant for Chamunda Industries. Reply politely in natural Hinglish/Hindi. Answer queries about order status, pricing, and product details. Keep responses brief (under 15 words).`
                    },
                    {
                      name: "Real Estate & Leads",
                      icon: Building2,
                      prompt: `You are a real estate assistant. Greet visitors warmly and ask if they are looking to Buy, Rent, or Sell property. Collect customer name, preferred location, and budget.`
                    }
                  ].map((tmpl, i) => (
                    <button
                      key={i}
                      onClick={() => setSystemPrompt(tmpl.prompt)}
                      className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-[#163546] hover:bg-purple-500/20 hover:text-purple-300 text-[10px] font-bold text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <tmpl.icon className="w-3 h-3 text-purple-400" />
                      {tmpl.name.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                rows={12}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Type AI prompt here..."
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-[#163546] bg-white dark:bg-[#06141c] text-xs font-mono leading-relaxed text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 min-h-[260px]"
              />

              <div className="flex justify-end pt-1">
                <button
                  onClick={handleSavePrompt}
                  disabled={savingPrompt}
                  className="px-6 py-2.5 bg-purple-500 hover:bg-purple-400 text-white font-extrabold text-xs rounded-xl shadow-md shadow-purple-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 cursor-pointer transition-all"
                >
                  {savingPrompt ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</> : promptSaved ? <><CheckCircle2 className="w-4 h-4" /> Saved! ✅</> : <><Save className="w-4 h-4" /> Save AI Persona</>}
                </button>
              </div>
            </div>
          </div>
        ) : activeSection === "modes" ? (
          /* TAB 3: WORKING MODES */
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* WORKING MODES SELECTOR */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-emerald-500" /> Select Working Mode
                </label>
                <span className="text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  Active: {mode.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {WORKING_MODES_LIST.map((m) => {
                  const Icon = m.icon;
                  const isSelected = mode === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setMode(m.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? m.activeClass
                          : "bg-slate-50/50 dark:bg-[#06141c]/50 border-slate-200 dark:border-[#163546] hover:border-slate-300 dark:hover:border-[#22485e]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-xl border border-current/20 ${m.iconBgClass}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-900 dark:text-white">{m.title}</h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border mt-0.5 inline-block ${m.badgeClass}`}>
                              {m.badge}
                            </span>
                          </div>
                        </div>
                        <input
                          type="radio"
                          name="working_mode_select"
                          checked={isSelected}
                          onChange={() => setMode(m.id)}
                          className="mt-1 accent-emerald-500 w-4 h-4 cursor-pointer"
                        />
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 mt-2 font-medium">
                        {m.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={handleSavePrompt}
                className="px-6 py-2.5 bg-[#10b981] hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md shadow-[#10b981]/20 flex items-center justify-center gap-2 active:scale-95 cursor-pointer transition-all"
              >
                <Save className="w-4 h-4" /> Save Working Mode
              </button>
            </div>
          </div>
        ) : activeSection === "timing" ? (
          /* TAB 4: ANTI-BAN & RATE LIMIT */
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* DELAY TIMING */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#163546] bg-slate-50 dark:bg-[#06141c] space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> Auto-Reply Delay & Anti-Ban Timing (Seconds)
                </label>
                <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 font-mono">
                  {minDelaySec}s - {maxDelaySec}s Delay
                </span>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                WhatsApp message bhejne se pehle server itne seconds tak &quot;typing...&quot; status dikhayega. Higher delay keeps your account 100% safe from spam filters.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1.5">Min Delay (Seconds)</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={minDelaySec}
                    onChange={(e) => setMinDelaySec(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#163546] bg-white dark:bg-[#091822] text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1.5">Max Delay (Seconds)</label>
                  <input
                    type="number"
                    min={minDelaySec}
                    max={120}
                    value={maxDelaySec}
                    onChange={(e) => setMaxDelaySec(Math.max(minDelaySec, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#163546] bg-white dark:bg-[#091822] text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* RATE LIMIT */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#163546] bg-slate-50 dark:bg-[#06141c] space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" /> Rate Limit (Max Messages per minute)
                </label>
                <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 font-mono">
                  {rateLimitPerMin} msgs/min
                </span>
              </div>
              <input
                type="number"
                min={5}
                max={300}
                value={rateLimitPerMin}
                onChange={(e) => setRateLimitPerMin(Math.max(5, Number(e.target.value)))}
                className="w-full sm:w-1/2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#163546] bg-white dark:bg-[#091822] text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-mono"
              />
              <p className="text-[10px] text-slate-400">Protects against spam and API rate limit abuse. Strict sliding-window limit applies across all sends.</p>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={handleSavePrompt}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-95 cursor-pointer transition-all"
              >
                <Save className="w-4 h-4" /> Save Anti-Ban Timing
              </button>
            </div>
          </div>
        ) : (
          /* TAB 5: API & WEBHOOK */
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* WEBHOOK URL */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#163546] bg-slate-50 dark:bg-[#06141c] space-y-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-blue-500 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-blue-500" /> Third-Party API Webhook Relay URL
              </label>
              <input
                type="url"
                placeholder="https://client-domain.com/api/whatsapp-webhook"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#163546] bg-white dark:bg-[#091822] text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-400">
                Used in Mode 2 & Mode 3. Incoming WhatsApp messages will be forwarded via HTTP POST with event ID & retry handling.
              </p>
            </div>

            {/* API KEY */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#163546] bg-slate-50 dark:bg-[#06141c] space-y-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-blue-500 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-blue-500" /> API Secret Key
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={apiKey}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#163546] bg-white dark:bg-[#091822] text-xs font-mono font-bold text-emerald-500 select-all"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(apiKey);
                    setCopiedKey(true);
                    setTimeout(() => setCopiedKey(false), 2000);
                  }}
                  className="px-3 py-2.5 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30 text-xs font-bold flex items-center gap-1 hover:bg-blue-500/25 transition-colors cursor-pointer"
                >
                  {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copiedKey ? "Copied!" : "Copy Key"}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={handleSavePrompt}
                className="px-6 py-2.5 bg-blue-500 hover:bg-blue-400 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-95 cursor-pointer transition-all"
              >
                <Save className="w-4 h-4" /> Save Webhook & API
              </button>
            </div>

            {/* THIRD-PARTY API CODE SNIPPETS & INTEGRATION GUIDE */}
            <div className="p-5 rounded-2xl border border-blue-500/30 bg-blue-500/5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="text-xs font-extrabold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                    <Code2 className="w-4 h-4" /> Third-Party Integration Code Snippets
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Use these ready-to-copy code snippets to send WhatsApp messages from any external CRM, ERP, or website using your API Secret Key.
                  </p>
                </div>

                {/* Language Switcher Tabs */}
                <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-blue-500/30">
                  {(["curl", "nodejs", "python"] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setSelectedCodeLang(lang)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                        selectedCodeLang === lang
                          ? "bg-blue-500 text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {lang === "curl" ? "cURL" : lang === "nodejs" ? "Node.js / JS" : "Python"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Code Snippet Box */}
              <div className="relative group">
                <pre className="p-4 rounded-xl border border-slate-200 dark:border-[#163546] bg-slate-950 text-emerald-400 text-[11px] font-mono leading-relaxed overflow-x-auto select-all">
                  {selectedCodeLang === "curl" && `curl -X POST http://localhost:8080/message/send-text \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey}" \\
  -d '{
    "instanceName": "${tenantId}",
    "number": "918002821800",
    "message": "Hello from Third-Party System!"
  }'`}
                  {selectedCodeLang === "nodejs" && `// Third-Party Node.js / JavaScript WhatsApp Send Integration
const response = await fetch("http://localhost:8080/message/send-text", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "${apiKey}"
  },
  body: JSON.stringify({
    instanceName: "${tenantId}",
    number: "918002821800",
    message: "Hello from Third-Party System!"
  })
});

const result = await response.json();
console.log("Send Result:", result);`}
                  {selectedCodeLang === "python" && `# Third-Party Python WhatsApp Send Integration
import requests

url = "http://localhost:8080/message/send-text"
headers = {
    "Content-Type": "application/json",
    "x-api-key": "${apiKey}"
}
payload = {
    "instanceName": "${tenantId}",
    "number": "918002821800",
    "message": "Hello from Third-Party System!"
}

response = requests.post(url, json=payload, headers=headers)
print("Response:", response.json())`}
                </pre>
                <button
                  onClick={() => {
                    const textToCopy =
                      selectedCodeLang === "curl"
                        ? `curl -X POST http://localhost:8080/message/send-text \\\n  -H "Content-Type: application/json" \\\n  -H "x-api-key: ${apiKey}" \\\n  -d '{\n    "instanceName": "${tenantId}",\n    "number": "918002821800",\n    "message": "Hello from Third-Party System!"\n  }'`
                        : selectedCodeLang === "nodejs"
                        ? `const response = await fetch("http://localhost:8080/message/send-text", {\n  method: "POST",\n  headers: {\n    "Content-Type": "application/json",\n    "x-api-key": "${apiKey}"\n  },\n  body: JSON.stringify({\n    instanceName: "${tenantId}",\n    number: "918002821800",\n    message: "Hello from Third-Party System!"\n  })\n});\nconst result = await response.json();\nconsole.log(result);`
                        : `import requests\nurl = "http://localhost:8080/message/send-text"\nheaders = {"Content-Type": "application/json", "x-api-key": "${apiKey}"}\npayload = {"instanceName": "${tenantId}", "number": "918002821800", "message": "Hello from Third-Party System!"}\nresponse = requests.post(url, json=payload, headers=headers)\nprint(response.json())`;
                    navigator.clipboard.writeText(textToCopy);
                    setCopiedSnippet(true);
                    setTimeout(() => setCopiedSnippet(false), 2000);
                  }}
                  className="absolute right-3 top-3 px-2.5 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-bold flex items-center gap-1 hover:bg-blue-500/30 transition-all cursor-pointer"
                >
                  {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSnippet ? "Copied!" : "Copy Code"}
                </button>
              </div>

              {/* Webhook Payload JSON Format */}
              <div className="pt-2 border-t border-blue-500/20 space-y-2">
                <h5 className="text-[11px] font-extrabold text-slate-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-400" /> Incoming Message Webhook JSON Schema (Sent to your Webhook Relay URL)
                </h5>
                <pre className="p-3 rounded-xl border border-slate-200 dark:border-[#163546] bg-slate-900 text-slate-300 text-[10px] font-mono leading-relaxed overflow-x-auto">
{`{
  "event": "messages.upsert",
  "instanceName": "${tenantId}",
  "from": "918002821800@s.whatsapp.net",
  "senderName": "Customer Name",
  "messageText": "Hi, I want details about Chit Fund software",
  "timestamp": 1725800000
}`}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Add/Edit Rule Modal ──────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0b1d28] border border-slate-200 dark:border-[#1b3a4e] w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#183647] pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Bot className="w-5 h-5 text-[#10b981]" />
                {editingRuleId ? "Edit Rule" : "Add New Keyword Rule"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-white rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Trigger Keyword *</label>
                <input type="text" placeholder="e.g. PRICE, HI, HELP, OFFER, ADDRESS" value={formKeyword} onChange={(e) => setFormKeyword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#06141c] border border-slate-200 dark:border-[#1b3a4e] rounded-xl px-3.5 py-2.5 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#10b981]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Match Type</label>
                  <select value={formMatchType} onChange={(e) => setFormMatchType(e.target.value as AutoReplyRule["matchType"])}
                    className="w-full bg-slate-50 dark:bg-[#06141c] border border-slate-200 dark:border-[#1b3a4e] rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#10b981]">
                    <option value="Contains">Contains</option>
                    <option value="Exact">Exact Match</option>
                    <option value="Starts With">Starts With</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Category</label>
                  <select value={formCategory} onChange={(e) => setFormCategory(e.target.value as AutoReplyRule["category"])}
                    className="w-full bg-slate-50 dark:bg-[#06141c] border border-slate-200 dark:border-[#1b3a4e] rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#10b981]">
                    <option value="General">General</option>
                    <option value="Greeting">Greeting</option>
                    <option value="Sales">Sales & Pricing</option>
                    <option value="Support">Support</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Auto Response Message *</label>
                <textarea rows={4} placeholder="This message will be sent automatically to the customer on WhatsApp..." value={formReplyText} onChange={(e) => setFormReplyText(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#06141c] border border-slate-200 dark:border-[#1b3a4e] rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#10b981] resize-none leading-relaxed" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-[#183647]">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">Cancel</button>
              <button onClick={handleSaveRule} className="px-5 py-2 bg-[#10b981] hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5">
                <Save className="w-4 h-4" /> Save Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
