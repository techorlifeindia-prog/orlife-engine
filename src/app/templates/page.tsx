"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { BookTemplate, Plus, Search, Tag, Sparkles } from "lucide-react";
import { TemplateCard, MessageTemplate } from "@/components/templates/template-card";
import { TemplateModal } from "@/components/templates/template-modal";

const INITIAL_TEMPLATES: MessageTemplate[] = [
  {
    id: "1",
    title: "Welcome New Subscriber",
    category: "Greetings",
    content: "Hello {{name}},\nWelcome to OrLife! We're thrilled to have you with us. If you have any questions, reply to this message.",
    updatedAt: "2026-09-01",
  },
  {
    id: "2",
    title: "Festival Discount Offer",
    category: "Marketing",
    content: "Hi {{name}}! 🎁 Special Offer: Get 20% OFF on your next order with code FESTIVE20. Valid till midnight!",
    updatedAt: "2026-09-04",
  },
  {
    id: "3",
    title: "Order Confirmation & Tracking",
    category: "Utility",
    content: "Dear {{name}},\nYour order #{{order_id}} has been confirmed and is being processed. Thank you for shopping with OrLife!",
    updatedAt: "2026-09-05",
  },
  {
    id: "4",
    title: "Customer Support Follow-up",
    category: "Support",
    content: "Hi {{name}}, just following up to ensure your recent query was resolved to your satisfaction. Let us know if you need further help!",
    updatedAt: "2026-09-06",
  },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>(INITIAL_TEMPLATES);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);

  // Sync with LocalStorage for persistence
  useEffect(() => {
    const saved = localStorage.getItem("orlife_templates");
    if (saved) {
      try {
        setTemplates(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse templates from localStorage", e);
      }
    }
  }, []);

  const saveTemplatesToStorage = (updated: MessageTemplate[]) => {
    setTemplates(updated);
    localStorage.setItem("orlife_templates", JSON.stringify(updated));
  };

  const handleSaveTemplate = (templateData: Omit<MessageTemplate, "id" | "updatedAt"> & { id?: string }) => {
    const today = new Date().toISOString().split("T")[0];

    if (templateData.id) {
      // Edit existing
      const updated = templates.map((t) =>
        t.id === templateData.id
          ? {
              ...t,
              title: templateData.title,
              category: templateData.category,
              content: templateData.content,
              updatedAt: today,
            }
          : t
      );
      saveTemplatesToStorage(updated);
    } else {
      // Create new
      const newTemplate: MessageTemplate = {
        id: Date.now().toString(),
        title: templateData.title,
        category: templateData.category,
        content: templateData.content,
        updatedAt: today,
      };
      saveTemplatesToStorage([newTemplate, ...templates]);
    }
  };

  const handleDeleteTemplate = (id: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      const updated = templates.filter((t) => t.id !== id);
      saveTemplatesToStorage(updated);
    }
  };

  const handleOpenEdit = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setIsModalOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setIsModalOpen(true);
  };

  const categories = ["All", "Marketing", "Utility", "Support", "Greetings"];

  const filteredTemplates = templates.filter((t) => {
    const matchesCategory = selectedCategory === "All" || t.category === selectedCategory;
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-full pb-10 bg-[#06141b]">
      <Header title="Message Templates Manager" />

      <div className="px-3 py-4 w-full space-y-5">
        {/* Banner Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0b1d28] border border-[#1b3a4e] p-5 rounded-2xl shadow-lg">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-100">
              <BookTemplate className="w-5 h-5 text-emerald-400" />
              Reusable Message Templates
              <span className="text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full ml-2">
                {templates.length} Active
              </span>
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Create and manage WhatsApp blueprints with dynamic tags (<span className="font-mono text-emerald-400">{"{{name}}"}</span>, <span className="font-mono text-emerald-400">{"{{phone}}"}</span>).
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Create New Template
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0b1d28] border border-[#1b3a4e] p-4 rounded-2xl shadow-md">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search templates or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#06141c] border border-[#1b3a4e] text-slate-100 placeholder:text-slate-500 rounded-xl pl-9 pr-3.5 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto py-1 scrollbar-none">
            <Tag className="w-4 h-4 text-slate-400 mr-1 shrink-0" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3.5 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                  selectedCategory === cat
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                    : "bg-[#06141c] text-slate-400 hover:text-slate-200 hover:bg-[#0d2330] border border-[#183647]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
          {filteredTemplates.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 border border-dashed border-[#1b3a4e] rounded-2xl bg-[#0b1d28]/40">
              <BookTemplate className="w-10 h-10 mx-auto text-slate-500/60 mb-2" />
              <p className="font-semibold text-sm text-slate-300">No message templates found.</p>
              <p className="text-xs mt-1 text-slate-500">Try creating a new template or clearing your search filters.</p>
            </div>
          ) : (
            filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onEdit={handleOpenEdit}
                onDelete={handleDeleteTemplate}
              />
            ))
          )}
        </div>
      </div>

      {/* Modal Component */}
      <TemplateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTemplate}
        editingTemplate={editingTemplate}
      />
    </div>
  );
}
