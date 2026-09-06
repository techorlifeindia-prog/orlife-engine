"use client";

import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { UserPlus, Upload, Download, Search, Filter, Trash2, Send } from "lucide-react";
import { ContactTable, Contact } from "@/components/contacts/contact-table";
import { AddContactModal } from "@/components/contacts/add-contact-modal";
import { GroupExtractorPanel } from "@/components/contacts/group-extractor-panel";
import { formatPhoneNumber } from "@/lib/phone-utils";
import { useRouter } from "next/navigation";

const isDummyContact = (c: Contact) =>
  c.name === "Rahul Sharma" || c.name === "Priya Patel" || c.name === "Amit Kumar" || c.phone.includes("987654321");

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");

  // Add Contact Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBroadcastCurrentFilter = () => {
    if (filteredContacts.length === 0) return;
    const recipientsText = filteredContacts.map((c) => `${c.name}, ${c.phone}`).join("\n");
    localStorage.setItem("broadcast_draft_recipients", recipientsText);
    localStorage.setItem("broadcast_draft_name", `Broadcast - ${selectedTag}`);
    router.push("/campaigns");
  };

  // Sync with LocalStorage for persistence & filter dummy data
  useEffect(() => {
    const saved = localStorage.getItem("orlife_contacts");
    if (saved) {
      try {
        const parsed: Contact[] = JSON.parse(saved);
        const cleaned = parsed
          .filter((c) => !isDummyContact(c))
          .map((c) => ({
            ...c,
            phone: formatPhoneNumber(c.phone),
          }));
        setContacts(cleaned);
        localStorage.setItem("orlife_contacts", JSON.stringify(cleaned));
      } catch (e) {
        console.error("Failed to parse contacts from localStorage", e);
      }
    }
  }, []);

  const saveContactsToStorage = (updated: Contact[]) => {
    const cleaned = updated
      .filter((c) => !isDummyContact(c))
      .map((c) => ({
        ...c,
        phone: formatPhoneNumber(c.phone),
      }));
    setContacts(cleaned);
    localStorage.setItem("orlife_contacts", JSON.stringify(cleaned));
  };

  const handleAddContact = (contactData: Omit<Contact, "id" | "createdAt">) => {
    const newContact: Contact = {
      id: Date.now().toString(),
      name: contactData.name,
      phone: formatPhoneNumber(contactData.phone),
      tag: contactData.tag,
      notes: contactData.notes,
      createdAt: new Date().toISOString().split("T")[0],
    };

    saveContactsToStorage([newContact, ...contacts]);
  };

  const handleDeleteContact = (id: string) => {
    if (confirm("Are you sure you want to delete this contact?")) {
      const updated = contacts.filter((c) => c.id !== id);
      saveContactsToStorage(updated);
    }
  };

  const handleClearAllContacts = () => {
    if (confirm("Are you sure you want to clear all contacts?")) {
      setContacts([]);
      localStorage.removeItem("orlife_contacts");
    }
  };

  const handleExtractGroupContacts = (extracted: Contact[]) => {
    saveContactsToStorage([...extracted, ...contacts]);
  };

  const handleExportCSV = () => {
    const csvRows = [
      ["Name", "Phone", "Tag", "Notes", "Created Date"],
      ...filteredContacts.map((c) => [c.name, c.phone, c.tag, c.notes || "", c.createdAt]),
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orlife_contacts_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
      const imported: Contact[] = lines
        .slice(1)
        .map((line, idx) => {
          const parts = line.split(",").map((p) => p.trim());
          return {
            id: `imp_${Date.now()}_${idx}`,
            name: parts[0] || "Imported Contact",
            phone: formatPhoneNumber(parts[1] || ""),
            tag: parts[2] || "Imported",
            notes: parts[3] || "",
            createdAt: new Date().toISOString().split("T")[0],
          };
        })
        .filter((c) => c.phone);

      saveContactsToStorage([...imported, ...contacts]);
      alert(`Successfully imported ${imported.length} contacts!`);
    };
    reader.readAsText(file);
  };

  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.notes && c.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTag = selectedTag === "All" || c.tag === selectedTag;
    return matchesSearch && matchesTag;
  });

  const availableTags = ["All", ...Array.from(new Set(contacts.map((c) => c.tag)))];

  return (
    <div className="min-h-full pb-10 bg-[#06141b]">
      <Header title="Contacts Management & Group Extractor" />

      <div className="px-3 py-4 w-full">
        {/* Main 12-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* Left Column (8 Cols on LG & XL): Control Bar & Contacts Table */}
          <div className="lg:col-span-8 xl:col-span-8 space-y-4">
              <div className="bg-[#0b1d28] border border-[#1b3a4e] p-4 rounded-2xl shadow-md space-y-3">
                {/* Row 1: Search & Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search name, phone number or notes..."
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

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 rounded-xl border border-[#1b3a4e] bg-[#06141c] hover:bg-[#0d2330] text-slate-300 hover:text-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-all"
                      title="Import CSV Contacts"
                    >
                      <Upload className="w-3.5 h-3.5 text-emerald-400" /> Import
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleImportCSV} accept=".csv,.txt" className="hidden" />

                    <button
                      onClick={handleExportCSV}
                      className="px-3 py-2 rounded-xl border border-[#1b3a4e] bg-[#06141c] hover:bg-[#0d2330] text-slate-300 hover:text-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-all"
                      title="Export CSV Contacts"
                    >
                      <Download className="w-3.5 h-3.5 text-sky-400" /> Export
                    </button>

                    {contacts.length > 0 && (
                      <button
                        onClick={handleClearAllContacts}
                        className="p-2 rounded-xl border border-[#1b3a4e] bg-[#06141c] hover:bg-red-500/10 text-slate-400 hover:text-red-400 text-xs transition-all"
                        title="Clear All Contacts"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 active:scale-95 shrink-0"
                    >
                      <UserPlus className="w-4 h-4 stroke-[2.5]" /> Add Contact
                    </button>
                  </div>
                </div>

                {/* Row 2: Tag Filters & Broadcast Action */}
                <div className="flex items-center justify-between gap-2 overflow-x-auto pt-2 border-t border-[#183647]/60 scrollbar-thin">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Filter className="w-3.5 h-3.5 text-slate-400 mr-0.5 shrink-0" />
                    <span className="text-[11px] font-semibold text-slate-400 mr-1 shrink-0">Filter Tag:</span>
                    {availableTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(tag)}
                        className={`text-xs px-3 py-1 rounded-xl font-semibold transition-all shrink-0 ${
                          selectedTag === tag
                            ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                            : "bg-[#06141c] text-slate-400 hover:text-slate-200 hover:bg-[#0d2330] border border-[#183647]"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>

                  {filteredContacts.length > 0 && (
                    <button
                      onClick={handleBroadcastCurrentFilter}
                      className="bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 active:scale-95"
                      title="Send WhatsApp broadcast to all filtered contacts"
                    >
                      <Send className="w-3 h-3" /> Broadcast ({filteredContacts.length})
                    </button>
                  )}
                </div>
              </div>

              {/* Contacts Table Component */}
              <ContactTable contacts={filteredContacts} onDeleteContact={handleDeleteContact} />
          </div>

          {/* Right Column (4 Cols on LG & XL): Group Extractor Panel (Positioned at Top Level!) */}
          <div className="lg:col-span-4 xl:col-span-4 h-full">
            <GroupExtractorPanel onExtractContacts={handleExtractGroupContacts} />
          </div>

        </div>
      </div>

      {/* Add Contact Modal */}
      <AddContactModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddContact={handleAddContact}
      />
    </div>
  );
}
