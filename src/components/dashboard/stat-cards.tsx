"use client";

import { Activity, ArrowUpRight, Radio, Smartphone, Zap } from "lucide-react";
import { Instance } from "@/lib/api-client";

interface StatCardsProps {
  instances: Instance[];
  loading: boolean;
  engineOnline: boolean;
}

export function StatCards({ instances, loading, engineOnline }: StatCardsProps) {
  const openDevicesCount = instances.filter((i) => i.status === "open").length;

  const stats = [
    {
      label: "Active Devices",
      value: loading ? "..." : String(openDevicesCount),
      change: openDevicesCount > 0 ? "LIVE" : "OFFLINE",
      icon: Smartphone,
      accent: openDevicesCount > 0 ? "text-emerald-400" : "text-amber-400",
      bg: openDevicesCount > 0 ? "bg-emerald-500/10 border-emerald-500/30" : "bg-amber-500/10 border-amber-500/30",
      progress: openDevicesCount > 0 ? 100 : 0,
    },
    {
      label: "Engine Sessions",
      value: loading ? "..." : String(instances.length),
      change: instances.length > 0 ? "READY" : "NO SESSIONS",
      icon: Radio,
      accent: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/30",
      progress: instances.length > 0 ? 100 : 0,
    },
    {
      label: "System Alerts",
      value: "0",
      change: "HEALTHY",
      icon: Zap,
      accent: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/30",
      progress: 0,
    },
    {
      label: "Success Rate",
      value: engineOnline ? "100%" : "0%",
      change: engineOnline ? "STABLE" : "DISCONNECTED",
      icon: Activity,
      accent: engineOnline ? "text-emerald-400" : "text-red-400",
      bg: engineOnline ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30",
      progress: engineOnline ? 100 : 0,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <div
          key={i}
          className="p-5 rounded-2xl glass-card border border-[#163546] shadow-lg hover:border-emerald-500/40 transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {stat.label}
            </p>
            <div
              className={`p-2 rounded-xl border ${stat.bg} shadow-[0_0_12px_rgba(16,185,129,0.15)]`}
            >
              <stat.icon className={`w-4 h-4 ${stat.accent}`} />
            </div>
          </div>

          <div className="flex items-baseline justify-between mb-3">
            <h3 className="text-2xl font-bold text-white tracking-tight">{stat.value}</h3>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" />
              {stat.change}
            </span>
          </div>

          <div className="w-full bg-[#081822] h-1.5 rounded-full overflow-hidden border border-[#163546]">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
              style={{ width: `${stat.progress}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
}
