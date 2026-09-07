"use client";

// ============================================================
// Log Detail Modal — Full Message Viewer Popup
// ============================================================

import { X, MessageSquare, Image as ImageIcon, Eye } from "lucide-react";
import type { CampaignLog } from "./types";

interface LogDetailModalProps {
  log: CampaignLog;
  onClose: () => void;
}

export function LogDetailModal({ log, onClose }: LogDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0b1d28] border border-slate-200 dark:border-[#1b3a4e] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-[#183647] bg-slate-50 dark:bg-[#06141c]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Sent WhatsApp Message</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Full message details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#122836] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Recipient & Meta Info Card */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-[#06141c] border border-slate-200 dark:border-[#183647]">
            <div>
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold">Receiver Phone</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{log.receiver}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold">Dispatch Time</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-mono text-slate-600 dark:text-slate-300">{log.time}</span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${
                    log.status === "SENT"
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                      : "bg-red-500/20 text-red-500 border border-red-500/30"
                  }`}
                >
                  {log.status === "SENT" ? "SENT 🟢" : "FAILED 🔴"}
                </span>
              </div>
            </div>
          </div>

          {/* Image Attachment Preview */}
          {(log.imageUrl || log.hasImage || log.message.startsWith("🖼️")) && (
            <div className="space-y-1.5">
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-500" /> Attached Image Media
              </p>
              <div className="p-3 rounded-xl border border-slate-200 dark:border-[#183647] bg-slate-50 dark:bg-[#06141c] flex items-center justify-center">
                {log.imageUrl ? (
                  <img
                    src={log.imageUrl}
                    alt="Sent Attachment"
                    className="max-h-56 rounded-lg object-contain border border-slate-200 dark:border-[#1b3a4e]"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium py-1">
                    <ImageIcon className="w-4 h-4 shrink-0" />
                    <span>Image attachment was included in this broadcast send</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Full Message Text */}
          <div className="space-y-1.5">
            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-500" /> Complete Message Content
            </p>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-[#183647] bg-slate-50 dark:bg-[#06141c] whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-900 dark:text-slate-100 max-h-64 overflow-y-auto font-medium">
              {(log.fullMessage && log.fullMessage.length > log.message.length)
                ? log.fullMessage
                : log.message.replace(/^🖼️\s*/, "")}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-200 dark:border-[#183647] bg-slate-50 dark:bg-[#06141c]">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-md"
          >
            Close View
          </button>
        </div>
      </div>
    </div>
  );
}
