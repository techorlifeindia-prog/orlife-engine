"use client";

import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/layout/Header";
import {
  Send,
  Upload,
  ShieldCheck,
  Play,
  CheckCircle2,
  AlertCircle,
  Users,
  Sparkles,
  RefreshCw,
  MessageSquare,
  Smartphone,
  Image as ImageIcon,
  X,
  Trash2,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { fetchInstances, Instance } from "@/lib/api-client";
import { CampaignRecipient } from "@/lib/campaign-store";
import { getFilteredInstancesForUser } from "@/lib/user-session-utils";

function CampaignForm() {
  const searchParams = useSearchParams();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<string>("");
  const [campaignName, setCampaignName] = useState("");
  const [messageTemplate, setMessageTemplate] = useState(
    "Hello {{name}},\nThank you for choosing OrLife! We have a special update for you today."
  );
  const [rawContactsText, setRawContactsText] = useState("");
  const [mediaUrl, setMediaUrl] = useState<string>("");

  // Anti-Ban Settings
  const [minDelay, setMinDelay] = useState(5);
  const [maxDelay, setMaxDelay] = useState(12);

  // Campaign State
  const [isSending, setIsSending] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [recipientsList, setRecipientsList] = useState<CampaignRecipient[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaFileInputRef = useRef<HTMLInputElement>(null);

  // Load message or broadcast draft from URL param / LocalStorage
  useEffect(() => {
    const msgParam = searchParams.get("message");
    if (msgParam) {
      setMessageTemplate(msgParam);
    }

    const draftName = localStorage.getItem("broadcast_draft_name");
    const draftRecipients = localStorage.getItem("broadcast_draft_recipients");

    if (draftRecipients) {
      setRawContactsText(draftRecipients);
      localStorage.removeItem("broadcast_draft_recipients");
    }

    if (draftName) {
      setCampaignName(draftName);
      localStorage.removeItem("broadcast_draft_name");
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadInstances() {
      const rawList = await fetchInstances();
      const list = getFilteredInstancesForUser(rawList);
      setInstances(list);
      const connected = list.find((i) => i.status === "open") || list[0];
      if (connected) {
        setSelectedInstance(connected.instanceName);
      }
    }
    loadInstances();
  }, []);

  const parseRecipients = (): CampaignRecipient[] => {
    const lines = rawContactsText.split("\n").map((l) => l.trim()).filter(Boolean);
    return lines.map((line) => {
      const parts = line.split(",").map((p) => p.trim());
      if (parts.length >= 2) {
        return { name: parts[0], phone: parts[1], status: "pending" };
      }
      return { name: "Customer", phone: parts[0], status: "pending" };
    });
  };

  const handleClearRecipients = () => {
    setRawContactsText("");
    localStorage.removeItem("broadcast_draft_recipients");
    localStorage.removeItem("broadcast_draft_name");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawContactsText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setMediaUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const insertTag = (tag: string) => {
    setMessageTemplate((prev) => prev + ` {{${tag}}}`);
  };

  const handleStartCampaign = async () => {
    const recipients = parseRecipients();
    if (recipients.length === 0) {
      alert("Please add at least one recipient contact!");
      return;
    }
    if (!selectedInstance) {
      alert("Please select a connected WhatsApp instance!");
      return;
    }

    setRecipientsList(recipients);
    setIsSending(true);
    setCurrentProgress(0);
    setSentCount(0);
    setFailedCount(0);

    let sent = 0;
    let failed = 0;

    for (let i = 0; i < recipients.length; i++) {
      const contact = recipients[i];

      const personalizedMsg = messageTemplate
        .replace(/\{\{name\}\}/gi, contact.name)
        .replace(/\{\{phone\}\}/gi, contact.phone);

      try {
        const res = await fetch("/api/evolution/send-message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instanceName: selectedInstance,
            number: contact.phone,
            text: personalizedMsg,
            mediaUrl: mediaUrl || undefined,
          }),
        });

        if (res.ok) {
          sent++;
          recipients[i].status = "sent";
        } else {
          failed++;
          recipients[i].status = "failed";
        }
      } catch {
        failed++;
        recipients[i].status = "failed";
      }

      setSentCount(sent);
      setFailedCount(failed);
      setRecipientsList([...recipients]);
      setCurrentProgress(Math.round(((i + 1) / recipients.length) * 100));

      if (i < recipients.length - 1) {
        const randomDelay =
          Math.floor(Math.random() * (maxDelay - minDelay + 1) + minDelay) * 1000;
        await new Promise((res) => setTimeout(res, randomDelay));
      }
    }

    setIsSending(false);
  };

  return (
    <div className="min-h-full pb-6 bg-[#06141b]">
      <Header title="Send Message / Campaign Builder" />

      <div className="px-3 py-2 w-full space-y-4">
        {/* Top Header Card with Device Selector */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-[#0b1d28] border border-[#1b3a4e] p-4 rounded-2xl shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                WhatsApp Broadcast Campaign
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                Send personalized bulk messages & images with Anti-Ban protection.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex flex-col text-right w-full md:w-auto">
              <span className="text-[11px] text-slate-400 font-semibold mb-1 flex items-center gap-1 justify-end">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> Selected Device
              </span>
              <select
                value={selectedInstance}
                onChange={(e) => setSelectedInstance(e.target.value)}
                className="bg-[#06141c] text-white border border-[#1b3a4e] text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 font-semibold"
              >
                {instances.map((inst) => (
                  <option key={inst.instanceName} value={inst.instanceName}>
                    {inst.profileName || inst.owner || inst.instanceName}{" "}
                    {inst.owner ? `(+${inst.owner.replace(/^\+/, "")})` : ""}{" "}
                    {inst.status === "open" ? "● Connected" : "○ Offline"}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Form Controls Left */}
          <div className="lg:col-span-7 space-y-4">
            {/* 1. Campaign Name */}
            <div className="bg-[#0b1d28] border border-[#1b3a4e] p-4 rounded-2xl shadow-lg space-y-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                1. Campaign Details
              </h3>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Campaign Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Festival Offer September"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full bg-[#06141c] border border-[#1b3a4e] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all font-medium"
                />
              </div>
            </div>

            {/* 2. Message Content & Image Attachment */}
            <div className="bg-[#0b1d28] border border-[#1b3a4e] p-4 rounded-2xl shadow-lg space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  2. Message Content & Image
                </h3>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-medium mr-1">Insert Tag:</span>
                  <button
                    onClick={() => insertTag("name")}
                    className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 text-[11px] px-2.5 py-0.5 rounded-lg font-mono font-bold transition-all"
                  >
                    {"{{name}}"}
                  </button>
                  <button
                    onClick={() => insertTag("phone")}
                    className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 text-[11px] px-2.5 py-0.5 rounded-lg font-mono font-bold transition-all"
                  >
                    {"{{phone}}"}
                  </button>
                </div>
              </div>

              <textarea
                rows={5}
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                placeholder="Write your message here... Use {{name}} for dynamic names"
                className="w-full bg-[#06141c] border border-[#1b3a4e] rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none font-sans leading-relaxed"
              />

              {/* Image / Media Attachment Option */}
              <div className="pt-2 border-t border-[#183647] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-400" />
                    Attach Image / Media (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={() => mediaFileInputRef.current?.click()}
                    className="text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-xl font-bold flex items-center gap-1 transition-all active:scale-95"
                  >
                    <Upload className="w-3.5 h-3.5" /> Select Image
                  </button>
                  <input
                    type="file"
                    ref={mediaFileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                {mediaUrl && (
                  <div className="relative border border-emerald-500/40 bg-[#06141c] p-2.5 rounded-xl flex items-center gap-3 animate-in fade-in">
                    <img src={mediaUrl} alt="Attached Preview" className="w-12 h-12 object-cover rounded-lg border border-[#1b3a4e] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Image Attached
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">Will be sent with message caption to all recipients</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMediaUrl("")}
                      className="p-1 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all shrink-0"
                      title="Remove Image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Anti-Ban Interval Settings */}
            <div className="bg-[#0b1d28] border border-[#1b3a4e] p-4 rounded-2xl shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  3. Anti-Ban Protection Settings
                </h3>
                <span className="text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
                  Smart Delay Active
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Min Delay (Seconds)
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={60}
                    value={minDelay}
                    onChange={(e) => setMinDelay(Number(e.target.value))}
                    className="w-full bg-[#06141c] border border-[#1b3a4e] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Max Delay (Seconds)
                  </label>
                  <input
                    type="number"
                    min={minDelay}
                    max={120}
                    value={maxDelay}
                    onChange={(e) => setMaxDelay(Number(e.target.value))}
                    className="w-full bg-[#06141c] border border-[#1b3a4e] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Messages will be sent with a random delay between{" "}
                <span className="font-bold text-emerald-400">{minDelay}s</span> and{" "}
                <span className="font-bold text-emerald-400">{maxDelay}s</span> to prevent account flagging.
              </p>
            </div>
          </div>

          {/* Recipients & Dispatch Right */}
          <div className="lg:col-span-5 space-y-4">
            {/* Recipients List */}
            <div className="bg-[#0b1d28] border border-[#1b3a4e] p-4 rounded-2xl shadow-lg space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  Recipients List
                </h3>
                <div className="flex items-center gap-1.5">
                  {rawContactsText && (
                    <button
                      type="button"
                      onClick={handleClearRecipients}
                      className="text-xs bg-[#06141c] hover:bg-red-500/15 text-slate-400 hover:text-red-400 border border-[#1b3a4e] hover:border-red-500/30 px-2.5 py-1 rounded-xl flex items-center gap-1 font-bold transition-all active:scale-95"
                      title="Clear Recipients List"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Clear
                    </button>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs bg-[#06141c] hover:bg-[#0d2330] text-emerald-400 border border-[#1b3a4e] px-3 py-1 rounded-xl flex items-center gap-1.5 font-bold transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload CSV
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".csv,.txt"
                    className="hidden"
                  />
                </div>
              </div>

              <textarea
                rows={6}
                value={rawContactsText}
                onChange={(e) => setRawContactsText(e.target.value)}
                placeholder="Format: Name, Phone&#10;Amit, 919876543210"
                className="w-full bg-[#06141c] border border-[#1b3a4e] rounded-xl p-3 text-xs font-mono text-white focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
              />

              <div className="flex justify-between text-xs text-slate-400 font-semibold pt-0.5">
                <span>Total Contacts Parsed:</span>
                <span className="text-emerald-400 font-bold text-xs">
                  {parseRecipients().length}
                </span>
              </div>
            </div>

            {/* Broadcast Control */}
            <div className="bg-[#0b1d28] border border-[#1b3a4e] p-4 rounded-2xl shadow-lg space-y-3">
              <h3 className="font-bold text-sm text-white">Broadcast Control</h3>

              {isSending && (
                <div className="space-y-2.5 bg-[#06141c] p-3 rounded-xl border border-emerald-500/30">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-white">Sending Progress</span>
                    <span className="font-mono text-emerald-400">{currentProgress}%</span>
                  </div>

                  <div className="w-full bg-[#0b1e28] rounded-full h-2 overflow-hidden border border-[#163546]">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                      style={{ width: `${currentProgress}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between text-xs font-semibold pt-1">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Sent: {sentCount}
                    </span>
                    <span className="flex items-center gap-1 text-red-400">
                      <AlertCircle className="w-3.5 h-3.5" /> Failed: {failedCount}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={handleStartCampaign}
                disabled={isSending}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50 active:scale-95 text-xs"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Broadcasting Messages...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" /> Launch Campaign Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CampaignsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading campaign builder...</div>}>
      <CampaignForm />
    </Suspense>
  );
}
