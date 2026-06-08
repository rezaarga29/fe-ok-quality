const API = import.meta.env.VITE_API_URL;

async function checkSession() {
  try {
    const r = await fetch(`${API}/auth/session`, {
      credentials: "include",
      cache: "no-store",
    });

    if (r.status === 401) return null;
    if (!r.ok) return null;

    return await r.json();
  } catch {
    return null;
  }
}

export default checkSession;
