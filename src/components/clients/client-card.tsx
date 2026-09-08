"use client";

import { SaaSClient } from "@/lib/client-utils";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  LogIn,
  Pencil,
  RefreshCw,
  Settings2,
  Zap,
} from "lucide-react";

interface ClientCardProps {
  client: SaaSClient;
  rawMode?: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onOpenEdit: () => void;
  onOpenConfig: () => void;
  onImpersonate: () => void;
  onExtendPlan: () => void;
}

export function ClientCard({
  client,
  rawMode,
  isExpanded,
  onToggleExpand,
  onOpenEdit,
  onOpenConfig,
  onImpersonate,
  onExtendPlan,
}: ClientCardProps) {
  const usagePercent = Math.round((client.messagesSent / client.messageLimit) * 100);

  let livePlanName = client.planName;
  let livePlanPrice = client.planPrice;

  if (rawMode === "broadcast_only" || rawMode === "orlife_ai") {
    livePlanName = "Starter Hub";
    livePlanPrice = "₹999/mo";
  } else if (rawMode === "api_webhook") {
    livePlanName = "Pro Automation";
    livePlanPrice = "₹2,499/mo";
  } else if (rawMode === "api_with_ai") {
    livePlanName = "Enterprise AI";
    livePlanPrice = "₹4,999/mo";
  }

  const liveMode =
    rawMode ||
    (client.planName === "Enterprise AI"
      ? "api_with_ai"
      : client.planName === "Pro Automation"
      ? "api_webhook"
      : "orlife_ai");

  return (
    <div className="bg-white dark:bg-[#0b1e28] border border-slate-200 dark:border-[#163546] hover:border-emerald-500/50 rounded-2xl transition-all shadow-md hover:shadow-xl overflow-hidden">
      {/* Header Section (Always Visible) */}
      <div
        className={`p-4 md:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors ${
          isExpanded ? "border-b border-slate-200 dark:border-[#163546] bg-slate-50/50 dark:bg-[#06141b]/30" : ""
        }`}
      >
        {/* Left: Avatar & Business Meta */}
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          <div className="px-3 h-11 rounded-xl bg-gradient-to-br from-emerald-500/20 via-teal-500/15 to-cyan-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-mono font-black text-sm tracking-wide shadow-sm shrink-0">
            {(client.clientIdCode || `CLI-${client.id.replace(/\D/g, "")}`).replace(/^#/, "")}
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            {/* Name & Badges */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="font-bold text-base md:text-lg text-slate-900 dark:text-white tracking-tight truncate">
                {client.businessName}
              </h3>

              {/* Status Badge */}
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                  client.status === "Active"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    : client.status === "Expiring Soon"
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    client.status === "Active"
                      ? "bg-emerald-500 animate-pulse"
                      : client.status === "Expiring Soon"
                      ? "bg-amber-500"
                      : "bg-rose-500"
                  }`}
                ></span>
                {client.status === "Active"
                  ? `Active (${client.daysRemaining}d Left)`
                  : client.status === "Expiring Soon"
                  ? `Expiring in ${client.daysRemaining}d`
                  : "Plan Expired"}
              </span>
            </div>

            {/* Contact & Owner Details Row (Compact Header View) */}
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap pt-0.5">
              <span>
                👤 <strong className="text-slate-800 dark:text-slate-200 font-semibold">{client.ownerName}</strong>
              </span>
              <span>•</span>
              <span className="font-mono">
                📞 <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{client.phone}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions Bar + Toggle Chevron */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={onOpenEdit}
            className="px-3.5 py-2 bg-slate-100 dark:bg-[#06141b] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#163546] rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
            title="Edit Client Business Name, Owner, Phone, Email & Plan Details"
          >
            <Pencil className="w-3.5 h-3.5 text-cyan-500" /> Edit
          </button>

          <button
            onClick={onOpenConfig}
            className="px-3.5 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
            title="Configure Working Mode, Custom AI Prompt & API Key for this Client"
          >
            <Settings2 className="w-3.5 h-3.5 text-purple-500" /> ⚙️ Mode Config
          </button>

          <button
            onClick={onImpersonate}
            className="px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-cyan-500/20 flex items-center gap-1.5 active:scale-95"
            title="1-Click Super Admin Login into Client Dashboard"
          >
            <LogIn className="w-3.5 h-3.5" /> ⚡ 1-Click Login
          </button>

          {isExpanded && (
            <button
              onClick={onExtendPlan}
              className="px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 active:scale-95 animate-in fade-in"
              title="Add 30 Days to Subscription"
            >
              <RefreshCw className="w-3.5 h-3.5" /> +30 Days
            </button>
          )}

          {/* Chevron Button (ONLY trigger for expand/collapse) */}
          <button
            onClick={onToggleExpand}
            className="p-2 rounded-xl bg-slate-100 dark:bg-[#06141b] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#163546] transition-all ml-1"
            title={isExpanded ? "Collapse Details" : "Expand Details"}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-emerald-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {/* Collapsible Smart Body: Visible ONLY when Expanded */}
      {isExpanded && (
        <div className="p-4 md:p-5 animate-in slide-in-from-top-2 duration-200 space-y-4">
          {/* Top Row: Plan, Mode, Device Count & Email */}
          <div className="flex items-center gap-2.5 flex-wrap p-3 rounded-xl bg-slate-50 dark:bg-[#06141b] border border-slate-200 dark:border-[#163546]">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">
              📋 Subscription & Mode:
            </span>

            {/* Plan Name & Price Pill */}
            <span className="bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 px-3 py-1 rounded-full text-xs font-mono font-bold shadow-sm">
              {livePlanName} • {livePlanPrice}
            </span>

            {/* Working Mode Pill */}
            <span
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold border flex items-center gap-1.5 shadow-sm ${
                liveMode === "broadcast_only"
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                  : liveMode === "api_webhook"
                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/30"
                  : liveMode === "api_with_ai"
                  ? "bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/30"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30"
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              {liveMode === "broadcast_only"
                ? "Broadcast Only"
                : liveMode === "api_webhook"
                ? "API Webhook"
                : liveMode === "api_with_ai"
                ? "Custom AI Bot"
                : "OrLife Standard AI"}
            </span>

            {/* Connected Devices Count Pill */}
            <span className="bg-slate-100 dark:bg-[#091822] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#163546] px-3 py-1 rounded-full text-xs font-mono font-bold">
              📱 {client.connectedDevicesCount} Dev
            </span>

            {/* Client Email Pill */}
            <span className="bg-slate-100 dark:bg-[#091822] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#163546] px-3 py-1 rounded-full text-xs font-mono">
              ✉️ {client.email}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Widget 1: Plan Validity Dates */}
            <div className="bg-slate-50 dark:bg-[#06141b] border border-slate-200 dark:border-[#163546] rounded-xl p-3.5 space-y-2">
              <span className="flex items-center gap-1.5 font-bold text-cyan-600 dark:text-cyan-400">
                <Calendar className="w-4 h-4" /> Subscription Expiry Date
              </span>
              <div className="flex items-center justify-between font-mono bg-white dark:bg-black/40 px-4 py-2 rounded-lg border border-slate-200 dark:border-[#163546]">
                <div>
                  <p className="text-[9px] text-slate-400 font-sans uppercase">Start Date</p>
                  <p className="font-semibold text-slate-700 dark:text-slate-300">{client.startDate}</p>
                </div>
                <span>➔</span>
                <div className="text-right">
                  <p className="text-[9px] text-slate-400 font-sans uppercase">Expiry Date</p>
                  <p
                    className={`font-bold ${
                      client.daysRemaining < 7
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {client.expiryDate}
                  </p>
                </div>
              </div>
            </div>

            {/* Widget 2: Messages Quota Usage Bar */}
            <div className="bg-slate-50 dark:bg-[#06141b] border border-slate-200 dark:border-[#163546] rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-bold">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <Zap className="w-4 h-4" /> Monthly Messages Quota
                </span>
                <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                  {usagePercent}% Used
                </span>
              </div>

              <div className="bg-white dark:bg-black/40 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#163546] space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-slate-700 dark:text-slate-300">
                  <span>{client.messagesSent.toLocaleString()}</span>
                  <span className="text-slate-400">/ {client.messageLimit.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-[#163546] h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all rounded-full ${
                      usagePercent > 90
                        ? "bg-rose-500"
                        : usagePercent > 70
                        ? "bg-amber-400"
                        : "bg-gradient-to-r from-emerald-500 to-teal-400"
                    }`}
                    style={{ width: `${Math.min(usagePercent, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
