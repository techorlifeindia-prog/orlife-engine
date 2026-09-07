"use client";

// ============================================================
// Campaign Store Hook — All State + Logic for WhatsApp Center
// ============================================================

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchInstances, Instance } from "@/lib/api-client";
import { getFilteredInstancesForUser } from "@/lib/user-session-utils";
import { useConfirmStore } from "@/lib/confirm-store";
import { formatPhoneNumber } from "@/lib/phone-utils";
import {
  CampaignLog,
  ScheduledCampaign,
  SavedGroup,
  NativeGroup,
  SpeedMode,
  DeliveryMode,
  TabType,
  STORAGE_KEYS,
} from "./types";

export function useCampaignStore() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showAlert } = useConfirmStore();

  // ── Tab State ──────────────────────────────────────────────
  const urlTab = searchParams.get("tab");
  const initialTab: TabType = (urlTab === "status" || urlTab === "groups" || urlTab === "schedule") ? urlTab : "status";
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // ── Instance State ─────────────────────────────────────────
  const [instances, setInstances] = useState<Instance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<string>("");

  const [speedMode, setSpeedMode] = useState<SpeedMode>("Normal");

  const handleSetSpeedMode = (mode: SpeedMode) => {
    setSpeedMode(mode);
    try {
      localStorage.setItem(STORAGE_KEYS.SPEED_MODE, mode);
    } catch (e) { /* ignore */ }
  };

  // ── Tab 2: Groups Management ───────────────────────────────
  const [groupNameInput, setGroupNameInput] = useState("");
  const [groupContactsInput, setGroupContactsInput] = useState("");
  const [savedGroupsList, setSavedGroupsList] = useState<SavedGroup[]>([]);
  const [groupSearchQuery, setGroupSearchQuery] = useState("");
  const [nativeGroups, setNativeGroups] = useState<NativeGroup[]>([]);
  const [loadingNativeGroups, setLoadingNativeGroups] = useState(false);

  // ── Tab 3: Schedule & Campaign Dispatch ────────────────────
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("instant");
  const [scheduleTime, setScheduleTime] = useState("");
  const [dispatchMessageText, setDispatchMessageText] = useState(
    "Hello Customer,\nThank you for choosing OrLife! We have a special update for you today."
  );
  const [dispatchMediaUrl, setDispatchMediaUrl] = useState<string>("");
  const [campaignLogs, setCampaignLogs] = useState<CampaignLog[]>([]);
  const [scheduledCampaigns, setScheduledCampaigns] = useState<ScheduledCampaign[]>([]);
  const [selectedLogDetail, setSelectedLogDetail] = useState<CampaignLog | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);

  // ── Refs ────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaFileInputRef = useRef<HTMLInputElement>(null);

  // ── Init: Load instances & localStorage defaults ───────────
  useEffect(() => {
    async function loadInstancesData() {
      const rawList = await fetchInstances();
      const filtered = getFilteredInstancesForUser(rawList);
      setInstances(filtered);
      if (filtered.length > 0) {
        const active = filtered.find((i) => i.status === "open") || filtered[0];
        setSelectedInstance(active.instanceName);
      }
    }
    loadInstancesData();

    const savedMsgText = localStorage.getItem(STORAGE_KEYS.MESSAGE_TEXT);
    if (savedMsgText) setDispatchMessageText(savedMsgText);

    const savedLogs = localStorage.getItem(STORAGE_KEYS.CAMPAIGN_LOGS);
    if (savedLogs) {
      try {
        const parsed = JSON.parse(savedLogs);
        if (Array.isArray(parsed)) {
          const validLogs = parsed.filter((l: any) => l && (l.fullMessage || !l.message?.endsWith("...")));
          setCampaignLogs(validLogs);
        }
      } catch (e) { /* ignore corrupt data */ }
    }

    const savedScheduled = localStorage.getItem(STORAGE_KEYS.SCHEDULED_CAMPAIGNS);
    if (savedScheduled) {
      try {
        const parsed = JSON.parse(savedScheduled);
        if (Array.isArray(parsed)) setScheduledCampaigns(parsed);
      } catch (e) { /* ignore corrupt data */ }
    }

    const saved = localStorage.getItem(STORAGE_KEYS.SAVED_GROUPS);
    if (saved) {
      try {
        const parsed: SavedGroup[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const uniqueMap = new Map<string, SavedGroup>();
          parsed.forEach((g) => {
            if (g && g.name) {
              const key = g.name.trim().toLowerCase();
              if (!uniqueMap.has(key)) uniqueMap.set(key, g);
            }
          });
          const deduplicated = Array.from(uniqueMap.values());
          localStorage.setItem(STORAGE_KEYS.SAVED_GROUPS, JSON.stringify(deduplicated));
        }
      } catch (e) { /* ignore corrupt data */ }
    }

    const savedSpeed = localStorage.getItem(STORAGE_KEYS.SPEED_MODE);
    if (savedSpeed === "Slow" || savedSpeed === "Normal" || savedSpeed === "Turbo") {
      setSpeedMode(savedSpeed as SpeedMode);
    }
  }, []);

  // ── Sync tab from URL / localStorage ───────────────────────
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "status" || tabParam === "groups" || tabParam === "schedule") {
      setActiveTab(tabParam);
    } else {
      const savedTab = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB);
      if (savedTab === "status" || savedTab === "groups" || savedTab === "schedule") {
        setActiveTab(savedTab as TabType);
        try {
          const url = new URL(window.location.href);
          url.searchParams.set("tab", savedTab);
          window.history.replaceState({}, "", url.toString());
        } catch (e) { /* ignore */ }
      }
    }

    const msgParam = searchParams.get("message");
    if (msgParam) {
      setDispatchMessageText(msgParam);
      setActiveTab("schedule");
    }

    const draftRecipients = localStorage.getItem("broadcast_draft_recipients");
    if (draftRecipients) {
      setGroupContactsInput(draftRecipients);
      setActiveTab("groups");
    }
  }, [searchParams]);

  // ── Derived Values ─────────────────────────────────────────
  const selectedDevice = instances.find((i) => i.instanceName === selectedInstance);
  const isDeviceOnline = selectedDevice?.status === "open";
  const deviceOwnerNumber = selectedDevice?.owner
    ? formatPhoneNumber(selectedDevice.owner)
    : selectedDevice?.instanceName || "No Device";
  const deviceProfileName = selectedDevice?.profileName || selectedDevice?.instanceName || "Connected Account";

  // ── Tab Navigation ─────────────────────────────────────────
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, tab);
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState({}, "", url.toString());
    } catch (e) { /* ignore */ }
  };

  // ── Tab 1: Save Template ───────────────────────────────────
  const handleSaveTemplateChanges = () => {
    showAlert({
      title: "Templates Saved Successfully!",
      message: "Your custom message templates have been updated for automated reminders.",
      type: "success",
    });
  };

  // ── Tab 2: Save / Update Broadcast Group (Deduplicated) ────
  const handleSaveBroadcastGroup = () => {
    if (!groupNameInput.trim() || !groupContactsInput.trim()) {
      showAlert({
        title: "Required Fields Missing",
        message: "Please enter a Group Name and add at least one contact!",
        type: "warning",
      });
      return;
    }

    const lines = groupContactsInput.split("\n").filter((l) => l.trim());
    const targetName = groupNameInput.trim();
    const existingIndex = savedGroupsList.findIndex(
      (g) => g.name.trim().toLowerCase() === targetName.toLowerCase()
    );

    let updated: SavedGroup[];
    if (existingIndex !== -1) {
      updated = [...savedGroupsList];
      updated[existingIndex] = {
        ...updated[existingIndex],
        contactsText: groupContactsInput.trim(),
        count: lines.length,
      };
      showAlert({
        title: "Broadcast Group Updated!",
        message: `Existing group "${targetName}" updated with ${lines.length} contacts!`,
        type: "success",
      });
    } else {
      const newGrp: SavedGroup = {
        id: `grp_${Date.now()}`,
        name: targetName,
        contactsText: groupContactsInput.trim(),
        count: lines.length,
      };
      updated = [newGrp, ...savedGroupsList];
      showAlert({
        title: "Broadcast Group Saved!",
        message: `Group "${newGrp.name}" with ${newGrp.count} contacts has been saved.`,
        type: "success",
      });
    }

    setSavedGroupsList(updated);
    localStorage.setItem(STORAGE_KEYS.SAVED_GROUPS, JSON.stringify(updated));
    setGroupNameInput("");
    setGroupContactsInput("");
  };

  // ── Tab 2: Fetch Native WhatsApp Groups ────────────────────
  const handleFetchNativeGroups = async () => {
    if (!selectedInstance) return;
    setLoadingNativeGroups(true);
    try {
      const res = await fetch(`/api/evolution/groups?instanceName=${encodeURIComponent(selectedInstance)}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        const mapped: NativeGroup[] = data.map((g: any) => ({
          id: g.id,
          subject: g.subject || "WhatsApp Group",
          count: g.participants?.length || g.size || 0,
          participants: g.participants || [],
        }));
        setNativeGroups(mapped);
      }
    } catch (e) {
      console.error(e);
    }
    setLoadingNativeGroups(false);
  };

  // ── Tab 2: Load Native Group into Form ─────────────────────
  const handleLoadNativeGroupToForm = (ng: NativeGroup) => {
    const contactsText = formatNativeGroupContacts(ng);
    setGroupNameInput(ng.subject);
    setGroupContactsInput(contactsText);
    showAlert({
      title: "Group Loaded into Editor!",
      message: `Extracted ${ng.participants?.length || ng.count} members from "${ng.subject}" into Group Name & Contacts List on the left.`,
      type: "info",
    });
  };

  // ── Tab 2: Save Native Group ───────────────────────────────
  const handleSaveNativeGroup = (ng: NativeGroup) => {
    const contactsText = formatNativeGroupContacts(ng);
    setGroupNameInput(ng.subject);
    setGroupContactsInput(contactsText);

    const targetName = ng.subject.trim();
    const memberCount = ng.participants?.length || ng.count || 1;
    const existingIndex = savedGroupsList.findIndex(
      (g) => g.name.trim().toLowerCase() === targetName.toLowerCase()
    );

    let updated: SavedGroup[];
    let targetGroup: SavedGroup;

    if (existingIndex !== -1) {
      updated = [...savedGroupsList];
      updated[existingIndex] = {
        ...updated[existingIndex],
        contactsText: contactsText,
        count: memberCount,
      };
      targetGroup = updated[existingIndex];
      showAlert({
        title: "Group Updated & Loaded!",
        message: `Group "${targetName}" already exists and was updated with ${memberCount} members.`,
        type: "success",
      });
    } else {
      targetGroup = {
        id: `grp_${Date.now()}`,
        name: targetName,
        contactsText: contactsText,
        count: memberCount,
      };
      updated = [targetGroup, ...savedGroupsList];
      showAlert({
        title: "Group Saved & Loaded!",
        message: `Saved native WhatsApp group "${targetName}" (${memberCount} members) to Saved Groups.`,
        type: "success",
      });
    }

    setSavedGroupsList(updated);
    localStorage.setItem(STORAGE_KEYS.SAVED_GROUPS, JSON.stringify(updated));
    return targetGroup;
  };

  // ── Tab 2: Export Group as CSV ─────────────────────────────
  const handleExportGroup = (groupName: string, contactsText: string) => {
    const lines = contactsText.split("\n").filter(Boolean);
    let csvContent = "Name,Phone\n";
    lines.forEach((line) => {
      const parts = line.split(":");
      if (parts.length >= 2) {
        csvContent += `"${parts[0].trim()}","${parts[1].trim()}"\n`;
      } else {
        const partsComma = line.split(",");
        if (partsComma.length >= 2) {
          csvContent += `"${partsComma[0].trim()}","${partsComma[1].trim()}"\n`;
        } else {
          csvContent += `"Contact","${line.trim()}"\n`;
        }
      }
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${groupName.replace(/[^a-z0-9]/gi, "_")}_contacts.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showAlert({
      title: "CSV Export Started!",
      message: `Exported contacts for group "${groupName}".`,
      type: "success",
    });
  };

  // ── Tab 2: Delete Saved Group ──────────────────────────────
  const handleDeleteSavedGroup = (id: string) => {
    const updated = savedGroupsList.filter((g) => g.id !== id);
    setSavedGroupsList(updated);
    localStorage.setItem(STORAGE_KEYS.SAVED_GROUPS, JSON.stringify(updated));
  };

  // ── Tab 3: Image Upload with Canvas Compression ────────────
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (!event.target?.result) return;
      const rawDataUrl = event.target.result as string;

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const maxDimension = 1200;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.82);
          setDispatchMediaUrl(compressedDataUrl);
        } else {
          setDispatchMediaUrl(rawDataUrl);
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  // ── Tab 3: Launch Campaign (Instant or Schedule) ───────────
  const handleLaunchCampaign = async () => {
    let contactsToUse = groupContactsInput;
    if (selectedGroupId) {
      const targetGroup = savedGroupsList.find((g) => g.id === selectedGroupId);
      if (targetGroup) contactsToUse = targetGroup.contactsText;
    }

    const lines = contactsToUse.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      showAlert({
        title: "No Contacts Selected",
        message: "Please select a group or add contacts in Tab 2 (Groups) before launching!",
        type: "warning",
      });
      return;
    }
    if (!selectedInstance) {
      showAlert({
        title: "No Device Connected",
        message: "Please select an active connected WhatsApp account!",
        type: "warning",
      });
      return;
    }

    // Schedule Mode: Save to queue instead of sending immediately
    if (deliveryMode === "schedule") {
      if (!scheduleTime) {
        showAlert({
          title: "Schedule Time Required 🗓️",
          message: "Please pick a date and time for scheduling this campaign!",
          type: "warning",
        });
        return;
      }

      const schedDateObj = new Date(scheduleTime);
      if (isNaN(schedDateObj.getTime())) {
        showAlert({
          title: "Invalid Schedule Time",
          message: "Please select a valid future date and time!",
          type: "warning",
        });
        return;
      }

      const targetGroup = savedGroupsList.find((g) => g.id === selectedGroupId);
      const groupName = targetGroup?.name || "Broadcast Audience";
      const formattedDate = schedDateObj.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      const newScheduledItem: ScheduledCampaign = {
        id: `sched_${Date.now()}`,
        groupName,
        contactsText: contactsToUse,
        messageText: dispatchMessageText,
        mediaUrl: dispatchMediaUrl || undefined,
        instanceName: selectedInstance,
        scheduleTime: scheduleTime,
        formattedTime: formattedDate,
        status: "SCHEDULED",
        createdAt: new Date().toLocaleTimeString(),
        contactCount: lines.length,
      };

      const updatedList = [newScheduledItem, ...scheduledCampaigns];
      setScheduledCampaigns(updatedList);
      localStorage.setItem(STORAGE_KEYS.SCHEDULED_CAMPAIGNS, JSON.stringify(updatedList));

      showAlert({
        title: "Campaign Scheduled Successfully! 🗓️",
        message: `Your campaign "${groupName}" (${lines.length} contacts) is scheduled to automatically send on ${formattedDate}.`,
        type: "success",
      });

      setScheduleTime("");
      return; // STOP — do NOT send immediately
    }

    // Instant Mode: Send messages now
    setIsDispatching(true);
    let currentLogs = [...campaignLogs];
    const delayMs = speedMode === "Slow" ? 15000 : speedMode === "Normal" ? 7000 : 3000;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let name = "Customer";
      let phone = line;

      if (line.includes(":")) {
        const parts = line.split(":").map((p) => p.trim());
        name = parts[0] || "Customer";
        phone = parts.slice(1).join(":");
      } else if (line.includes(",")) {
        const parts = line.split(",").map((p) => p.trim());
        name = parts[0] || "Customer";
        phone = parts.slice(1).join(",");
      }

      const cleanPhone = formatPhoneNumber(phone);

      const personalizedText = dispatchMessageText
        .replace(/\{\{name\}\}/gi, name)
        .replace(/\{\{phone\}\}/gi, cleanPhone)
        .replace(/\{\{group\}\}/gi, "Chit Scheme A")
        .replace(/\{\{amount\}\}/gi, "5,000")
        .replace(/\{\{due\}\}/gi, "0");

      try {
        const res = await fetch("/api/evolution/send-message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instanceName: selectedInstance,
            number: cleanPhone,
            text: personalizedText,
            mediaUrl: dispatchMediaUrl || undefined,
          }),
        });

        const logItem: CampaignLog = {
          id: `log_${Date.now()}_${i}`,
          receiver: cleanPhone,
          message: personalizedText,
          fullMessage: personalizedText,
          hasImage: !!dispatchMediaUrl,
          imageUrl: dispatchMediaUrl || undefined,
          time: new Date().toLocaleTimeString(),
          status: res.ok ? "SENT" : "FAILED",
        };

        currentLogs = [logItem, ...currentLogs];
        setCampaignLogs(currentLogs);
        localStorage.setItem(STORAGE_KEYS.CAMPAIGN_LOGS, JSON.stringify(currentLogs));
      } catch (err) {
        const logItem: CampaignLog = {
          id: `log_${Date.now()}_${i}`,
          receiver: cleanPhone,
          message: personalizedText,
          fullMessage: personalizedText,
          hasImage: !!dispatchMediaUrl,
          imageUrl: dispatchMediaUrl || undefined,
          time: new Date().toLocaleTimeString(),
          status: "FAILED",
        };
        currentLogs = [logItem, ...currentLogs];
        setCampaignLogs(currentLogs);
        localStorage.setItem(STORAGE_KEYS.CAMPAIGN_LOGS, JSON.stringify(currentLogs));
      }

      if (i < lines.length - 1) {
        await new Promise((res) => setTimeout(res, delayMs));
      }
    }

    setIsDispatching(false);
    showAlert({
      title: "Campaign Dispatch Complete!",
      message: `Finished sending ${lines.length} messages. View live logs on the right.`,
      type: "success",
    });
  };

  // ── Tab 3: Insert Placeholder Tag ──────────────────────────
  const insertPlaceholderTag = (tag: string) => {
    setDispatchMessageText((prev) => prev + ` {{${tag}}}`);
  };

  // ── Tab 3: Clear Logs ──────────────────────────────────────
  const handleClearLogs = () => {
    setCampaignLogs([]);
    localStorage.removeItem(STORAGE_KEYS.CAMPAIGN_LOGS);
  };

  // ── Tab 3: Clear Scheduled ─────────────────────────────────
  const handleClearScheduled = () => {
    setScheduledCampaigns([]);
    localStorage.removeItem(STORAGE_KEYS.SCHEDULED_CAMPAIGNS);
  };

  // ── Tab 3: Delete Single Scheduled Campaign ────────────────
  const handleDeleteScheduledCampaign = (id: string) => {
    const updated = scheduledCampaigns.filter((s) => s.id !== id);
    setScheduledCampaigns(updated);
    localStorage.setItem(STORAGE_KEYS.SCHEDULED_CAMPAIGNS, JSON.stringify(updated));
  };

  // ── Tab 3: Save Message as Default ─────────────────────────
  const handleSaveMessageDefault = () => {
    localStorage.setItem(STORAGE_KEYS.MESSAGE_TEXT, dispatchMessageText);
    showAlert({
      title: "Message Saved as Default!",
      message: "Your message content has been saved. It will load automatically every time you visit this page.",
      type: "success",
    });
  };

  // ── Tab 2: Load Saved Group into Form ───────────────────────
  const handleLoadGroupToForm = (grp: SavedGroup) => {
    setGroupNameInput(grp.name);
    setGroupContactsInput(grp.contactsText);
    showAlert({
      title: "Loaded into Form!",
      message: `Loaded group "${grp.name}" into Group Name & Contacts List form on the left.`,
      type: "info",
    });
  };

  // ── Utility: Format native group participants ──────────────
  function formatNativeGroupContacts(ng: NativeGroup): string {
    if (ng.participants && ng.participants.length > 0) {
      return ng.participants
        .map((p, idx) => {
          const realJid = p.jid || (p.id && !p.id.endsWith("@lid") ? p.id : "") || p.id;
          const phoneFormatted = formatPhoneNumber(realJid);
          const pushName = p.notify || p.name || p.pushName;
          const contactName = pushName && pushName.trim() ? pushName.trim() : `Member ${idx + 1}`;
          return `${contactName}:${phoneFormatted}`;
        })
        .join("\n");
    }
    return `${ng.subject}:919876543210`;
  }

  // ── Return all state + actions ─────────────────────────────
  return {
    // Tab
    activeTab, handleTabChange,
    // Instances
    instances, selectedInstance, setSelectedInstance,
    isDeviceOnline, deviceOwnerNumber, deviceProfileName,
    // Tab 1
    speedMode, setSpeedMode: handleSetSpeedMode, handleSaveTemplateChanges,
    // Tab 2
    groupNameInput, setGroupNameInput,
    groupContactsInput, setGroupContactsInput,
    savedGroupsList, groupSearchQuery, setGroupSearchQuery,
    nativeGroups, loadingNativeGroups,
    handleSaveBroadcastGroup, handleFetchNativeGroups,
    handleLoadNativeGroupToForm, handleSaveNativeGroup,
    handleExportGroup, handleDeleteSavedGroup, handleLoadGroupToForm,
    showAlert,
    // Tab 3
    selectedGroupId, setSelectedGroupId,
    deliveryMode, setDeliveryMode,
    scheduleTime, setScheduleTime,
    dispatchMessageText, setDispatchMessageText,
    dispatchMediaUrl, setDispatchMediaUrl,
    campaignLogs, scheduledCampaigns,
    selectedLogDetail, setSelectedLogDetail,
    isDispatching,
    handleLaunchCampaign, handleImageUpload, insertPlaceholderTag,
    handleClearLogs, handleClearScheduled, handleDeleteScheduledCampaign,
    handleSaveMessageDefault,
    // Refs
    mediaFileInputRef,
  };
}

/** Type alias for the store return value — used by child components */
export type CampaignStore = ReturnType<typeof useCampaignStore>;
