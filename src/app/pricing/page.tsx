"use client";

import { Header } from "@/components/layout/Header";
import { CheckCircle2, Zap, Rocket, Crown, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { getInitialSessionInfo } from "@/lib/user-session-utils";
import { EditPlanModal, PricingPlan } from "@/components/pricing/edit-plan-modal";

const defaultPlans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter Hub",
    price: "₹999",
    period: "/mo",
    description: "Perfect for small businesses starting with WhatsApp automation.",
    messageLimit: "2,000 SMS / month",
    iconType: "zap",
    features: [
      "Basic Broadcasts",
      "Keyword Auto Replies",
      "1 Device Connection",
      "Standard Support",
    ],
    popular: false,
    color: "emerald",
  },
  {
    id: "pro",
    name: "Pro Automation",
    price: "₹2,499",
    period: "/mo",
    description: "For growing businesses needing webhook and API integrations.",
    messageLimit: "10,000 SMS / month",
    iconType: "rocket",
    features: [
      "Everything in Starter Hub",
      "API & Webhooks Integration",
      "Advanced CRM Campaigns",
      "Up to 3 Device Connections",
      "Priority Support",
    ],
    popular: true,
    color: "cyan",
  },
  {
    id: "enterprise",
    name: "Enterprise AI",
    price: "₹4,999",
    period: "/mo",
    description: "Full-scale AI automation for large enterprises and heavy users.",
    messageLimit: "25,000 SMS / month",
    iconType: "crown",
    features: [
      "Everything in Pro Automation",
      "Llama 3.2 AI Assistant",
      "Smart Sentiment Analysis",
      "Unlimited Device Connections",
      "24/7 Dedicated Support",
    ],
    popular: false,
    color: "amber",
  },
];

export default function PricingPage() {
  const [plans, setPlans] = useState<PricingPlan[]>(defaultPlans);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);

  useEffect(() => {
    setIsSuperAdmin(getInitialSessionInfo().isSuperAdmin);

    try {
      const saved = localStorage.getItem("orlife_pricing_plans");
      if (saved) {
        setPlans(JSON.parse(saved));
      } else {
        localStorage.setItem("orlife_pricing_plans", JSON.stringify(defaultPlans));
      }
    } catch (e) {}
  }, []);

  const handleSavePlan = (updatedPlan: PricingPlan) => {
    let updatedPlans;
    if (!updatedPlan.id) {
      updatedPlan.id = "plan_" + Date.now();
      updatedPlans = [...plans, updatedPlan];
    } else {
      updatedPlans = plans.map(p => p.id === updatedPlan.id ? updatedPlan : p);
    }
    setPlans(updatedPlans);
    localStorage.setItem("orlife_pricing_plans", JSON.stringify(updatedPlans));
    setEditingPlan(null);
  };

  const handleAddPlan = () => {
    setEditingPlan({
      id: "",
      name: "",
      price: "",
      period: "/mo",
      description: "",
      messageLimit: "",
      autoReplyLimit: "",
      features: [],
      popular: false,
      color: "emerald",
      iconType: "zap"
    });
  };

  const renderIcon = (type: string, color: string) => {
    const className = `w-8 h-8 text-${color}-500`;
    if (type === "zap") return <Zap className={className} />;
    if (type === "rocket") return <Rocket className={className} />;
    if (type === "crown") return <Crown className={className} />;
    return <CheckCircle2 className={className} />;
  };

  return (
    <div className="min-h-full pb-6">
      <Header title="Pricing & SaaS Plans" />

      <div className="px-4 py-4 max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-2 max-w-3xl mx-auto relative">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Simple, Transparent Pricing
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Choose the perfect plan for your WhatsApp automation needs. Whether you're a small retailer or a large enterprise, we have a plan designed to scale with your business.
          </p>
          {isSuperAdmin && (
            <div className="absolute -top-4 right-0 md:top-0">
              <button
                onClick={handleAddPlan}
                className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-bold rounded-xl transition-all border border-emerald-500/20"
              >
                + Add Plan
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white dark:bg-[#0b1e28] border rounded-2xl p-5 flex flex-col shadow-xl transition-transform duration-300 hover:scale-[1.02] group ${
                plan.popular
                  ? "border-cyan-500 ring-1 ring-cyan-500/50 shadow-cyan-500/20"
                  : "border-slate-200 dark:border-[#163546]"
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">
                  MOST POPULAR
                </div>
              )}

              {isSuperAdmin && (
                <button
                  onClick={() => setEditingPlan(plan)}
                  className="absolute top-3 right-3 p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-emerald-500 dark:text-slate-400 dark:hover:text-emerald-400 rounded-full transition-all opacity-0 group-hover:opacity-100"
                  title="Edit Plan"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}

              <div className="mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-${plan.color}-500/10 border border-${plan.color}-500/20`}>
                  {renderIcon(plan.iconType, plan.color)}
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{plan.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 h-8 line-clamp-2">{plan.description}</p>
              </div>

              <div className="mb-4 border-b border-slate-200 dark:border-[#163546] pb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{plan.price}</span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{plan.period}</span>
                </div>
                <div className="flex flex-col items-start gap-1 mt-2">
                  <div className="inline-block px-2.5 py-0.5 bg-slate-100 dark:bg-[#06141b] border border-slate-200 dark:border-[#163546] rounded-md text-[11px] font-mono text-slate-700 dark:text-slate-300 font-bold">
                    Quota: {plan.messageLimit}
                  </div>
                  {plan.autoReplyLimit && (
                    <div className="inline-block px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/30 rounded-md text-[11px] font-mono text-indigo-700 dark:text-indigo-300 font-bold">
                      Auto Reply: {plan.autoReplyLimit}
                    </div>
                  )}
                </div>
              </div>

              <ul className="space-y-2 mb-4 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${plan.popular ? 'text-cyan-500' : plan.id === 'starter' ? 'text-emerald-500' : 'text-amber-500'}`} />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-2 px-4 rounded-xl text-sm font-bold text-center transition-all ${
                  plan.popular
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/30"
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-[#163546] dark:hover:bg-[#1b4358] text-slate-900 dark:text-white"
                }`}
              >
                Choose {plan.name}
              </button>
            </div>
          ))}
        </div>
        
        <div className="mt-6 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Need a custom plan with higher message limits? <a href="/clients" className="text-emerald-500 font-semibold hover:underline">Contact Super Admin</a>.
            </p>
        </div>
      </div>

      <EditPlanModal
        plan={editingPlan}
        onClose={() => setEditingPlan(null)}
        onSave={handleSavePlan}
      />
    </div>
  );
}
