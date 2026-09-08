"use client";

import { SaaSClient, calculateClientStatus } from "@/lib/client-utils";
import { PricingPlan } from "@/components/pricing/edit-plan-modal";
import { useConfirmStore } from "@/lib/confirm-store";
import { Pencil, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

interface EditClientModalProps {
  client: SaaSClient | null;
  onClose: () => void;
  onSave: (updatedClient: SaaSClient) => void;
  onDelete: (client: SaaSClient) => void;
}

export function EditClientModal({ client, onClose, onSave, onDelete }: EditClientModalProps) {
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [planId, setPlanId] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState("");
  const [dynamicPlans, setDynamicPlans] = useState<PricingPlan[]>([]);

  useEffect(() => {
    if (!client) {
      document.body.style.overflow = "unset";
      return;
    }
    document.body.style.overflow = "hidden";

    const stored = localStorage.getItem("orlife_pricing_plans");
    let loadedPlans: PricingPlan[] = [];
    if (stored) {
      try {
        loadedPlans = JSON.parse(stored);
        setDynamicPlans(loadedPlans);
      } catch (e) {}
    }

    setBusinessName(client.businessName);
    setOwnerName(client.ownerName);
    setEmail(client.email);
    setPhone(client.phone);
    setLoginPassword(client.loginPassword || "123456");
    setExpiryDate(client.expiryDate);

    const matched = loadedPlans.find(p => p.name === client.planName);
    if (matched) {
      setPlanId(matched.id);
    } else if (loadedPlans.length > 0) {
      setPlanId(loadedPlans[0].id);
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [client]);

  if (!client) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !phone.trim()) return;

    const { daysRemaining, status } = calculateClientStatus(expiryDate);
    
    const selectedPlan = dynamicPlans.find(p => p.id === planId);
    const finalPlanName = selectedPlan ? selectedPlan.name : client.planName;
    const finalPlanPrice = selectedPlan ? `${selectedPlan.price}${selectedPlan.period}` : client.planPrice;
    
    let limitStr = selectedPlan ? selectedPlan.messageLimit.replace(/\D/g, "") : String(client.messageLimit);
    const finalMessageLimit = parseInt(limitStr, 10) || client.messageLimit;

    const updated: SaaSClient = {
      ...client,
      businessName: businessName.trim(),
      ownerName: ownerName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      loginPassword: loginPassword.trim(),
      planName: finalPlanName,
      planPrice: finalPlanPrice,
      expiryDate,
      daysRemaining,
      status,
      messageLimit: finalMessageLimit,
    };

    onSave(updated);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0b1e28] border border-slate-200 dark:border-[#163546] rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#163546] pb-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Pencil className="w-5 h-5 text-cyan-500" /> Edit Client Profile
            <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
              {client.clientIdCode || `#CLI-${client.id.replace(/\D/g, "")}`}
            </span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Business / Client Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Chamunda Industries"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#06141b] border border-slate-200 dark:border-[#163546] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Owner Name</label>
              <input
                type="text"
                placeholder="e.g. Babulal Akoli"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#06141b] border border-slate-200 dark:border-[#163546] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                WhatsApp Phone *
              </label>
              <input
                type="text"
                required
                placeholder="+91 80028 21800"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#06141b] border border-slate-200 dark:border-[#163546] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-mono font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Client Email Address
              </label>
              <input
                type="email"
                placeholder="client@orlife.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#06141b] border border-slate-200 dark:border-[#163546] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Login Password</label>
              <input
                type="text"
                required
                placeholder="e.g. 123456"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#06141b] border border-slate-200 dark:border-[#163546] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">SaaS Plan</label>
              <select
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#06141b] border border-slate-200 dark:border-[#163546] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-semibold"
              >
                {dynamicPlans.length > 0 ? (
                  dynamicPlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.price}{p.period})
                    </option>
                  ))
                ) : (
                  <option value="">No plans found</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Plan Expiry Date</label>
              <input
                type="date"
                required
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#06141b] border border-slate-200 dark:border-[#163546] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-[#163546] flex items-center justify-between">
            <button
              type="button"
              onClick={() => onDelete(client)}
              className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-xl font-bold flex items-center gap-1.5 transition-all"
            >
              <Trash2 className="w-4 h-4" /> Delete Client
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg"
              >
                Save Client Profile
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
