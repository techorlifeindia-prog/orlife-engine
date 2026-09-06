"use client";

import { useState } from "react";
import { Instance } from "@/lib/api-client";
import {
  X,
  Send,
  CheckCircle2,
  XCircle,
  FlaskConical,
  Smartphone,
  Phone,
  MessageSquare,
  RefreshCw,
} from "lucide-react";

interface TestModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: Instance | null;
}

function formatWhatsAppNumber(raw: string): { clean: string; display: string; valid: boolean; warning: string } {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 0) return { clean: "", display: "", valid: false, warning: "" };
  if (digits.length === 10) {
    return { clean: "91" + digits, display: `+91 ${digits}`, valid: true, warning: "" };
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    const num = digits.slice(2);
    return { clean: digits, display: `+91 ${num}`, valid: true, warning: "" };
  }
  if (digits.length >= 11) {
    return { clean: digits, display: `+${digits}`, valid: true, warning: "" };
  }
  return {
    clean: digits,
    display: `+${digits}`,
    valid: false,
    warning: "⚠️ Country code chahiye — e.g. 919876543210 या 10 digit number",
  };
}

export function TestModal({ isOpen, onClose, device }: TestModalProps) {
  const [toNumber, setToNumber] = useState("");
  const [messageText, setMessageText] = useState(
    "Hello! This is a test message from OrLife Connect. ✅"
  );
  const [isSending, setIsSending] = useState(false);
  const [lastStatus, setLastStatus] = useState<{
    type: "SUCCESS" | "ERROR";
    text: string;
    id?: string;
  } | null>(null);

  if (!isOpen || !device) return null;

  const numInfo = formatWhatsAppNumber(toNumber);

  const handleSend = async () => {
    if (!device || !toNumber.trim() || !numInfo.valid || !messageText.trim()) return;

    setIsSending(true);
    setLastStatus(null);

    try {
      const res = await fetch("/api/evolution/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instanceName: device.instanceName,
          number: numInfo.clean,
          text: messageText,
        }),
      });

      const data = await res.json();

      if (data.status === "SENT") {
        setLastStatus({
          type: "SUCCESS",
          text: `Message successfully sent to ${numInfo.display}!`,
          id: data.key?.id,
        });
      } else {
        setLastStatus({
          type: "ERROR",
          text: data.error || "Failed to send message.",
        });
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Network error";
      setLastStatus({
        type: "ERROR",
        text: errorMessage,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Send Test Message</h3>
              <p className="text-xs text-muted-foreground">Quick message test</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Selected Device Badge */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500 shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">
                {device.profileName || device.owner || device.instanceName}
              </p>
              <p className="text-xs text-muted-foreground">
                {device.owner ? `+${device.owner.replace(/^\+/, "")}` : "Connected"}
              </p>
            </div>
            <span className="text-[11px] font-semibold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full shrink-0">
              ● Connected
            </span>
          </div>

          {/* To Number Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
              <Phone className="w-3.5 h-3.5 text-primary" />
              To WhatsApp Number
            </label>
            <input
              type="tel"
              placeholder="e.g. 9876543210 or 919876543210"
              value={toNumber}
              onChange={(e) => setToNumber(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                toNumber && !numInfo.valid
                  ? "border-red-500 ring-1 ring-red-500/30"
                  : toNumber && numInfo.valid
                  ? "border-green-500 ring-1 ring-green-500/30"
                  : "border-border"
              }`}
            />
            {toNumber && numInfo.valid && (
              <div className="flex items-center gap-1.5 text-xs text-green-500 font-medium bg-green-500/10 px-3 py-1.5 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Will send to: <span className="font-bold">{numInfo.display}</span>
              </div>
            )}
            {toNumber && !numInfo.valid && (
              <p className="text-xs text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-lg">
                {numInfo.warning}
              </p>
            )}
          </div>

          {/* Message Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
              <MessageSquare className="w-3.5 h-3.5 text-primary" />
              Message Text
            </label>
            <textarea
              rows={3}
              placeholder="Type test message here..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Live Status Result Alert */}
          {lastStatus && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                lastStatus.type === "SUCCESS"
                  ? "bg-green-500/10 border-green-500/30 text-green-500"
                  : "bg-red-500/10 border-red-500/30 text-red-500"
              }`}
            >
              {lastStatus.type === "SUCCESS" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-semibold">{lastStatus.text}</p>
                {lastStatus.id && (
                  <p className="font-mono text-[11px] opacity-80 mt-0.5">
                    Msg ID: {lastStatus.id}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/20">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleSend}
            disabled={
              isSending ||
              !toNumber.trim() ||
              !numInfo.valid ||
              !messageText.trim()
            }
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 py-2 rounded-xl text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Message
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
