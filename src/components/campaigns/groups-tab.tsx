"use client";

// ============================================================
// Tab 2: Groups & Audience Management
// ============================================================

import { Users, Save, Send, Download, Trash2, RefreshCw, Search, X } from "lucide-react";
import type { SavedGroup, NativeGroup, TabType } from "./types";

interface GroupsTabProps {
  groupNameInput: string;
  setGroupNameInput: (v: string) => void;
  groupContactsInput: string;
  setGroupContactsInput: (v: string) => void;
  savedGroupsList: SavedGroup[];
  groupSearchQuery: string;
  setGroupSearchQuery: (v: string) => void;
  nativeGroups: NativeGroup[];
  loadingNativeGroups: boolean;
  onSaveBroadcastGroup: () => void;
  onFetchNativeGroups: () => void;
  onLoadNativeGroupToForm: (ng: NativeGroup) => void;
  onSaveNativeGroup: (ng: NativeGroup) => SavedGroup | undefined;
  onExportGroup: (groupName: string, contactsText: string) => void;
  onDeleteSavedGroup: (id: string) => void;
  onSelectAndDispatch: (groupId: string) => void;
  onTabChange: (tab: TabType) => void;
  onLoadGroupToForm: (grp: SavedGroup) => void;
}

export function GroupsTab({
  groupNameInput, setGroupNameInput,
  groupContactsInput, setGroupContactsInput,
  savedGroupsList, groupSearchQuery, setGroupSearchQuery,
  nativeGroups, loadingNativeGroups,
  onSaveBroadcastGroup, onFetchNativeGroups,
  onLoadNativeGroupToForm, onSaveNativeGroup,
  onExportGroup, onDeleteSavedGroup,
  onSelectAndDispatch, onTabChange,
  onLoadGroupToForm,
}: GroupsTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start animate-in fade-in duration-200">
      {/* Left: Create Broadcast Group */}
      <div className="lg:col-span-6 glass-card p-5 rounded-2xl shadow-lg space-y-4">
        <div className="border-b border-slate-200 dark:border-[#183647] pb-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-500" /> Create Broadcast Group
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Create custom contact lists for marketing campaigns & reminders.
          </p>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Group Name</label>
          <input
            type="text"
            placeholder="e.g. Premium Clients, Group A Members"
            value={groupNameInput}
            onChange={(e) => setGroupNameInput(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#06141c] border border-slate-200 dark:border-[#1b3a4e] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Contacts List (Name:Phone or Phone only)
          </label>
          <textarea
            rows={6}
            placeholder="Enter contacts, e.g. Raj:919876543210 Rahul:918765432109 917654321098"
            value={groupContactsInput}
            onChange={(e) => setGroupContactsInput(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#06141c] border border-slate-200 dark:border-[#1b3a4e] rounded-xl p-3 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
          />
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Separate names and numbers with colons (:). Separate contacts with commas or newlines.
          </p>
        </div>

        <button
          onClick={onSaveBroadcastGroup}
          className="w-full py-3 bg-[#10b981] hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md shadow-[#10b981]/20 transition-all active:scale-95 flex items-center justify-center gap-1.5"
        >
          <Save className="w-4 h-4" /> Save Group
        </button>
      </div>

      {/* Right: Saved Groups & Fetch Native Groups */}
      <div className="lg:col-span-6 space-y-4">
        <div className="glass-card p-5 rounded-2xl shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 dark:border-[#183647] pb-3 gap-2">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-500" /> Saved Groups ({savedGroupsList.length})
            </h3>
            <button
              onClick={onFetchNativeGroups}
              disabled={loadingNativeGroups}
              className="px-3.5 py-1.5 bg-[#10b981] hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-[#10b981]/20 transition-all active:scale-95 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingNativeGroups ? "animate-spin" : ""}`} /> Fetch Native Groups
            </button>
          </div>

          {/* Group Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search saved or native groups..."
              value={groupSearchQuery}
              onChange={(e) => setGroupSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#06141c] border border-slate-200 dark:border-[#1b3a4e] text-slate-900 dark:text-white placeholder:text-slate-400 text-xs rounded-xl pl-8 pr-7 py-2 focus:outline-none focus:border-emerald-500 font-medium transition-all"
            />
            {groupSearchQuery && (
              <button
                onClick={() => setGroupSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Saved Groups List */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {savedGroupsList.length === 0 ? (
              <div className="py-6 text-center text-slate-500 dark:text-slate-400 text-xs italic border border-dashed border-slate-200 dark:border-[#1b3a4e] rounded-xl p-4">
                No saved broadcast groups found. Create one on the left or save a fetched native group below.
              </div>
            ) : savedGroupsList.filter((g) => g.name.toLowerCase().includes(groupSearchQuery.toLowerCase())).length === 0 ? (
              <div className="py-4 text-center text-slate-400 text-xs italic">
                No saved groups matching &quot;{groupSearchQuery}&quot;
              </div>
            ) : (
              savedGroupsList
                .filter((g) => g.name.toLowerCase().includes(groupSearchQuery.toLowerCase()))
                .map((grp) => (
                  <div
                    key={grp.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-[#163546] bg-slate-50 dark:bg-[#06141c] flex flex-col sm:flex-row items-start sm:items-center justify-between hover:border-emerald-500/40 transition-all gap-2"
                  >
                    <div
                      className="min-w-0 flex-1 cursor-pointer"
                      onClick={() => onLoadGroupToForm(grp)}
                      title="Click to load into left form"
                    >
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">{grp.name}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">👥 {grp.count} Members • <span className="text-emerald-500 font-sans">Click to edit</span></p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                      <button
                        onClick={() => onSelectAndDispatch(grp.id)}
                        className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-lg transition-all flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" /> Select & Dispatch
                      </button>
                      <button
                        onClick={() => onExportGroup(grp.name, grp.contactsText)}
                        className="px-2 py-1 bg-slate-200 dark:bg-[#122836] hover:bg-slate-300 dark:hover:bg-[#183647] text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-all flex items-center gap-1"
                        title="Export CSV"
                      >
                        <Download className="w-3 h-3" /> Export
                      </button>
                      <button
                        onClick={() => onDeleteSavedGroup(grp.id)}
                        className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                        title="Delete Group"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>

          {/* Native Groups fetched */}
          {nativeGroups.length > 0 && (
            <div className="pt-3 border-t border-slate-200 dark:border-[#183647] space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Fetched WhatsApp Groups ({nativeGroups.length})
                </h4>
                <span className="text-[10px] text-slate-400">Click group or Save to load into form</span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {nativeGroups.filter((g) => g.subject.toLowerCase().includes(groupSearchQuery.toLowerCase())).length === 0 ? (
                  <div className="py-4 text-center text-slate-400 text-xs italic">
                    No fetched WhatsApp groups match &quot;{groupSearchQuery}&quot;
                  </div>
                ) : (
                  nativeGroups
                    .filter((g) => g.subject.toLowerCase().includes(groupSearchQuery.toLowerCase()))
                    .map((ng) => (
                      <div key={ng.id} className="p-2.5 rounded-xl border border-slate-200 dark:border-[#163546] bg-slate-100/70 dark:bg-[#081822] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                        <div
                          className="min-w-0 flex-1 cursor-pointer"
                          onClick={() => onLoadNativeGroupToForm(ng)}
                          title="Click to load into left form"
                        >
                          <h5 className="font-bold text-slate-900 dark:text-white truncate">{ng.subject}</h5>
                          <span className="text-[10px] text-emerald-500 font-mono font-bold">👥 {ng.count} Members • <span className="text-amber-500 font-sans">Click to load</span></span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                          <button
                            onClick={() => onLoadNativeGroupToForm(ng)}
                            className="px-2 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30 text-xs font-bold rounded-lg transition-all flex items-center gap-1"
                            title="Load name & contacts into left form"
                          >
                            Load to Form
                          </button>
                          <button
                            onClick={() => onSaveNativeGroup(ng)}
                            className="px-2.5 py-1 bg-[#10b981] hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1"
                          >
                            <Save className="w-3 h-3" /> Save Group
                          </button>
                          <button
                            onClick={() => {
                              const saved = onSaveNativeGroup(ng);
                              if (saved) onSelectAndDispatch(saved.id);
                            }}
                            className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-lg transition-all flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" /> Select & Dispatch
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
