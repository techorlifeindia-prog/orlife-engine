"use client";

import { useState } from "react";
import { X, UserPlus, Check } from "lucide-react";
import { Contact } from "./contact-table";

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddContact: (contact: Omit<Contact, "id" | "createdAt">) => void;
}

export function AddContactModal({ isOpen, onClose, onAddContact }: AddContactModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [tag, setTag] = useState("Leads");
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      alert("Please enter a valid phone number!");
      return;
    }

    onAddContact({
      name: name.trim() || "Contact",
      phone: phone.trim(),
      tag,
      notes: notes.trim(),
    });

    setName("");
    setPhone("");
    setNotes("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#0b1d28] border border-[#1b3a4e] text-slate-100 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-[#183647]">
          <h2 className="text-lg font-bold flex items-center gap-2 text-slate-100">
            <UserPlus className="w-5 h-5 text-emerald-400" /> Add New Contact
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">Full Name</label>
            <input
              type="text"
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#06141c] border border-[#1b3a4e] rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">
              Phone Number <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. +919876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-[#06141c] border border-[#1b3a4e] rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">Segment / Tag</label>
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="w-full bg-[#06141c] border border-[#1b3a4e] rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium transition-all"
            >
              <option value="Leads">Leads</option>
              <option value="VIP">VIP</option>
              <option value="Customers">Customers</option>
              <option value="Wholesale">Wholesale</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">Notes</label>
            <input
              type="text"
              placeholder="Additional details (e.g. Inquired for bulk purchase)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#06141c] border border-[#1b3a4e] rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#183647]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
            >
              <Check className="w-4 h-4" /> Save Contact
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
