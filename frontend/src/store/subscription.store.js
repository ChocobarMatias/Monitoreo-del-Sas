import { create } from "zustand";
import { api } from "../lib/axios";

export const useSubscriptionStore = create((set) => ({
  status: null,
  expiresAt: null,
  remainingDays: 0,

  fetchStatus: async () => {
    try {
      const { data } = await api.get("/subscriptions/status");
      set({
        status: data.status,
        expiresAt: data.expires_at,
        remainingDays: data.remaining_days,
      });
    } catch (err) {
      if (err?.response?.status === 401) return;
      set({ status: "never", expiresAt: null, remainingDays: 0 });
    }
  },

  reset: () => set({ status: null, expiresAt: null, remainingDays: 0 }),
}));
