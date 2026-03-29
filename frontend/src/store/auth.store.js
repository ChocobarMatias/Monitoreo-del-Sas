import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "../lib/axios";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isBooting: true,
      isLoggingIn: false,

      setBooting: (value) => set({ isBooting: value }),

      login: async ({ email, password }) => {
        set({ isLoggingIn: true });
        try {
          const { data } = await api.post("/auth/login", { email, password });
          set({
            user: data.user,
            accessToken: data.accessToken,
            isLoggingIn: false
          });
          return { ok: true };
        } catch (error) {
          set({ isLoggingIn: false });
          return {
            ok: false,
            message: error.response?.data?.message || "No se pudo iniciar sesión"
          };
        }
      },

      loadMe: async () => {
        const token = get().accessToken;
        if (!token) {
          set({ isBooting: false });
          return;
        }

        try {
          const { data } = await api.get("/users/me");
          set({ user: data.user, isBooting: false });
        } catch {
          set({ user: null, accessToken: null, isBooting: false });
        }
      },

      logout: () => set({ user: null, accessToken: null, isBooting: false })
    }),
    {
      name: "guard-auth"
    }
  )
);