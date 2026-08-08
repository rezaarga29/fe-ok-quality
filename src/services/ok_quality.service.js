import axios from "./axiosInstance";

const BASE = "/ok-quality";
const cfg  = {};

// ── STATS ───────────────────────────────────────────────────────────────────
export async function getStats(params = {}) {
  const res = await axios.get(`${BASE}/stats`, { ...cfg, params });
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

// ── RIWAYAT OPERASI — semua penilaian dalam 1 No_Reg (untuk tab detail) ─────
export async function getRiwayat(no_reg) {
  const res = await axios.get(`${BASE}/riwayat/${no_reg}`, cfg);
  return res.data;
}

// ── AUTO-FILL dari tabel referensi ──────────────────────────────────────────
// no_jadwal opsional — 1 no_reg bisa punya >1 jadwal operasi,
// kirim no_jadwal agar Tindakan diambil dari jadwal yang tepat
export async function getAutoFill(no_reg, no_jadwal = null) {
  const params = no_jadwal ? { no_jadwal } : {};
  const res = await axios.get(`${BASE}/autofill/${no_reg}`, { ...cfg, params });
  return res.data;
}

// ── HASIL OPERASI (referensi read-only) ─────────────────────────────────────
export async function getHasilOperasi(no_jadwal) {
  const res = await axios.get(`${BASE}/hasil-operasi/${no_jadwal}`, cfg);
  return res.data;
}

// ── INFORMED CONSENT (referensi read-only) ──────────────────────────────────
export async function getInformedConsent(no_jadwal) {
  const res = await axios.get(`${BASE}/informed-consent/${no_jadwal}`, cfg);
  return res.data;
}

// Detail lengkap Informed Consent (isi tindakan, persetujuan/penolakan, TTD)
export async function getInformedConsentDetail(no_jadwal) {
  const res = await axios.get(`${BASE}/informed-consent/${no_jadwal}/detail`, cfg);
  return res.data;
}

// ── TIM MEDIS — anastesi, dokter operator, perawat (referensi read-only) ───
export async function getTimMedis(no_jadwal) {
  const res = await axios.get(`${BASE}/tim-medis/${no_jadwal}`, cfg);
  return res.data;
}

// ── REFERENSI TTV SEBELUM OP (read-only, dari ASESMEN_IGD + ASESMEN_TRANSFER_PASIEN) ──
// Kandidat Tanda-Tanda Vital untuk Tahap 1 — user pilih sendiri lewat modal
export async function getReferensiTTV(no_reg) {
  const res = await axios.get(`${BASE}/referensi-ttv/${no_reg}`, cfg);
  return res.data;
}

// ── KESIAPAN PINDAH RUANGAN (referensi read-only, dari ASESMEN_MONITORING_PASCA_BEDAH) ──
// Tabel ini tidak punya No_Jadwal — dicocokkan lewat No_Reg
export async function getKesiapanPindahRuangan(no_reg) {
  const res = await axios.get(`${BASE}/kesiapan-pindah/${no_reg}`, cfg);
  return res.data;
}

// ── STATUS LEMBAR TRANSFER (referensi read-only, dari ASESMEN_TRANSFER_PASIEN) ──
export async function getLembarTransferStatus(no_reg) {
  const res = await axios.get(`${BASE}/lembar-transfer/${no_reg}`, cfg);
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

