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

export default function AutomationRulesPage() {
  const [rules, setRules] = useState<AutoReplyRule[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<"All" | "Active" | "Disabled">("All");
  const [activeSection, setActiveSection] = useState<"rules" | "aiprompt">("rules");
  const [mounted, setMounted] = useState(false);

  // Ollama status
  const [ollamaStatus, setOllamaStatus] = useState<"checking" | "online" | "offline">("checking");
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);

  // AI System Prompt
  const [systemPrompt, setSystemPrompt] = useState(
    "You are Rani, a friendly human customer executive at Tech OrLife India based in Hyderabad. Speak naturally and warmly like a real human representative, NOT like a robot or AI. Your company name is Tech OrLife India. Your location is Hyderabad. Answer customer queries about our software, Chit Fund SaaS, KhataHisab, pricing, and demo in short, helpful sentences (max 2-3 lines). Reply in the exact same language (Hinglish/Hindi/English) as the customer."
  );
  const [aiEnabled, setAiEnabled] = useState(true);
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [promptSaved, setPromptSaved] = useState(false);

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
      const res = await fetch(`${AI_HUB_URL}/config`, { signal: AbortSignal.timeout(3000) });
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
        return true;
      }
    } catch { /* backend offline, use localStorage */ }
    return false;
  }, []);

  // Persist active section on change
  const handleSectionChange = (section: "rules" | "aiprompt") => {
    setActiveSection(section);
    localStorage.setItem("orlife_automation_tab", section);
  };

  useEffect(() => {
    // Read localStorage immediately on mount
    const savedAiEnabled = localStorage.getItem("orlife_ai_enabled");
    if (savedAiEnabled !== null) {
      setAiEnabled(savedAiEnabled === "true");
    }

    // Restore saved tab
    const savedTab = localStorage.getItem("orlife_automation_tab");
    if (savedTab === "rules" || savedTab === "aiprompt") {
      setActiveSection(savedTab);
    }
    setMounted(true);

    // Try backend first, fallback to localStorage
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

    // Check Ollama status
    checkOllamaStatus();
  }, [loadFromBackend]);

  const checkOllamaStatus = async () => {
    setOllamaStatus("checking");
    try {
      // 1. Try local Ollama direct port 11434
      try {
        const directRes = await fetch("http://localhost:11434/api/tags", { signal: AbortSignal.timeout(2000) });
        if (directRes.ok) {
          const directData = await directRes.json();
          const modelsList = directData.models?.map((m: any) => typeof m === "string" ? m : m.name) || [];
          setOllamaStatus("online");
          setOllamaModels(modelsList);
          return;
        }
      } catch {}

      // 2. Fallback to AI Hub backend /ollama/status
      const res = await fetch(`${AI_HUB_URL}/ollama/status`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        if (data.status === "ONLINE") {
          setOllamaStatus("online");
          const modelsList = data.models?.map((m: any) => typeof m === "string" ? m : (m.name || String(m))) || [];
          setOllamaModels(modelsList);
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
      await fetch(`${AI_HUB_URL}/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: updatedRules, systemPrompt, aiEnabled }),
        signal: AbortSignal.timeout(3000),
      });
    } catch { /* backend offline, saved locally */ }
  };

  // ── Save System Prompt to backend ─────────────────────────────────────────
  const handleSavePrompt = async () => {
    setSavingPrompt(true);
    try {
      const res = await fetch(`${AI_HUB_URL}/config`, {
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
      const res = await fetch(`${AI_HUB_URL}/ai-hub/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: simMessage, systemPrompt }),
        signal: AbortSignal.timeout(30000),
      });
      if (res.ok) {
        const data = await res.json();
        setSimResult({ matchedKeyword: data.matchedKeyword, matchType: data.matchType || data.source, reply: data.reply, source: data.source });
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
      await fetch(`${AI_HUB_URL}/config`, {
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

      <div className="px-3 py-4 w-full space-y-5">

        {/* ── Top Stats Cards ──────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-[#163546] flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Rules</p>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">{activeCount}<span className="text-xs font-semibold text-slate-400 ml-1">/ {rules.length}</span></h3>
            </div>
            <div className="p-3 bg-[#10b981]/15 text-[#10b981] rounded-2xl border border-[#10b981]/30"><Bot className="w-5 h-5" /></div>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-[#163546] flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ollama AI (Local)</p>
              {ollamaStatus === "checking" && (
                <p className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> Checking...</p>
              )}
              {ollamaStatus === "online" && (
                <p className="text-xs font-extrabold text-emerald-500 mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Online ✅</p>
              )}
              {ollamaStatus === "offline" && (
                <p className="text-xs font-bold text-amber-500 mt-1 flex items-center gap-1"><WifiOff className="w-3 h-3" /> Install Ollama</p>
              )}
            </div>
            <div className={`p-3 rounded-2xl border ${ollamaStatus === "online" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" : "bg-amber-500/10 text-amber-500 border-amber-500/30"}`}>
              {ollamaStatus === "online" ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            </div>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-[#163546] flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">AI Auto-Reply Master</p>
              <button
                onClick={toggleAiEnabled}
                className={`mt-1 text-xs font-black px-3 py-1 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${aiEnabled ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/25" : "bg-rose-500/15 text-rose-500 border-rose-500/30 hover:bg-rose-500/25"}`}
              >
                {aiEnabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                {aiEnabled ? "ON (Active 24/7)" : "OFF (Paused)"}
              </button>
            </div>
            <div className={`p-3 rounded-2xl border ${aiEnabled ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" : "bg-rose-500/10 text-rose-500 border-rose-500/30"}`}>
              <Zap className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-[#163546] flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">AI Model</p>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1">🔒 Llama 3.2 Local</p>
              {ollamaModels.length > 0 && <p className="text-[10px] text-emerald-500 font-mono mt-0.5">{ollamaModels[0]}</p>}
            </div>
            <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl border border-indigo-500/30"><Brain className="w-5 h-5" /></div>
          </div>
        </div>

        {/* ── Section Tabs ─────────────────────────────────── */}
        <div className="glass-card p-2 rounded-2xl flex gap-2 w-fit">
          <button
            onClick={() => handleSectionChange("rules")}
            className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${mounted && activeSection === "rules" ? "bg-[#10b981] text-slate-950 shadow-md" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#112937]"}`}
          >
            <Bot className="w-4 h-4" /> Keyword Rules
          </button>
          <button
            onClick={() => handleSectionChange("aiprompt")}
            className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${mounted && activeSection === "aiprompt" ? "bg-[#10b981] text-slate-950 shadow-md" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#112937]"}`}
          >
            <Brain className="w-4 h-4" /> AI System Prompt
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
                  className="bg-[#10b981] hover:bg-emerald-400 text-slate-950 font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-[#10b981]/20 active:scale-95 shrink-0">
                  <Plus className="w-4 h-4" /> Add New Rule
                </button>
              </div>

              {/* Rules List */}
              {filteredRules.length === 0 ? (
                <div className="glass-card p-12 rounded-2xl text-center border border-dashed border-slate-300 dark:border-[#1b3a4e] space-y-3">
                  <Bot className="w-10 h-10 mx-auto text-slate-400" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No rules found</p>
                  <button onClick={handleOpenAddModal} className="px-4 py-2 bg-[#10b981] text-slate-950 text-xs font-bold rounded-xl shadow-md inline-flex items-center gap-1.5"><Plus className="w-4 h-4" /> Create First Rule</button>
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
                        <button onClick={() => handleToggleRule(rule.id)} className={`text-xs px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 transition-all ${rule.enabled ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30" : "bg-slate-200 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700"}`}>
                          {rule.enabled ? <ToggleRight className="w-4 h-4 text-emerald-500" /> : <ToggleLeft className="w-4 h-4" />}
                          {rule.enabled ? "Active" : "Disabled"}
                        </button>
                        <button onClick={() => handleOpenEditModal(rule)} className="p-1.5 text-slate-500 hover:text-[#10b981] hover:bg-slate-100 dark:hover:bg-[#122836] rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteRule(rule)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-100 dark:hover:bg-[#122836] rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
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
                  className="w-full py-2.5 bg-[#10b981] hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md shadow-[#10b981]/20 flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-70">
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
                  <button onClick={checkOllamaStatus} className="w-full py-1 bg-amber-500 text-slate-950 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1">
                    <RefreshCw className="w-3 h-3" /> Retry Check
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="glass-card p-6 rounded-2xl shadow-lg space-y-5">
              <div className="border-b border-slate-200 dark:border-[#183647] pb-3">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Brain className="w-5 h-5 text-[#10b981]" /> AI System Prompt
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Define the AI's persona, instructions, and language behavior.
                  <br />Used when no keyword rule matches.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  System Prompt (Instructions):
                </label>
                <textarea
                  rows={10}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#06141c] border border-slate-200 dark:border-[#1b3a4e] rounded-xl p-3.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#10b981] resize-none leading-relaxed font-sans"
                  placeholder="e.g. You are OrLife AI Assistant. You answer questions about WhatsApp automation, pricing, and SaaS features politely. Reply in the same language as the customer. Keep answers under 3 lines."
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{systemPrompt.length} characters</p>
              </div>

              <button
                onClick={handleSavePrompt}
                disabled={savingPrompt}
                className="w-full py-3 bg-[#10b981] hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md shadow-[#10b981]/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70"
              >
                {savingPrompt ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</> : promptSaved ? <><CheckCircle2 className="w-4 h-4" /> Saved! ✅</> : <><Save className="w-4 h-4" /> Save Prompt to AI Hub</>}
              </button>
            </div>

            {/* Right: Explanation + Tips */}
            <div className="space-y-4">
              <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-[#163546] space-y-3">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> How Hybrid System Works?
                </h4>
                <div className="space-y-2 text-xs">
                  {[
                    { step: "1", color: "emerald", text: "Customer sends a WhatsApp message" },
                    { step: "2", color: "sky", text: "Check against Keyword Rules first" },
                    { step: "3", color: "amber", text: "Match found? → Send immediate reply" },
                    { step: "4", color: "indigo", text: "No match? → Let AI reply" },
                    { step: "5", color: "slate", text: "AI Offline? → Send static fallback" },
                  ].map(({ step, color, text }) => (
                    <div key={step} className={`flex items-center gap-3 p-2.5 rounded-xl bg-${color}-500/5 border border-${color}-500/20`}>
                      <span className={`w-6 h-6 rounded-full bg-${color}-500/20 text-${color}-600 dark:text-${color}-400 text-[10px] font-extrabold flex items-center justify-center shrink-0`}>{step}</span>
                      <span className="text-slate-700 dark:text-slate-300">{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card p-5 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 space-y-3">
                <h4 className="font-bold text-sm text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                  <Brain className="w-4 h-4" /> Tips for System Prompt
                </h4>
                <div className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                  <p>✅ <strong>Identity</strong> — Who are you?</p>
                  <p>✅ <strong>Language</strong> — Match user's input</p>
                  <p>✅ <strong>Length</strong> — Keep it concise</p>
                  <p>✅ <strong>Tone</strong> — Maintain professionalism</p>
                  <div className="bg-indigo-500/10 p-2.5 rounded-lg border border-indigo-500/30 mt-2">
                    <p className="font-bold text-indigo-500 mb-1">Example Prompt:</p>
                    <p className="font-mono text-[10px] leading-relaxed">You are OrLife SaaS AI. Answer in the customer's language. For pricing: ₹999/month. For support: 9AM-7PM IST. Keep replies under 2 lines.</p>
                  </div>
                </div>
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
