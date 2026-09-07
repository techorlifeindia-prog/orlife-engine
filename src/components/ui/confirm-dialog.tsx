"use client";

import { useConfirmStore } from "@/lib/confirm-store";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  AlertCircle,
  X,
  ShieldAlert,
} from "lucide-react";

export function ConfirmDialog() {
  const {
    isOpen,
    title,
    message,
    type,
    confirmText,
    cancelText,
    showCancel,
    onConfirm,
    onCancel,
    close,
  } = useConfirmStore();

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    close();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    close();
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return (
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        );
      case "warning":
        return (
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
        );
      case "danger":
        return (
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
        );
      case "info":
      default:
        return (
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <Info className="w-6 h-6" />
          </div>
        );
    }
  };

  const getConfirmButtonStyles = () => {
    switch (type) {
      case "danger":
        return "bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-bold shadow-rose-500/20";
      case "warning":
        return "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold shadow-amber-500/20";
      case "success":
      case "info":
      default:
        return "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold shadow-emerald-500/20";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0b1d28] border border-slate-200 dark:border-[#1b3a4e] text-slate-900 dark:text-slate-100 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4 animate-in zoom-in-95 duration-150">
        
        {/* Close Cross Button */}
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content Header & Body */}
        <div className="flex items-start gap-4">
          {getIcon()}
          <div className="space-y-1 pr-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {title}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-[#183647]">
          {showCancel && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-[#06141c] hover:bg-slate-200 dark:hover:bg-[#183647] border border-slate-200 dark:border-[#1b3a4e] transition-colors"
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            onClick={handleConfirm}
            className={`px-5 py-2 rounded-xl text-xs transition-all shadow-md active:scale-95 ${getConfirmButtonStyles()}`}
          >
            {confirmText}
          </button>
        </div>

      </div>
    </div>
  );
}
