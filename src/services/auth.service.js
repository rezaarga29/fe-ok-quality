// auth.service.js
import { useAuthStore } from "./authStore";

const API = import.meta.env.VITE_API_URL;

export async function getSession() {
  try {
    const resp = await fetch(`${API}/auth/session`, {
      credentials: "include",
      cache: "no-store",
    });

    if (!resp.ok) {
      useAuthStore.getState().clearUser();
      return { loggedIn: false, user: null };
    }

    const data = await resp.json();

    // Simpan di state management (memory)
    useAuthStore.getState().setUser(data);

    return {
      loggedIn:   true,
      user:       data.user,
      is_admin:   data.is_admin ?? false,
      expires_at: data.expires_at,
    };
  } catch {
    useAuthStore.getState().clearUser();
    return { loggedIn: false, user: null };
  }
}

export async function logout() {
  try {
    useAuthStore.getState().clearUser();
    window.location.href = `${API}/auth/logout`;
  } catch {
    console.error("Error logging out");
  }
}
