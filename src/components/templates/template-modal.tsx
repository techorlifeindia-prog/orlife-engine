"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, Plus, Check } from "lucide-react";
import { MessageTemplate } from "./template-card";

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (templateData: Omit<MessageTemplate, "id" | "updatedAt"> & { id?: string }) => void;
  editingTemplate?: MessageTemplate | null;
}

export function TemplateModal({ isOpen, onClose, onSave, editingTemplate }: TemplateModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<MessageTemplate["category"]>("Marketing");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (editingTemplate) {
      setTitle(editingTemplate.title);
      setCategory(editingTemplate.category);
      setContent(editingTemplate.content);
    } else {
      setTitle("");
      setCategory("Marketing");
      setContent("");
    }
  }, [editingTemplate, isOpen]);

  if (!isOpen) return null;

  const handleInsertTag = (tag: string) => {
    setContent((prev) => prev + ` {{${tag}}}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("Please fill in both title and template content!");
      return;
    }

    onSave({
      id: editingTemplate?.id,
      title: title.trim(),
      category,
      content: content.trim(),
    });

    onClose();
  };

  const commonTags = ["name", "phone", "company", "order_id", "date"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0b1d28] border border-slate-200 dark:border-[#1b3a4e] text-slate-900 dark:text-slate-100 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-200 dark:border-[#183647]">
          <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            {editingTemplate ? "Edit Message Template" : "Create New Template"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-400 block mb-1.5">
              Template Title <span className="text-emerald-600 dark:text-emerald-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Festival Offer September"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#06141c] border border-slate-200 dark:border-[#1b3a4e] rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-400 block mb-1.5">
              Category <span className="text-emerald-600 dark:text-emerald-400">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as MessageTemplate["category"])}
              className="w-full bg-slate-50 dark:bg-[#06141c] border border-slate-200 dark:border-[#1b3a4e] rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium transition-all"
            >
              <option value="Marketing">Marketing</option>
              <option value="Utility">Utility</option>
              <option value="Support">Support</option>
              <option value="Greetings">Greetings</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-400">
                Message Content <span className="text-emerald-600 dark:text-emerald-400">*</span>
              </label>
              <span className="text-[11px] text-slate-500">Insert tags below:</span>
            </div>

            {/* Quick Variable Tag Insertion Buttons */}
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {commonTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleInsertTag(tag)}
                  className="text-[11px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-lg font-mono flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" /> {`{{${tag}}}`}
                </button>
              ))}
            </div>

            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write message template with dynamic variables..."
              className="w-full bg-slate-50 dark:bg-[#06141c] border border-slate-200 dark:border-[#1b3a4e] rounded-xl p-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none font-sans leading-relaxed transition-all"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-[#183647]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
            >
              <Check className="w-4 h-4" /> {editingTemplate ? "Save Changes" : "Create Template"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
