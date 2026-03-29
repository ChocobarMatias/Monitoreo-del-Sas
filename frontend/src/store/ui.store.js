import { create } from "zustand";

export const useUIStore = create((set) => ({
  pinValidatedAt: null,
  setPinValidatedAt: () => set({ pinValidatedAt: Date.now() }),
  clearPinValidatedAt: () => set({ pinValidatedAt: null })
}));
