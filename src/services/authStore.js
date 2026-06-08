// authStore.js (pakai Zustand)
import { create } from "zustand";

export const useAuthStore = create((set) => ({
  user: null,
  loggedIn: false,
  expires_at: null,

  setUser: (userData) =>
    set({
      user: userData.user,
      loggedIn: true,
      expires_at: userData.expires_at,
    }),

  clearUser: () =>
    set({
      user: null,
      loggedIn: false,
      expires_at: null,
    }),
}));
