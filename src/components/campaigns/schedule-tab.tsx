"use client";

// ============================================================
// Tab 3: Schedule & Campaign Dispatch + Logs + Scheduled Queue
// ============================================================

import { useRef } from "react";
import {
  Send, Play, RefreshCw, Calendar, Save, Zap, Clock, Trash2, Eye,
  ShieldCheck, Image as ImageIcon, X, MessageSquare,
} from "lucide-react";
import type { CampaignLog, ScheduledCampaign, SavedGroup, DeliveryMode } from "./types";
import { LogDetailModal } from "./log-detail-modal";
import { STORAGE_KEYS } from "./types";

interface ScheduleTabProps {
  // Group selection
  savedGroupsList: SavedGroup[];
  selectedGroupId: string;
  setSelectedGroupId: (v: string) => void;
  // Delivery mode
  deliveryMode: DeliveryMode;
  setDeliveryMode: (v: DeliveryMode) => void;
  scheduleTime: string;
  setScheduleTime: (v: string) => void;
  // Message content
  dispatchMessageText: string;
  setDispatchMessageText: (v: string) => void;
  dispatchMediaUrl: string;
  setDispatchMediaUrl: (v: string) => void;
  // Campaign state
  campaignLogs: CampaignLog[];
  scheduledCampaigns: ScheduledCampaign[];
  selectedLogDetail: CampaignLog | null;
  setSelectedLogDetail: (v: CampaignLog | null) => void;
  isDispatching: boolean;
  // Actions
  onLaunchCampaign: () => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearLogs: () => void;
  onClearScheduled: () => void;
  onDeleteScheduledCampaign: (id: string) => void;
  onSaveMessageDefault: () => void;
  // Refs
  mediaFileInputRef: React.RefObject<HTMLInputElement | null>;
}

export function ScheduleTab({
  savedGroupsList, selectedGroupId, setSelectedGroupId,
  deliveryMode, setDeliveryMode, scheduleTime, setScheduleTime,
  dispatchMessageText, setDispatchMessageText,
  dispatchMediaUrl, setDispatchMediaUrl,
  campaignLogs, scheduledCampaigns,
  selectedLogDetail, setSelectedLogDetail,
  isDispatching,
  onLaunchCampaign, onImageUpload,
  onClearLogs, onClearScheduled, onDeleteScheduledCampaign,
  onSaveMessageDefault,
  mediaFileInputRef,
}: ScheduleTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start animate-in fade-in duration-200">
      {/* ── Left: Schedule Campaign Form ─────────────────────── */}
      <div className="lg:col-span-6 glass-card p-5 rounded-2xl shadow-lg space-y-4">
        <div className="border-b border-slate-200 dark:border-[#183647] pb-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-500" /> Schedule Campaign
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Schedule campaign messages to be automatically sent.
          </p>
        </div>

        {/* Group Selector */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Select Broadcast Group</label>
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#06141c] border border-slate-200 dark:border-[#1b3a4e] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="">Select a group...</option>
            {savedGroupsList.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.count} Members)
              </option>
            ))}
          </select>
        </div>

        {/* Delivery Schedule Mode Toggle */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Delivery Schedule Mode</label>
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#06141c] p-1.5 rounded-xl border border-slate-200 dark:border-[#163546] w-fit">
            <button
              onClick={() => setDeliveryMode("instant")}
              className={`px-4 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1 transition-all ${
                deliveryMode === "instant" ? "bg-[#10b981] text-slate-950 shadow-sm" : "text-slate-500 dark:text-slate-400"
              }`}
            >
              <Zap className="w-3.5 h-3.5" /> Send Instantly
            </button>
            <button
              onClick={() => setDeliveryMode("schedule")}
              className={`px-4 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1 transition-all ${
                deliveryMode === "schedule" ? "bg-[#10b981] text-slate-950 shadow-sm" : "text-slate-500 dark:text-slate-400"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" /> Schedule for Later
            </button>
          </div>
        </div>

        {deliveryMode === "schedule" && (
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Pick Date & Time</label>
            <input
              type="datetime-local"
              value={scheduleTime}
              onChange={(e) => {
                setScheduleTime(e.target.value);
                if (e.target.value) e.target.blur();
              }}
              className="w-full bg-slate-50 dark:bg-[#06141c] border border-slate-200 dark:border-[#1b3a4e] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500 cursor-pointer"
            />
          </div>
        )}

        {/* Message Content & Image Attachment */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Message Content</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onSaveMessageDefault}
                className="text-[11px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all"
                title="Save message as default for future use"
              >
                <Save className="w-3 h-3" /> Save Message
              </button>
              <button
                type="button"
                onClick={() => mediaFileInputRef.current?.click()}
                className="text-[11px] bg-slate-100 dark:bg-[#06141c] hover:bg-slate-200 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-[#1b3a4e] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all"
              >
                <ImageIcon className="w-3 h-3" /> Attach Image
              </button>
              <input type="file" ref={mediaFileInputRef} onChange={onImageUpload} accept="image/*" className="hidden" />
            </div>
          </div>

          <textarea
            rows={5}
            value={dispatchMessageText}
            onChange={(e) => {
              const val = e.target.value;
              setDispatchMessageText(val);
              localStorage.setItem(STORAGE_KEYS.MESSAGE_TEXT, val);
            }}
            placeholder="Type your message here..."
            className="w-full bg-slate-50 dark:bg-[#06141c] border border-slate-200 dark:border-[#1b3a4e] rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 resize-none font-sans leading-relaxed"
          />

          {dispatchMediaUrl && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 dark:bg-[#081b26] flex items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative group shrink-0">
                  <img
                    src={dispatchMediaUrl}
                    alt="Campaign Media Attachment"
                    className="w-14 h-14 object-cover rounded-xl border border-emerald-500/50 shadow-md transition-transform duration-200 group-hover:scale-105"
                  />
                  <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 text-[9px] font-extrabold px-1 rounded shadow">
                    IMG
                  </span>
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Image Attachment Ready</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
                    Will be sent with broadcast message to WhatsApp
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => mediaFileInputRef.current?.click()}
                  className="px-2.5 py-1 bg-slate-200 dark:bg-[#122836] hover:bg-slate-300 dark:hover:bg-[#183647] text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-all"
                  title="Change Image"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={() => setDispatchMediaUrl("")}
                  className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                  title="Remove Image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onLaunchCampaign}
          disabled={isDispatching}
          className="w-full py-3 bg-[#10b981] hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md shadow-[#10b981]/20 transition-all active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          {isDispatching ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" /> Dispatching Messages...
            </>
          ) : deliveryMode === "schedule" ? (
            <>
              <Calendar className="w-4 h-4 fill-current" /> Schedule Campaign Now
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" /> Send Campaign Now
            </>
          )}
        </button>
      </div>

      {/* ── Right: Live Campaigns Logs Table ─────────────────── */}
      <div className="lg:col-span-6 glass-card p-5 rounded-2xl shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#183647] pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Live Campaigns Logs
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Click any message row to view full SMS content 👁️
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onClearLogs}
              className="px-2.5 py-1 bg-slate-100 dark:bg-[#06141c] hover:bg-slate-200 text-slate-600 dark:text-slate-400 text-xs font-semibold rounded-lg border border-slate-200 dark:border-[#163546]"
            >
              Clear Logs
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#183647] text-slate-500 dark:text-slate-400 font-mono uppercase text-[10px]">
                <th className="py-2 px-2">Receiver</th>
                <th className="py-2 px-2">Message</th>
                <th className="py-2 px-2">Time</th>
                <th className="py-2 px-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#163546]">
              {campaignLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-400 dark:text-slate-500 text-xs italic">
                    No campaigns scheduled or dispatched yet.
                  </td>
                </tr>
              ) : (
                campaignLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLogDetail(log)}
                    className="hover:bg-emerald-500/10 dark:hover:bg-[#122836] cursor-pointer transition-colors group"
                    title="Click to view full message details"
                  >
                    <td className="py-2.5 px-2 font-bold text-slate-900 dark:text-white truncate max-w-[120px]">
                      {log.receiver}
                    </td>
                    <td className="py-2.5 px-2 text-slate-600 dark:text-slate-300 max-w-[150px]">
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate flex items-center gap-1">
                          {(log.hasImage || log.imageUrl || log.message.startsWith("🖼️")) && <span className="shrink-0">🖼️</span>}
                          <span className="truncate">{log.fullMessage || log.message.replace(/^🖼️\s*/, "")}</span>
                        </span>
                        <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 shrink-0 transition-colors" />
                      </div>
                    </td>
                    <td className="py-2.5 px-2 font-mono text-slate-500 text-[11px]">{log.time}</td>
                    <td className="py-2.5 px-2 text-right">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${
                          log.status === "SENT"
                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                            : "bg-red-500/20 text-red-500 border border-red-500/30"
                        }`}
                      >
                        {log.status === "SENT" ? "SENT 🟢" : "FAILED 🔴"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Bottom: Scheduled Campaigns Queue ────────────────── */}
      <div className="lg:col-span-12 glass-card p-5 rounded-2xl shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#183647] pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-500" /> Scheduled Campaigns Queue
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Campaigns scheduled to automatically send at a future date & time
            </p>
          </div>
          {scheduledCampaigns.length > 0 && (
            <button
              onClick={onClearScheduled}
              className="px-2.5 py-1 bg-slate-100 dark:bg-[#06141c] hover:bg-slate-200 text-slate-600 dark:text-slate-400 text-xs font-semibold rounded-lg border border-slate-200 dark:border-[#163546]"
            >
              Clear Scheduled
            </button>
          )}
        </div>

        {scheduledCampaigns.length === 0 ? (
          <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs italic">
            No campaigns scheduled yet. Select &quot;Schedule for Later&quot; above to schedule a campaign for future delivery.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {scheduledCampaigns.map((sc) => (
              <div
                key={sc.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-[#183647] bg-slate-50 dark:bg-[#06141c] space-y-2.5 relative group"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate max-w-[180px]">
                    {sc.groupName}
                  </h4>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${
                      sc.status === "SCHEDULED"
                        ? "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                        : sc.status === "PROCESSING"
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    }`}
                  >
                    {sc.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" /> {sc.formattedTime}
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {sc.contactCount} Contacts
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate bg-slate-100 dark:bg-[#0b1d28] p-2 rounded-lg border border-slate-200 dark:border-[#163546]">
                  {sc.mediaUrl ? "🖼️ " : ""}{sc.messageText}
                </p>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => onDeleteScheduledCampaign(sc.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-200 dark:hover:bg-[#122836] transition-colors"
                    title="Delete Schedule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Log Detail Modal ─────────────────────────────────── */}
      {selectedLogDetail && (
        <LogDetailModal
          log={selectedLogDetail}
          onClose={() => setSelectedLogDetail(null)}
        />
      )}
    </div>
  );
}
