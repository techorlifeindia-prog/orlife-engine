"use client";

import Link from "next/link";
import { QrCode, Send, Users, Key, Sparkles, ArrowRight } from "lucide-react";
import { useConfirmStore } from "@/lib/confirm-store";

export function QuickActionsBar() {
  const { showAlert } = useConfirmStore();

  const handleCopyApiKey = () => {
    const fakeToken = "orlife_live_sk_98374928174982739487";
    navigator.clipboard.writeText(fakeToken);
    showAlert({
      title: "API Key Copied!",
      message: "Your Secret API Token has been copied to your clipboard safely.",
      type: "success",
    });
  };

  const actions = [
    {
      title: "Scan WhatsApp QR Code",
      desc: "Connect new mobile number",
      icon: QrCode,
      href: "/devices",
      color: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
      btnBg: "bg-emerald-500 hover:bg-emerald-400 text-slate-950",
    },
    {
      title: "Send Bulk Campaign",
      desc: "Dispatch broadcast messages",
      icon: Send,
      href: "/campaigns",
      color: "from-sky-500/20 to-blue-500/10 border-sky-500/30 text-sky-600 dark:text-sky-400",
      btnBg: "bg-sky-500 hover:bg-sky-400 text-slate-950",
    },
    {
      title: "Extract Group Contacts",
      desc: "Fetch members from WhatsApp groups",
      icon: Users,
      href: "/campaigns?tab=groups",
      color: "from-purple-500/20 to-pink-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400",
      btnBg: "bg-purple-500 hover:bg-purple-400 text-white",
    },
    {
      title: "Copy Secret API Token",
      desc: "Integrate with external CRM/ERP",
      icon: Key,
      onClick: handleCopyApiKey,
      color: "from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400",
      btnBg: "bg-amber-500 hover:bg-amber-400 text-slate-950",
    },
  ];

  return (
    <div className="bg-white dark:bg-[#0b1d28] border border-slate-200 dark:border-[#1b3a4e] rounded-xl p-2.5 shadow-md space-y-2">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#183647] pb-1.5 px-0.5">
        <h4 className="text-[11px] font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> Quick Actions & Shortcuts
        </h4>
        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">1-Click Launch</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {actions.map((act, i) => {
          const Content = (
            <div className={`p-2.5 rounded-lg border bg-gradient-to-br ${act.color} flex items-center justify-between hover:scale-[1.01] transition-all cursor-pointer group`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-md bg-white/80 dark:bg-[#06141c]/80 border border-slate-200/50 dark:border-slate-700/50 shadow-sm shrink-0">
                  <act.icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate">{act.title}</h5>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{act.desc}</p>
                </div>
              </div>

              <div className={`p-1 rounded-md ${act.btnBg} font-bold shadow-sm shrink-0 group-hover:translate-x-0.5 transition-transform`}>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          );

          if (act.href) {
            return (
              <Link key={i} href={act.href}>
                {Content}
              </Link>
            );
          }

          return (
            <div key={i} onClick={act.onClick}>
              {Content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
