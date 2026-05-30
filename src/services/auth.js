const API = import.meta.env.VITE_API_URL;

// ===== start SSO login =====
export function startLogin(nextPath = "/home") {
  const url = new URL(`${API}/auth/login`);
  url.searchParams.set("next", nextPath.startsWith("/") ? nextPath : "/home");
  window.location.href = url.toString();
}

// ===== logout =====
export async function logout() {
  try {
    window.location.href = `${API}/auth/logout`;
  } catch {
    console.error("Error logging out");
  }
}
