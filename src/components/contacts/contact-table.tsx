"use client";

import { Trash2, Phone, Calendar, FileText, User } from "lucide-react";

export interface Contact {
  id: string;
  name: string;
  phone: string;
  tag: string;
  notes?: string;
  createdAt: string;
}

interface ContactTableProps {
  contacts: Contact[];
  onDeleteContact: (id: string) => void;
}

export function ContactTable({ contacts, onDeleteContact }: ContactTableProps) {
  // Category Color Badge Mapper
  const tagStyles: Record<string, string> = {
    VIP: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    Leads: "bg-sky-500/10 text-sky-400 border-sky-500/30",
    Customers: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    Wholesale: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  };

  const getTagStyle = (tag: string) => {
    if (tag.startsWith("Group:")) {
      return "bg-teal-500/10 text-teal-300 border-teal-500/30";
    }
    return tagStyles[tag] || "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
  };

  return (
    <div className="border border-[#163546] bg-[#0c1f2b]/90 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl flex flex-col">
      <div className="overflow-x-auto overflow-y-auto max-h-[540px] scrollbar-thin">
        <table className="w-full text-left text-xs border-collapse min-w-[620px]">
          <thead className="bg-[#06141c] border-b border-[#163546] text-[11px] text-slate-400 uppercase tracking-wider font-bold sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-3 py-3 bg-[#06141c] text-center w-12">S.No</th>
              <th className="px-3.5 py-3 bg-[#06141c]">Name</th>
              <th className="px-3 py-3 bg-[#06141c]">Phone Number</th>
              <th className="px-3 py-3 bg-[#06141c]">Segment / Tag</th>
              <th className="px-3 py-3 bg-[#06141c]">Notes</th>
              <th className="px-3 py-3 bg-[#06141c]">Added Date</th>
              <th className="px-3 py-3 text-right bg-[#06141c]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#163546]/60">
            {contacts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                  <User className="w-8 h-8 mx-auto text-slate-500/60 mb-2" />
                  <p className="font-semibold text-slate-300 text-sm">No contacts found matching your search.</p>
                  <p className="text-xs text-slate-500 mt-1">Try adding a new contact or importing a CSV file.</p>
                </td>
              </tr>
            ) : (
              contacts.map((c, index) => (
                <tr
                  key={c.id}
                  className="hover:bg-[#0e2736]/70 transition-colors group"
                >
                  {/* S.No */}
                  <td className="px-3 py-3 text-center font-mono text-xs font-bold text-slate-400">
                    {index + 1}
                  </td>

                  {/* Name */}
                  <td className="px-3.5 py-3 font-semibold text-slate-100">
                    <span className="group-hover:text-emerald-300 transition-colors line-clamp-1">{c.name}</span>
                  </td>

                  {/* Phone */}
                  <td className="px-3 py-3 font-mono text-xs text-slate-300 whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-500" />
                      {c.phone}
                    </span>
                  </td>

                  {/* Segment / Tag */}
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTagStyle(
                        c.tag
                      )}`}
                    >
                      {c.tag}
                    </span>
                  </td>

                  {/* Notes */}
                  <td className="px-3 py-3 text-slate-400 text-xs max-w-[150px] truncate" title={c.notes}>
                    {c.notes ? (
                      <span className="flex items-center gap-1 truncate">
                        <FileText className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">{c.notes}</span>
                      </span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>

                  {/* Added Date */}
                  <td className="px-3 py-3 text-slate-400 text-xs font-mono whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {c.createdAt}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-3 text-right">
                    <button
                      onClick={() => onDeleteContact(c.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete Contact"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Summary Bar */}
      <div className="px-4 py-2 bg-[#06141c] border-t border-[#163546] flex items-center justify-between text-xs text-slate-400 font-medium">
        <span>Contacts Count:</span>
        <span className="font-bold text-emerald-400 font-mono">{contacts.length} Records Listed</span>
      </div>
    </div>
  );
}
