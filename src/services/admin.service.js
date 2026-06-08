import axios from "./axiosInstance";

const BASE = "/admin";

export async function getAccessLogs({ date, page = 1, limit = 50 } = {}) {
  const res = await axios.get(`${BASE}/logs/access`, {
    params: { ...(date && { date }), page, limit },
  });
  return res.data;
}

export async function getErrorLogs({ date, page = 1, limit = 50 } = {}) {
  const res = await axios.get(`${BASE}/logs/error`, {
    params: { ...(date && { date }), page, limit },
  });
  return res.data;
}
