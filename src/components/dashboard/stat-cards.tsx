"use client";

import { Activity, ArrowUpRight, Calendar, MessageSquare, Smartphone, Zap, CheckCircle2 } from "lucide-react";
import { Instance } from "@/lib/api-client";
import { useEffect, useState } from "react";
import { getInitialSessionInfo } from "@/lib/user-session-utils";

interface StatCardsProps {
  instances: Instance[];
  loading: boolean;
  engineOnline: boolean;
}

export function StatCards({ instances, loading, engineOnline }: StatCardsProps) {
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState(() => getInitialSessionInfo());
  const isClientView = session.isClientView;
  const clientName = session.user.name;

  useEffect(() => {
    setMounted(true);
    setSession(getInitialSessionInfo());
    const syncSession = () => {
      setSession(getInitialSessionInfo());
    };

    window.addEventListener("storage", syncSession);
    window.addEventListener("user_session_changed", syncSession);

    return () => {
      window.removeEventListener("storage", syncSession);
      window.removeEventListener("user_session_changed", syncSession);
    };
  }, []);

  const openDevicesCount = instances.filter((i) => i.status === "open").length;

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
      bg: engineOnline ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30",
      progress: engineOnline ? 100 : 0,
    },
  ];

  // Client SaaS View Cards (Focused on Business Values: Quota, Plan Days, Active Numbers, Delivery Success)
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
      value: "1,250 / 10,000",
      change: "12.5% USED",
      subtext: "8,750 Messages Remaining",
      icon: MessageSquare,
      accent: "text-emerald-500 dark:text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/30",
      progress: 12.5,
    },
    {
      label: "Delivery Success Rate",
      value: engineOnline ? "98.4%" : "0%",
      change: "HIGH SPEED",
      subtext: "Instant WhatsApp Push",
      icon: CheckCircle2,
      accent: "text-emerald-500 dark:text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/30",
      progress: 98.4,
    },
    {
      label: "Plan Validity & Expiry",
      value: "24 Days Left",
      change: "PRO PLAN",
      subtext: "Expires on Oct 01, 2026",
      icon: Calendar,
      accent: "text-sky-500 dark:text-sky-400",
      bg: "bg-sky-500/10 border-sky-500/30",
      progress: 80,
    },
  ];

  const activeStats = isClientView ? clientStats : adminStats;

  if (!mounted) {
    return (
      <div className="space-y-2.5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
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

