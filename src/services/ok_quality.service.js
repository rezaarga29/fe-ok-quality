import axios from "./axiosInstance";

const BASE = "/ok-quality";
const cfg  = {};

// ── STATS ───────────────────────────────────────────────────────────────────
export async function getStats() {
  const res = await axios.get(`${BASE}/stats`, cfg);
  return res.data;
}

// ── LIST ────────────────────────────────────────────────────────────────────
export async function getAll(params = {}) {
  const res = await axios.get(BASE, { ...cfg, params });
  return res.data;
}

// ── DETAIL ──────────────────────────────────────────────────────────────────
export async function getById(id) {
  const res = await axios.get(`${BASE}/${id}`, cfg);
  return res.data;
}

// ── JADWAL OPERASI ──────────────────────────────────────────────────────────
export async function getJadwal(params = {}) {
  const res = await axios.get(`${BASE}/jadwal`, { ...cfg, params });
  return res.data;
}

// ── AUTO-FILL dari tabel referensi ──────────────────────────────────────────
export async function getAutoFill(no_reg) {
  const res = await axios.get(`${BASE}/autofill/${no_reg}`, cfg);
  return res.data;
}

// ── CREATE ──────────────────────────────────────────────────────────────────
export async function create(data) {
  const res = await axios.post(BASE, data, cfg);
  return res.data;
}

// ── UPDATE SATU TAHAP ───────────────────────────────────────────────────────
export async function updateTahap(id, tahap, data) {
  const res = await axios.patch(`${BASE}/${id}/tahap`, { tahap, ...data }, cfg);
  return res.data;
}

// ── UPDATE FULL ─────────────────────────────────────────────────────────────
export async function update(id, data) {
  const res = await axios.put(`${BASE}/${id}`, data, cfg);
  return res.data;
}

// ── DELETE ──────────────────────────────────────────────────────────────────
export async function destroy(id) {
  const res = await axios.delete(`${BASE}/${id}`, cfg);
  return res.data;
}

// ── KESIMPULAN ───────────────────────────────────────────────────────────────
export async function getKesimpulan(id) {
  const res = await axios.get(`${BASE}/${id}/kesimpulan`, cfg);
  return res.data;
}

export async function createKesimpulan(id, data) {
  const res = await axios.post(`${BASE}/${id}/kesimpulan`, data, cfg);
  return res.data;
}

export async function updateKesimpulan(id, data) {
  const res = await axios.put(`${BASE}/${id}/kesimpulan`, data, cfg);
  return res.data;
}
