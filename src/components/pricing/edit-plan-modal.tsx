"use client";

import { Pencil, X } from "lucide-react";
import { useEffect, useState } from "react";

export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  messageLimit: string;
  autoReplyLimit?: string;
  features: string[];
  popular: boolean;
  color: string;
  iconType: string;
}

interface EditPlanModalProps {
  plan: PricingPlan | null;
  onClose: () => void;
  onSave: (updatedPlan: PricingPlan) => void;
}

export function EditPlanModal({ plan, onClose, onSave }: EditPlanModalProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [period, setPeriod] = useState("");
  const [messageLimit, setMessageLimit] = useState("");
  const [autoReplyLimit, setAutoReplyLimit] = useState("");
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState("");
  const [popular, setPopular] = useState(false);

  useEffect(() => {
    if (!plan) return;
    setName(plan.name);
    setPrice(plan.price);
    setPeriod(plan.period || "/mo");
    setMessageLimit(plan.messageLimit);
    setAutoReplyLimit(plan.autoReplyLimit || "");
    setDescription(plan.description);
    setFeatures(plan.features.join("\n"));
    setPopular(plan.popular);

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [plan]);

  if (!plan) return null;

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPeriod = e.target.value;
    setPeriod(newPeriod);
    
    const updateLimitString = (str: string) => {
      if (!str) return str;
      let result = str.replace(/\s*\/\s*month/g, "")
                      .replace(/\s*\/\s*year/g, "")
                      .replace(/\s*\(Lifetime\)/gi, "")
                      .trim();
      
      if (!result) return "";
      
      if (newPeriod === "/mo") return `${result} / month`;
      if (newPeriod === "/yr") return `${result} / year`;
      if (newPeriod === "One-time") return `${result} (Lifetime)`;
      return result;
    };

    setMessageLimit(updateLimitString(messageLimit));
    setAutoReplyLimit(updateLimitString(autoReplyLimit));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const updated: PricingPlan = {
      ...plan,
      name: name.trim(),
      price: price.trim(),
      period: period.trim(),
      messageLimit: messageLimit.trim(),
      autoReplyLimit: autoReplyLimit.trim(),
      description: description.trim(),
      popular,
      features: features.split("\n").map((f) => f.trim()).filter((f) => f.length > 0),
    };

    onSave(updated);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0b1e28] border border-slate-200 dark:border-[#163546] rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#163546] pb-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Pencil className="w-5 h-5 text-emerald-500" /> Edit Pricing Plan
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Plan Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#06141b] border border-slate-200 dark:border-[#163546] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Price</label>
              <input
                type="text"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#06141b] border border-slate-200 dark:border-[#163546] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Period</label>
              <select
                required
                value={period}
                onChange={handlePeriodChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#06141b] border border-slate-200 dark:border-[#163546] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono font-medium appearance-none"
              >
                <option value="/mo">/mo (Monthly)</option>
                <option value="/yr">/yr (Yearly)</option>
                <option value="One-time">One-time (Lifetime)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Message Limit (Text)</label>
              <input
                type="text"
                required
                value={messageLimit}
                onChange={(e) => setMessageLimit(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#06141b] border border-slate-200 dark:border-[#163546] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Auto Reply Limit</label>
              <input
                type="text"
                value={autoReplyLimit}
                onChange={(e) => setAutoReplyLimit(e.target.value)}
                placeholder="e.g. 5,000 / month"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#06141b] border border-slate-200 dark:border-[#163546] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Description</label>
            <textarea
              required
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#06141b] border border-slate-200 dark:border-[#163546] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Features (One per line)</label>
            <textarea
              required
              rows={5}
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#06141b] border border-slate-200 dark:border-[#163546] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 whitespace-pre-wrap font-mono"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="popular"
              checked={popular}
              onChange={(e) => setPopular(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500"
            />
            <label htmlFor="popular" className="text-slate-700 dark:text-slate-300 font-semibold">
              Mark as "Most Popular"
            </label>
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
              Save Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
