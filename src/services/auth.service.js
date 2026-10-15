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
      loggedIn:       true,
      user:           data.user,
      is_admin:       data.is_admin       ?? false,
      is_doctor:      data.is_doctor      ?? false,
      can_kesimpulan: data.can_kesimpulan ?? false,
      can_notes:      data.can_notes      ?? false,
      is_staff_ranap: data.is_staff_ranap ?? false, // role staff-ranap saja (hanya isi luka ranap)
      can_luka_ranap: data.can_luka_ranap ?? false, // boleh isi Kondisi Luka di Ranap
      has_staff_ranap: data.has_staff_ranap ?? false, // punya role staff-ranap (tombol Edit disembunyikan)
      expires_at:     data.expires_at,
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
