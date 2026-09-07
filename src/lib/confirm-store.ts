import { create } from "zustand";

export type DialogType = "info" | "success" | "warning" | "danger";

export interface ConfirmOptions {
  title?: string;
  message: string;
  type?: DialogType;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export interface AlertOptions {
  title?: string;
  message: string;
  type?: DialogType;
  confirmText?: string;
  onConfirm?: () => void;
}

export interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  type: DialogType;
  confirmText: string;
  cancelText: string;
  showCancel: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;

  showConfirm: (options: ConfirmOptions) => void;
  showAlert: (options: AlertOptions) => void;
  close: () => void;
}

export const useConfirmStore = create<ConfirmState>((set) => ({
  isOpen: false,
  title: "",
  message: "",
  type: "info",
  confirmText: "Confirm",
  cancelText: "Cancel",
  showCancel: true,

  showConfirm: ({
    title = "Confirm Action",
    message,
    type = "warning",
    confirmText = "Yes, Proceed",
    cancelText = "Cancel",
    onConfirm,
    onCancel,
  }) => {
    set({
      isOpen: true,
      title,
      message,
      type,
      confirmText,
      cancelText,
      showCancel: true,
      onConfirm,
      onCancel,
    });
  },

  showAlert: ({
    title = "System Notification",
    message,
    type = "info",
    confirmText = "OK",
    onConfirm,
  }) => {
    set({
      isOpen: true,
      title,
      message,
      type,
      confirmText,
      cancelText: "",
      showCancel: false,
      onConfirm,
      onCancel: undefined,
    });
  },

  close: () => {
    set({ isOpen: false });
  },
}));
