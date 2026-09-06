import { create } from "zustand";

interface UIStore {
  isMobileSidebarOpen: boolean;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isMobileSidebarOpen: false,
  toggleMobileSidebar: () => set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),
  closeMobileSidebar: () => set({ isMobileSidebarOpen: false }),
}));
