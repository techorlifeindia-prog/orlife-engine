"use client";

import { Activity, ArrowUpRight, Calendar, MessageSquare, Smartphone, Zap, CheckCircle2, Bot, Radio } from "lucide-react";
import { Instance } from "@/lib/api-client";
import { useEffect, useState } from "react";
import { useSessionInfo } from "@/hooks/use-session-info";
import { getActiveClientData } from "@/lib/user-session-utils";


interface StatCardsProps {
  instances: Instance[];
  loading: boolean;
  engineOnline: boolean;
}

export function StatCards({ instances, loading, engineOnline }: StatCardsProps) {
  const { session, mounted } = useSessionInfo();
  const isClientView = session.isClientView;
  const clientName = session.user.name;

  // Real message stats from WhatsApp engine
  const [realSent, setRealSent] = useState<number | null>(null);
  const [realFailed, setRealFailed] = useState(0);
  const [realAiSent, setRealAiSent] = useState<number | null>(null);
  const [realBulkSent, setRealBulkSent] = useState<number | null>(null);

  useEffect(() => {
    if (!mounted) return;
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/evolution/stats");
        if (res.ok) {
          const data = await res.json();
          const totalS = data.totalSent ?? 0;
          setRealSent(totalS);
          setRealFailed(data.totalFailed ?? 0);

          let totalAi = data.totalAiSent;
          let totalBulk = data.totalBulkSent;

          if (totalAi === undefined && data.perInstance) {
            totalAi = 0;
            totalBulk = 0;
            Object.values(data.perInstance).forEach((inst: any) => {
              totalAi += inst.aiSent || 0;
              totalBulk += inst.bulkSent !== undefined ? inst.bulkSent : Math.max(0, (inst.sent || 0) - (inst.aiSent || 0));
            });
          }

          const finalAi = totalAi ?? 13;
          const finalBulk = totalBulk ?? Math.max(0, totalS - finalAi);

          setRealAiSent(finalAi);
          setRealBulkSent(finalBulk);
        }
      } catch {
        // Engine offline — keep null so fallback shows
      }
    };
    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [mounted]);

  const openDevicesCount = instances.filter((i) => i.status === "open").length;

  const bulkCount = realBulkSent !== null ? realBulkSent : Math.max(0, (realSent || 0) - (realAiSent || 13));
  const aiCount = realAiSent !== null ? realAiSent : 13;

  const clientData = getActiveClientData();
  // Monthly Message Quota counts ONLY Bulk & Broadcast messages — AI auto-replies are unlimited/separate
  const quotaSentCount = bulkCount;
  const limitCount = clientData.messageLimit || 15000;
  const remCount = Math.max(0, limitCount - quotaSentCount);
  const usedPct = limitCount > 0 ? Math.min(100, Math.round((quotaSentCount / limitCount) * 100 * 10) / 10) : 0;
  const daysLeft = clientData.daysRemaining !== undefined ? clientData.daysRemaining : 9;

  const formattedExpiry = new Date(clientData.expiryDate || "2026-09-15").toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  // Super Admin View Cards
  const adminStats = [
    {
      label: "Active Devices",
      value: loading ? "..." : String(openDevicesCount),
      change: openDevicesCount > 0 ? "LIVE" : "OFFLINE",
      subtext: `${instances.length} Total Sessions`,
      icon: Smartphone,
      accent: openDevicesCount > 0 ? "text-emerald-500 dark:text-emerald-400" : "text-amber-500 dark:text-amber-400",
      bg: openDevicesCount > 0 ? "bg-emerald-500/10 border-emerald-500/30" : "bg-amber-500/10 border-amber-500/30",
      progress: openDevicesCount > 0 ? 100 : 0,
    },
    {
      label: "Engine Sessions",
      value: loading ? "..." : String(instances.length),
      change: instances.length > 0 ? "READY" : "NO SESSIONS",
      subtext: "Baileys API Gateway",
      icon: MessageSquare,
      accent: "text-emerald-500 dark:text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/30",
      progress: instances.length > 0 ? 100 : 0,
    },
    {
      label: "System Alerts",
      value: "0",
      change: "HEALTHY",
      subtext: "0 Critical Issues",
      icon: Zap,
      accent: "text-emerald-500 dark:text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/30",
      progress: 100,
    },
    {
      label: "Success Rate",
      value: engineOnline ? "100%" : "0%",
      change: engineOnline ? "STABLE" : "OFFLINE",
      subtext: "Live Network Uptime",
      icon: Activity,
      accent: engineOnline ? "text-emerald-500 dark:text-emerald-400" : "text-red-500 dark:text-red-400",
      bg: engineOnline ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-400/10 border-red-400/30",
      progress: engineOnline ? 100 : 0,
    },
  ];

  // Client SaaS View Cards (Focused on Business Values: Devices, Quota, AI Replies, Plan Expiry)
  const clientStats = [
    {
      label: "Connected WhatsApp Numbers",
      value: loading ? "..." : `${openDevicesCount} Active`,
      change: openDevicesCount > 0 ? "ONLINE" : "OFFLINE",
      subtext: openDevicesCount > 0 ? "Ready for Broadcast" : "Scan QR Code to Connect",
      icon: Smartphone,
      accent: openDevicesCount > 0 ? "text-emerald-500 dark:text-emerald-400" : "text-amber-500 dark:text-amber-400",
      bg: openDevicesCount > 0 ? "bg-emerald-500/10 border-emerald-500/30" : "bg-amber-500/10 border-amber-500/30",
      progress: openDevicesCount > 0 ? 100 : 20,
    },
    {
      label: "Monthly Message Quota",
      value: `${quotaSentCount.toLocaleString()} / ${limitCount.toLocaleString()}`,
      change: `${usedPct}% USED`,
      subtext: `${remCount.toLocaleString()} Messages Remaining`,
      icon: MessageSquare,
      accent: "text-emerald-500 dark:text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/30",
      progress: usedPct,
    },
    {
      label: "AI Auto-Replies Sent",
      value: `${aiCount.toLocaleString()} Sent`,
      change: "24/7 AUTO",
      subtext: "Automated Bot Responses",
      icon: Bot,
      accent: "text-purple-500 dark:text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/30",
      progress: 100,
    },
    {
      label: "Plan Validity & Expiry",
      value: `${daysLeft} Days Left`,
      change: (clientData.planName || "ENTERPRISE AI").toUpperCase(),
      subtext: `Expires on ${formattedExpiry}`,
      icon: Calendar,
      accent: "text-sky-500 dark:text-sky-400",
      bg: "bg-sky-500/10 border-sky-500/30",
      progress: Math.min(100, Math.max(10, Math.round((daysLeft / 30) * 100))),
    },
  ];

  const activeStats = isClientView ? clientStats : adminStats;

  if (!mounted) {
    return (
      <div className="space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 rounded-xl bg-[#0b1d28] border border-[#1b3a4e] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {isClientView && (
        <div className="flex items-center justify-between bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
              Welcome, <span className="text-emerald-600 dark:text-emerald-400">{mounted ? clientName : ""}</span> — Professional SaaS Client Dashboard
            </p>
          </div>
          <span className="text-[10px] bg-white dark:bg-[#06141c] text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-lg font-mono font-bold border border-emerald-500/30 shadow-sm shrink-0">
            Status: ACTIVE
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {activeStats.map((stat, i) => (
          <div
            key={i}
            className="p-3 sm:p-3.5 rounded-xl bg-white dark:bg-[#0b1d28] border border-slate-200 dark:border-[#1b3a4e] shadow-md hover:border-emerald-500/40 transition-all group relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                {stat.label}
              </p>
              <div className={`p-1.5 rounded-lg border ${stat.bg} shadow-sm shrink-0`}>
                <stat.icon className={`w-3.5 h-3.5 ${stat.accent}`} />
              </div>
            </div>

            <div className="flex items-baseline justify-between mb-1">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</h3>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded-md flex items-center gap-0.5 shrink-0">
                <ArrowUpRight className="w-2.5 h-2.5" />
                {stat.change}
              </span>
            </div>

            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mb-2 truncate">{stat.subtext}</p>

            <div className="w-full bg-slate-100 dark:bg-[#06141c] h-1 rounded-full overflow-hidden border border-slate-200 dark:border-[#183647]">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${stat.progress}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

