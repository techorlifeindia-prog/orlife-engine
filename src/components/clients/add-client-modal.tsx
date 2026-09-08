"use client";

import { SaaSClient } from "@/lib/client-utils";
import { PricingPlan } from "@/components/pricing/edit-plan-modal";
import { generateProfessionalApiToken } from "@/lib/user-session-utils";
import { Building2, X } from "lucide-react";
import { useState, useEffect } from "react";

interface AddClientModalProps {
  isOpen: boolean;
  totalClientsCount: number;
  onClose: () => void;
  onAdd: (newClient: SaaSClient) => void;
}

export function AddClientModal({ isOpen, totalClientsCount, onClose, onAdd }: AddClientModalProps) {
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("123456");
  const [planId, setPlanId] = useState<string>("");
  const [validityDays, setValidityDays] = useState(30);
  const [dynamicPlans, setDynamicPlans] = useState<PricingPlan[]>([]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const stored = localStorage.getItem("orlife_pricing_plans");
      if (stored) {
        try {
          const plans: PricingPlan[] = JSON.parse(stored);
          setDynamicPlans(plans);
          if (plans.length > 0 && !planId) {
            setPlanId(plans[0].id);
          }
        } catch (e) {}
      }
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, planId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !phone.trim()) return;

    const today = new Date();
    const expDate = new Date();
    expDate.setDate(today.getDate() + Number(validityDays));

    const cleanBiz = businessName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10);
    const generatedKey = generateProfessionalApiToken(`orl_sk_live_${cleanBiz}_`);
    const nextClientNum = 101 + totalClientsCount;

    const selectedPlan = dynamicPlans.find(p => p.id === planId);
    const finalPlanName = selectedPlan ? selectedPlan.name : "Starter Hub";
    const finalPlanPrice = selectedPlan ? `${selectedPlan.price}${selectedPlan.period}` : "₹999/mo";
    
    let limitStr = selectedPlan ? selectedPlan.messageLimit.replace(/\D/g, "") : "2000";
    const finalMessageLimit = parseInt(limitStr, 10) || 2000;

    const newClient: SaaSClient = {
      id: `client-${Date.now()}`,
      clientIdCode: `#CLI-${nextClientNum}`,
      businessName: businessName.trim(),
      ownerName: ownerName.trim() || "Client Owner",
      email: email.trim() || `${businessName.toLowerCase().replace(/\s+/g, "")}@client.com`,
      phone: phone.trim(),
      loginPassword: password.trim() || "123456",
      planName: finalPlanName,
      planPrice: finalPlanPrice,
      status: "Active",
      startDate: today.toISOString().split("T")[0],
      expiryDate: expDate.toISOString().split("T")[0],
      daysRemaining: Number(validityDays),
      apiKey: generatedKey,
      connectedDevicesCount: 1,
      messagesSent: 0,
      messageLimit: finalMessageLimit,
    };

    onAdd(newClient);
    setBusinessName("");
    setOwnerName("");
    setEmail("");
    setPhone("");
    setPassword("123456");
    setPlanId(dynamicPlans.length > 0 ? dynamicPlans[0].id : "");
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0b1e28] border border-slate-200 dark:border-[#163546] rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#163546] pb-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" /> Register New SaaS Client
          </h3>
          <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Business / Client Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Chamunda Industries, Chit Fund SaaS"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#06141b] border border-slate-200 dark:border-[#163546] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
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
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#06141b] border border-slate-200 dark:border-[#163546] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">WhatsApp Phone *</label>
              <input
                type="text"
                required
                placeholder="+91 80028 21800"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#06141b] border border-slate-200 dark:border-[#163546] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Client Email Address</label>
              <input
                type="email"
                placeholder="client@orlife.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#06141b] border border-slate-200 dark:border-[#163546] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Login Password *</label>
              <input
                type="text"
                required
                placeholder="e.g. 123456"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#06141b] border border-slate-200 dark:border-[#163546] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Select SaaS Plan</label>
              <select
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#06141b] border border-slate-200 dark:border-[#163546] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
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
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Plan Validity (Days)</label>
              <input
                type="number"
                value={validityDays}
                onChange={(e) => setValidityDays(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#06141b] border border-slate-200 dark:border-[#163546] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>


          <div className="pt-3 border-t border-slate-200 dark:border-[#163546] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-bold rounded-xl shadow-lg"
            >
              Save & Generate Client Credentials
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
