"use client";

import { useState } from "react";
import { Copy, Check, Trash2, Edit3, Send, Clock, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export interface MessageTemplate {
  id: string;
  title: string;
  category: "Marketing" | "Utility" | "Support" | "Greetings";
  content: string;
  updatedAt: string;
}

interface TemplateCardProps {
  template: MessageTemplate;
  onEdit: (template: MessageTemplate) => void;
  onDelete: (id: string) => void;
}

export function TemplateCard({ template, onEdit, onDelete }: TemplateCardProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(template.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUseInCampaign = () => {
    // Navigate to campaign builder page with selected template content encoded
    const encodedContent = encodeURIComponent(template.content);
    router.push(`/campaigns?message=${encodedContent}`);
  };

  // Helper to render content with highlighted {{variable}} tags
  const renderFormattedContent = (content: string) => {
    const parts = content.split(/(\{\{[^}]+\}\})/g);
    return parts.map((part, index) => {
      if (part.startsWith("{{") && part.endsWith("}}")) {
        return (
          <span
            key={index}
            className="inline-block mx-0.5 px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Category Color Badge Mapper
  const categoryStyles = {
    Marketing: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    Utility: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    Support: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    Greetings: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };

  return (
    <div className="p-5 rounded-2xl border border-slate-200 dark:border-[#163546] bg-white dark:bg-[#0c1f2b]/90 backdrop-blur-md shadow-lg hover:border-emerald-500/40 hover:shadow-emerald-500/5 transition-all duration-200 flex flex-col justify-between group">
      <div>
        {/* Card Header */}
        <div className="flex justify-between items-start mb-3.5 gap-2">
          <div>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                categoryStyles[template.category] || categoryStyles.Marketing
              }`}
            >
              {template.category}
            </span>
            <h3 className="font-bold text-base mt-2 text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors line-clamp-1">
              {template.title}
            </h3>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-[#07151e] p-1 rounded-xl border border-slate-200 dark:border-[#183647] shrink-0">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
              title="Copy Template Text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => onEdit(template)}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
              title="Edit Template"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(template.id)}
              className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              title="Delete Template"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content Box with Tag Highlighting */}
        <div className="bg-slate-50 dark:bg-[#06141c] border border-slate-200 dark:border-[#163546] rounded-xl p-3.5 text-xs text-slate-800 dark:text-slate-300 font-sans whitespace-pre-wrap leading-relaxed min-h-[92px]">
          {renderFormattedContent(template.content)}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200 dark:border-[#163546]/60 text-xs">
        <span className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" /> Updated: {template.updatedAt}
        </span>

        <button
          onClick={handleUseInCampaign}
          className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
        >
          <Send className="w-3 h-3" /> Use in Campaign
        </button>
      </div>
    </div>
  );
}
