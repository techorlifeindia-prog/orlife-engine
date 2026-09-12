// ============================================================
// Shared Types & Constants for Campaign Module
// ============================================================

export interface CampaignLog {
  id: string;
  receiver: string;
  message: string;
  fullMessage?: string;
  hasImage?: boolean;
  imageUrl?: string;
  time: string;
  status: "SENT" | "PENDING" | "FAILED";
}

export interface ScheduledCampaign {
  id: string;
  groupName: string;
  contactsText: string;
  messageText: string;
  mediaUrl?: string;
  instanceName: string;
  scheduleTime: string;
  formattedTime: string;
  status: "SCHEDULED" | "PROCESSING" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  contactCount: number;
}

export interface SavedGroup {
  id: string;
  name: string;
  contactsText: string;
  count: number;
}

export interface WhatsAppParticipant {
  id: string;
  jid?: string;
  notify?: string;
  name?: string;
  pushName?: string;
}

export interface NativeGroup {
  id: string;
  subject: string;
  count: number;
  participants?: WhatsAppParticipant[];
}

export type SpeedMode = "Slow" | "Normal" | "Turbo";
export type DeliveryMode = "instant" | "schedule";
export type TabType = "status" | "groups" | "schedule";

/** Centralized localStorage keys — single source of truth */
export const STORAGE_KEYS = {
  MESSAGE_TEXT: "orlife_dispatch_message_text",
  CAMPAIGN_LOGS: "orlife_live_campaign_logs",
  SCHEDULED_CAMPAIGNS: "orlife_scheduled_campaigns_list",
  SAVED_GROUPS: "orlife_saved_broadcast_groups",
  ACTIVE_TAB: "orlife_campaigns_active_tab",
  SPEED_MODE: "orlife_campaigns_speed_mode",
  DRAFT_GROUP_NAME: "orlife_draft_group_name",
  DRAFT_GROUP_CONTACTS: "orlife_draft_group_contacts",
  SELECTED_GROUP_ID: "orlife_selected_group_id",
  SELECTED_INSTANCE: "orlife_selected_instance_name",
} as const;
