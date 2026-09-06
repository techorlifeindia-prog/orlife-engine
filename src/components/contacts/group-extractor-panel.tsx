"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, RefreshCw, Download, Users, Smartphone, CheckCircle2, Search, X, ChevronDown, Send } from "lucide-react";
import { fetchInstances, Instance } from "@/lib/api-client";
import { Contact } from "./contact-table";
import { formatPhoneNumber } from "@/lib/phone-utils";
import { useRouter } from "next/navigation";
import { getFilteredInstancesForUser } from "@/lib/user-session-utils";

interface WhatsAppParticipant {
  id: string;
  jid?: string;
  admin?: string | null;
  notify?: string;
  name?: string;
  pushName?: string;
}

interface WhatsAppGroup {
  id: string;
  subject: string;
  size: number;
  participants: WhatsAppParticipant[];
}

interface GroupExtractorPanelProps {
  onExtractContacts: (contacts: Contact[]) => void;
}

export function GroupExtractorPanel({ onExtractContacts }: GroupExtractorPanelProps) {
  const router = useRouter();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
  const [groupSearchQuery, setGroupSearchQuery] = useState("");
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [extractingGroupId, setExtractingGroupId] = useState<string | null>(null);
  const [extractedSuccessMsg, setExtractedSuccessMsg] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadInstances() {
      const rawList = await fetchInstances();
      const list = getFilteredInstancesForUser(rawList);
      setInstances(list);
      if (list.length > 0) {
        const active = list.find((i) => i.status === "open") || list[0];
        setSelectedInstance(active.instanceName);
      }
    }
    loadInstances();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedDevice = instances.find((i) => i.instanceName === selectedInstance);
  const selectedOwnerNum = selectedDevice?.owner
    ? formatPhoneNumber(selectedDevice.owner)
    : selectedDevice?.instanceName
    ? formatPhoneNumber(selectedDevice.instanceName)
    : "No Device";
  const selectedProfileName = selectedDevice?.profileName || selectedDevice?.instanceName || "Connected Account";
  const isConnected = selectedDevice?.status === "open";

  // Load cached groups on mount or when selectedInstance changes
  useEffect(() => {
    const cacheKey = selectedInstance ? `whatsapp_groups_${selectedInstance}` : "whatsapp_cached_groups";
    const cached = localStorage.getItem(cacheKey) || localStorage.getItem("whatsapp_cached_groups");
    if (!cached) return;
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setGroups(parsed);
      }
    } catch (e) {
      console.error("Error loading cached groups:", e);
    }
  }, [selectedInstance]);

  const handleFetchGroups = async () => {
    if (!selectedInstance) return;
    setLoadingGroups(true);
    setExtractedSuccessMsg(null);
    try {
      const res = await fetch(`/api/evolution/groups?instanceName=${encodeURIComponent(selectedInstance)}`);
      const data = await res.json();
      const groupList = Array.isArray(data) ? data : [];
      setGroups(groupList);

      if (groupList.length > 0) {
        localStorage.setItem("whatsapp_cached_groups", JSON.stringify(groupList));
        localStorage.setItem(`whatsapp_groups_${selectedInstance}`, JSON.stringify(groupList));
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
    setLoadingGroups(false);
  };

  const getExtractedContactsFromGroup = (group: WhatsAppGroup): Contact[] => {
    return group.participants.map((p: WhatsAppParticipant, idx: number) => {
      const realJid = p.jid || (p.id && !p.id.endsWith("@lid") ? p.id : "") || p.id;
      const phoneFormatted = formatPhoneNumber(realJid);
      const pushName = p.notify || p.name || p.pushName;
      const contactName = pushName && pushName.trim() ? pushName.trim() : `Member ${idx + 1}`;

      return {
        id: `ext_${Date.now()}_${idx}`,
        name: contactName,
        phone: phoneFormatted,
        tag: `Group: ${group.subject.substring(0, 12)}`,
        notes: `Extracted from WhatsApp group "${group.subject}"`,
        createdAt: new Date().toISOString().split("T")[0],
      };
    });
  };

  const handleExtractGroupMembers = (group: WhatsAppGroup) => {
    setExtractingGroupId(group.id);
    setExtractedSuccessMsg(null);

    const extractedContacts = getExtractedContactsFromGroup(group);

    setTimeout(() => {
      onExtractContacts(extractedContacts);
      setExtractingGroupId(null);
      setExtractedSuccessMsg(`Extracted ${extractedContacts.length} numbers from "${group.subject}"!`);
      setTimeout(() => setExtractedSuccessMsg(null), 4000);
    }, 400);
  };

  const handleSaveAndBroadcastGroup = (group: WhatsAppGroup) => {
    setExtractingGroupId(group.id);

    const extractedContacts = getExtractedContactsFromGroup(group);
    onExtractContacts(extractedContacts);

    // Prepare draft for Broadcast Campaign
    const recipientsText = extractedContacts.map((c) => `${c.name}, ${c.phone}`).join("\n");
    localStorage.setItem("broadcast_draft_recipients", recipientsText);
    localStorage.setItem("broadcast_draft_name", `Broadcast - ${group.subject}`);

    setTimeout(() => {
      router.push("/campaigns");
    }, 300);
  };

  const filteredGroups = groups.filter((g) =>
    g.subject.toLowerCase().includes(groupSearchQuery.toLowerCase())
  );

  return (
    <div className="bg-[#0b1d28] border border-[#1b3a4e] rounded-2xl p-4 shadow-lg space-y-3.5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#183647] pb-3">
        <div className="min-w-0 pr-2">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5 truncate">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            WhatsApp Group Extractor
          </h3>
          <p className="text-slate-400 text-[11px] mt-0.5 truncate">
            Extract & broadcast messages to group members directly.
          </p>
        </div>
        <span className="text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold shrink-0">
          {filteredGroups.length} / {groups.length} Groups
        </span>
      </div>

      {/* Device Selector & Fetch Action */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> Connected WhatsApp Account
          </label>
        </div>

        <div className="flex items-center gap-2 w-full min-w-0">
          {/* Custom Interactive Dropdown: Closed = Mobile Number Only; Opened = Name + Number */}
          <div className="relative flex-1 min-w-0" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              title={`${selectedProfileName} (${selectedOwnerNum})`}
              className="w-full bg-[#06141c] text-slate-100 border border-[#1b3a4e] text-xs rounded-xl px-2.5 py-2 flex items-center justify-between font-semibold hover:border-emerald-500/60 focus:outline-none transition-all cursor-pointer truncate gap-1"
            >
              <div className="flex items-center gap-1.5 truncate min-w-0">
                <span className="font-mono text-slate-100 text-xs font-bold truncate">
                  {selectedDevice ? selectedOwnerNum : "No Account Connected"}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isConnected ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-400"}`}>
                  {isConnected ? "● Online" : "○ Offline"}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? "rotate-180 text-emerald-400" : ""}`} />
              </div>
            </button>

            {/* Mouse Click Floating Options Menu (Shows Name + Mobile Number) */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[#0a1822] border border-[#1b3a4e] rounded-xl shadow-2xl py-1 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-slate-400 font-bold border-b border-[#163244] mb-1">
                  Connected Accounts (Click to Select)
                </div>
                {instances.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-slate-400 italic">No WhatsApp accounts connected</div>
                ) : (
                  instances.map((inst) => {
                    const instOwner = inst.owner ? formatPhoneNumber(inst.owner) : inst.instanceName;
                    const instName = inst.profileName || inst.instanceName;
                    const instConnected = inst.status === "open";
                    const isSelected = inst.instanceName === selectedInstance;

                    return (
                      <button
                        key={inst.instanceName}
                        type="button"
                        onClick={() => {
                          setSelectedInstance(inst.instanceName);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                          isSelected
                            ? "bg-emerald-500/15 text-emerald-300 font-bold border-l-2 border-emerald-400"
                            : "hover:bg-[#122836] text-slate-200"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-bold truncate text-slate-100 text-xs">{instName}</div>
                          <div className="text-[11px] text-emerald-400/90 font-mono flex items-center gap-1 mt-0.5">
                            <Smartphone className="w-3 h-3 text-slate-400" /> {instOwner}
                          </div>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${instConnected ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"}`}>
                          {instConnected ? "Connected" : "Offline"}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleFetchGroups}
            disabled={loadingGroups}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-md shadow-emerald-500/20 active:scale-95 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingGroups ? "animate-spin" : ""}`} /> Fetch Groups
          </button>
        </div>
      </div>

      {/* Group Search Box (Active when groups loaded) */}
      {groups.length > 0 && (
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search groups..."
            value={groupSearchQuery}
            onChange={(e) => setGroupSearchQuery(e.target.value)}
            className="w-full bg-[#06141c] border border-[#1b3a4e] text-slate-100 placeholder:text-slate-500 text-xs rounded-xl pl-8 pr-7 py-2 focus:outline-none focus:border-emerald-500 font-medium transition-all"
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
      )}

      {/* Feedback Alert */}
      {extractedSuccessMsg && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs p-2.5 rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="truncate">{extractedSuccessMsg}</span>
        </div>
      )}

      {/* Groups List */}
      <div className="flex-1 overflow-y-auto max-h-[460px] space-y-2 pr-1 scrollbar-thin">
        {loadingGroups ? (
          <div className="py-10 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-400 mx-auto mb-2" />
            <p className="text-xs font-medium">Fetching joined groups...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="py-8 text-center text-slate-400 border border-dashed border-[#1b3a4e] rounded-xl bg-[#06141c]/50 p-5">
            <Users className="w-7 h-7 text-slate-500 mx-auto mb-2 opacity-60" />
            <p className="font-semibold text-slate-300 text-xs">No groups loaded.</p>
            <p className="text-slate-500 text-[11px] mt-1">
              Click <span className="font-bold text-emerald-400">"Fetch Groups"</span> above.
            </p>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">
            No matching groups found
          </div>
        ) : (
          filteredGroups.map((group) => (
            <div
              key={group.id}
              className="p-2.5 rounded-xl border border-[#163546] bg-[#06141c] flex items-center justify-between hover:border-emerald-500/40 transition-all group gap-1.5"
            >
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-xs text-slate-100 group-hover:text-emerald-300 transition-colors truncate">
                  {group.subject}
                </h4>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                  <Users className="w-3 h-3 text-slate-500 shrink-0" /> {group.participants.length} Members
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleExtractGroupMembers(group)}
                  disabled={extractingGroupId === group.id}
                  title="Extract contacts to table"
                  className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 shrink-0"
                >
                  {extractingGroupId === group.id ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <>
                      <Download className="w-3 h-3" /> Extract
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleSaveAndBroadcastGroup(group)}
                  disabled={extractingGroupId === group.id}
                  title="Save & launch broadcast message to group"
                  className="bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 shrink-0"
                >
                  <Send className="w-3 h-3" /> Broadcast
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

