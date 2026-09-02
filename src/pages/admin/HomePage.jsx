import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sun, Sunrise, Moon, Eye, Pencil, Plus, RefreshCw,
  ClipboardList, CheckCircle2, Clock, AlertCircle, Loader2,
  Search, Filter, X, CalendarDays, ClipboardCheck, Timer,
  ChevronLeft, ChevronRight, ThumbsUp, ThumbsDown,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getAll, getStats } from "../../services/ok_quality.service";
import KesimpulanModal from "../ok-quality/KesimpulanModal";

// ── Pagination ────────────────────────────────────────────────────────────────
function Pagination({ pagination, limit = 20, onPage }) {
  const { page, totalPages, total } = pagination;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to   = Math.min(page * limit, total);

  const delta = 2;
  const pages = [];
  for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
    pages.push(i);
  }

  if (totalPages <= 1) return (
    <p className="text-xs text-gray-400 text-center mt-2">
      Menampilkan {total} data
    </p>
  );

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 px-1">
      <p className="text-xs text-gray-500 order-2 sm:order-1">
        Menampilkan <strong className="text-gray-700">{from}–{to}</strong> dari <strong className="text-gray-700">{total}</strong> data
      </p>
      <div className="flex items-center gap-1 order-1 sm:order-2">
        <button
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Prev
        </button>

        {pages[0] > 1 && (
          <>
            <button onClick={() => onPage(1)} className="w-8 h-8 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">1</button>
            {pages[0] > 2 && <span className="text-gray-400 text-xs px-1">…</span>}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`w-8 h-8 text-xs rounded-lg border font-semibold transition-colors ${
              p === page
                ? "bg-[#2d6a4f] border-[#2d6a4f] text-white"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {p}
          </button>
        ))}

        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && <span className="text-gray-400 text-xs px-1">…</span>}
            <button onClick={() => onPage(totalPages)} className="w-8 h-8 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">{totalPages}</button>
          </>
        )}

        <button
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Greeting ─────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return { text: "Selamat Pagi",  icon: <Sunrise className="w-5 h-5 text-amber-400" /> };
  if (h >= 12 && h < 15) return { text: "Selamat Siang", icon: <Sun     className="w-5 h-5 text-orange-400" /> };
  if (h >= 15 && h < 19) return { text: "Selamat Sore",  icon: <Sun     className="w-5 h-5 text-orange-300" /> };
  return                        { text: "Selamat Malam", icon: <Moon    className="w-5 h-5 text-indigo-400" /> };
}

// ── Journey stepper ───────────────────────────────────────────────────────────
const TAHAP_STEPS = ["Sebelum OP", "Waktu OP", "Sesudah OP"];

function JourneySteps({ tahap = 0, status }) {
  const done = status === "selesai" ? 3 : tahap;
  return (
    <div className="flex items-center gap-0 w-full mt-3">
      {TAHAP_STEPS.map((label, i) => {
        const stepNum  = i + 1;
        const finished = done >= stepNum;
        const active   = done === stepNum - 1 && done < 3;
        const isLast   = i === TAHAP_STEPS.length - 1;
        return (
          <div key={label} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                ${finished ? "bg-emerald-500 border-emerald-500 text-white"
                  : active  ? "bg-amber-400 border-amber-400 text-white"
                  : "bg-white border-gray-200 text-gray-300"}`}
              >
                {finished ? <CheckCircle2 className="w-3.5 h-3.5" /> : stepNum}
              </div>
              <span className={`text-[10px] mt-1 font-medium text-center leading-tight whitespace-nowrap
                ${finished ? "text-emerald-600" : active ? "text-amber-500" : "text-gray-400"}`}>
                {label}
              </span>
            </div>
            {!isLast && (
              <div className={`flex-1 h-0.5 mx-1 mb-4 rounded-full transition-all
                ${done > stepNum ? "bg-emerald-400" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ tahap = 0, status }) {
  if (status === "selesai") return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
      <CheckCircle2 className="w-3 h-3" /> Selesai
    </span>
  );
  if (tahap === 0) return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
      <AlertCircle className="w-3 h-3" /> Belum Mulai
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
      <Clock className="w-3 h-3" /> Tahap {tahap}/3
    </span>
  );
}

// ── Kesimpulan badge ──────────────────────────────────────────────────────────
const KESIMPULAN_STYLE = {
  "Dubia":         "bg-amber-100   text-amber-700",
  "Bonam / Sanam": "bg-emerald-100 text-emerald-700",
  "Malam":         "bg-red-100     text-red-700",
};

function KesimpulanBadge({ penilaian }) {
  if (!penilaian) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${KESIMPULAN_STYLE[penilaian] ?? "bg-gray-100 text-gray-500"}`}>
      <ClipboardCheck className="w-3 h-3" />
      {penilaian}
    </span>
  );
}

// ── Format durasi menit → "X jam Y mnt" ──────────────────────────────────────
function fmtDurasi(menit) {
  const m = parseFloat(menit);
  if (!m || isNaN(m)) return null;
  const jam  = Math.floor(m / 60);
  const sisa = Math.round(m % 60);
  if (jam === 0) return `${sisa} mnt`;
  if (sisa === 0) return `${jam} jam`;
  return `${jam} jam ${sisa} mnt`;
}

// ── Patient card ──────────────────────────────────────────────────────────────
function PatientCard({ row, onView, onEdit, onKesimpulan, canKesimpulan }) {
  const nama     = row.Nama_Pasien ?? "-";
  const initials = nama.split(" ").slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase() || "?";
  const tanggal  = row.Tanggal
    ? new Date(row.Tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
    : "-";

  const durasi = fmtDurasi(row.Durasi);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-[#2d6a4f] to-[#40916c] flex items-center justify-center text-white font-bold text-sm">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm truncate">{nama}</p>
          <p className="text-[11px] text-gray-400 font-mono">{row.No_Reg} · {row.No_MR ?? "-"}</p>
          {row.No_Jadwal && (
            <p className="text-[10px] text-emerald-700 font-mono mt-0.5">Jadwal: {row.No_Jadwal}</p>
          )}
        </div>
        <StatusBadge tahap={row.Tahap_Selesai} status={row.Status} />
      </div>

      <JourneySteps tahap={row.Tahap_Selesai} status={row.Status} />

      {/* Kesimpulan badge — hanya tampil jika sudah ada kesimpulan */}
      {row.Kesimpulan_Penilaian && (
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100">
          <ClipboardCheck className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="text-[11px] text-gray-500 flex-1">Kesimpulan</span>
          <KesimpulanBadge penilaian={row.Kesimpulan_Penilaian} />
        </div>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-gray-50">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-gray-400">{tanggal}</span>
          {durasi && (
            <span className="flex items-center gap-1 text-[11px] text-gray-500">
              <Timer className="w-3 h-3 shrink-0 text-[#2d6a4f]" />
              <span>
                Durasi Operasi: <strong className="text-[#2d6a4f]">{durasi}</strong>
              </span>
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <button onClick={() => onView(row.Id)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors" title="Lihat detail">
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onEdit(row.Id)}
            disabled={!!row.Kesimpulan_Penilaian}
            className={`p-1.5 rounded-lg transition-colors ${
              row.Kesimpulan_Penilaian
                ? "text-gray-200 cursor-not-allowed"
                : "text-gray-400 hover:bg-[#2d6a4f]/10 hover:text-[#2d6a4f]"
            }`}
            title={row.Kesimpulan_Penilaian ? "Sudah ada kesimpulan, tidak dapat diedit" : "Edit"}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          {row.Status === "selesai" && canKesimpulan && (
            <button
              onClick={() => onKesimpulan(row)}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
              title="Kesimpulan"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border p-4 flex items-center gap-3 w-full text-left transition-all
        ${active ? "ring-2 ring-[#2d6a4f] ring-offset-1" : "hover:shadow-sm"}
        ${color}`}
    >
      <div className="w-9 h-9 shrink-0 rounded-xl bg-white shadow-sm flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-extrabold text-gray-800 leading-none">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </button>
  );
}

// ── Filter pill ───────────────────────────────────────────────────────────────
function FilterPill({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-[#2d6a4f]/10 text-[#2d6a4f]">
      {label}
      <button onClick={onRemove} className="hover:text-red-500 transition-colors">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

// ── TAHAP labels ──────────────────────────────────────────────────────────────
const TAHAP_FILTER_OPTIONS = [
  { value: "0", label: "Tahap 0 — Belum Mulai" },
  { value: "1", label: "Tahap 1 — Sebelum OP" },
  { value: "2", label: "Tahap 2 — Waktu OP" },
  { value: "3", label: "Tahap 3 — Sesudah OP" },
];

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function HomePage() {
  const navigate = useNavigate();
  const { user, canKesimpulan, loading: authLoading } = useAuth();
  const greeting = getGreeting();

  const [data,            setData]            = useState([]);
  const [stats,           setStats]           = useState({ total: 0, selesai: 0, inProgress: 0, kesimpulanDubia: 0, kesimpulanBonamSanam: 0, kesimpulanMalam: 0 });
  const [loading,         setLoading]         = useState(true);
  const [refreshing,      setRefreshing]      = useState(false);
  const [showFilters,     setShowFilters]     = useState(false);
  const [pagination,      setPagination]      = useState({ page: 1, totalPages: 1, total: 0 });
  const [kesimpulanModal, setKesimpulanModal] = useState(null); // { id, nama, noReg }

  // ── Default filter: 3 bulan terakhir ────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  const threeMonthsAgo = (() => {
    const d = new Date(); d.setMonth(d.getMonth() - 3); return d.toISOString().slice(0, 10);
  })();

  // ── Restore filter dari sessionStorage (persist antar navigasi) ────────────
  const FILTER_KEY = "beranda_filters";
  const savedFilters = (() => {
    try { return JSON.parse(sessionStorage.getItem(FILTER_KEY)) || {}; } catch { return {}; }
  })();

  const [searchInput,     setSearchInput]     = useState(savedFilters.searchInput     ?? "");
  const [activeSearch,    setActiveSearch]     = useState(savedFilters.activeSearch    ?? "");
  const [statusFilter,    setStatusFilter]     = useState(savedFilters.statusFilter    ?? "");
  const [tahapFilter,     setTahapFilter]      = useState(savedFilters.tahapFilter     ?? "");
  const [penilaianFilter, setPenilaianFilter]  = useState(savedFilters.penilaianFilter ?? "");
  const [tanggalDari,     setTanggalDari]      = useState(savedFilters.tanggalDari     ?? threeMonthsAgo);
  const [tanggalSampai,   setTanggalSampai]    = useState(savedFilters.tanggalSampai   ?? today);

  // ── Simpan filter ke sessionStorage setiap kali berubah ──────────────────
  useEffect(() => {
    sessionStorage.setItem(FILTER_KEY, JSON.stringify({
      searchInput, activeSearch, statusFilter, tahapFilter,
      penilaianFilter, tanggalDari, tanggalSampai,
    }));
  }, [searchInput, activeSearch, statusFilter, tahapFilter, penilaianFilter, tanggalDari, tanggalSampai]);

  // ── Bangun filter params (dipakai bersama fetchData & fetchStats) ──────────
  const buildFilterParams = useCallback(() => ({
    ...(activeSearch       && { search: activeSearch }),
    ...(statusFilter       && { status: statusFilter }),
    ...(tahapFilter !== "" && { tahap: tahapFilter }),
    ...(penilaianFilter    && { penilaian: penilaianFilter }),
    ...(tanggalDari        && { tanggal_dari: tanggalDari }),
    ...(tanggalSampai      && { tanggal_sampai: tanggalSampai }),
  }), [activeSearch, statusFilter, tahapFilter, penilaianFilter, tanggalDari, tanggalSampai]);

  // ── Fetch stats — mengikuti filter aktif ─────────────────────────────────
  const fetchStats = useCallback(async (filterParams = {}) => {
    try {
      const res = await getStats(filterParams);
      const d   = res.data || {};
      setStats({
        total:                d.total                    || 0,
        selesai:              d.selesai                  || 0,
        inProgress:           d.in_progress              || 0,
        kesimpulanDubia:      d.kesimpulan_dubia         || 0,
        kesimpulanBonamSanam: d.kesimpulan_bonam_sanam   || 0,
        kesimpulanMalam:      d.kesimpulan_malam         || 0,
      });
    } catch {
      // silent
    }
  }, []);

  // ── Fetch data (terpengaruh filter & pagination) ──────────────────────────
  const fetchData = useCallback(async (opts = {}) => {
    const isRefresh = opts.refresh ?? false;
    const page      = opts.page ?? 1;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    const filterParams = buildFilterParams();
    try {
      const [listRes] = await Promise.all([
        getAll({ page, limit: 20, ...filterParams }),
        fetchStats(filterParams),
      ]);
      setData(listRes.data || []);
      setPagination(listRes.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [buildFilterParams, fetchStats]);

  // Jalankan saat filter berubah
  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSearch = (e) => {
    e.preventDefault();
    setActiveSearch(searchInput.trim());
  };

  const handleStatClick = (status) => {
    setStatusFilter((prev) => prev === status ? "" : status);
    setTahapFilter("");
  };

  const resetFilters = () => {
    setSearchInput(""); setActiveSearch("");
    setStatusFilter(""); setTahapFilter("");
    setPenilaianFilter("");
    setTanggalDari(threeMonthsAgo); setTanggalSampai(today);
  };

  const hasActiveFilter = activeSearch || statusFilter || tahapFilter !== "" || penilaianFilter || tanggalDari || tanggalSampai;

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-57px)] lg:min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#2d6a4f]/20 border-t-[#2d6a4f] animate-spin" />
      </div>
    );
  }

  const displayName = user?.name ?? user?.email ?? "Pengguna";
  const initials    = displayName.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  return (
    <div className="min-h-[calc(100vh-57px)] lg:min-h-screen p-4 sm:p-6 lg:p-8 space-y-5">

      {/* ── Welcome hero ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#40916c] px-6 py-5 shadow-lg">
        <div className="absolute top-[-30px] right-[-30px] w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 shrink-0 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white font-extrabold text-lg">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              {greeting.icon}
              <span className="text-white/70 text-xs font-medium">{greeting.text}</span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-white truncate">{displayName}</h1>
          </div>
          <button
            onClick={() => fetchData({ refresh: true })}
            disabled={refreshing}
            className="ml-auto p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── Stat cards (klikable jadi filter, mengikuti filter aktif) ──────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Penilaian"  value={stats.total}                color="bg-white border-gray-100"         icon={<ClipboardList  className="w-4 h-4 text-[#2d6a4f]"   />} active={!statusFilter && !penilaianFilter}              onClick={resetFilters} />
        <StatCard label="Selesai"          value={stats.selesai}              color="bg-emerald-50 border-emerald-100" icon={<CheckCircle2   className="w-4 h-4 text-emerald-500" />} active={statusFilter === "selesai"}                    onClick={() => handleStatClick("selesai")} />
        <StatCard label="Sedang Berjalan"  value={stats.inProgress}           color="bg-amber-50 border-amber-100"     icon={<Clock          className="w-4 h-4 text-amber-500"   />} active={statusFilter === "draft"}                      onClick={() => { setStatusFilter("draft"); setTahapFilter(""); setPenilaianFilter(""); setActiveSearch(""); setSearchInput(""); }} />
        <StatCard label="Dubia"            value={stats.kesimpulanDubia}      color="bg-amber-50 border-amber-100"     icon={<ThumbsUp       className="w-4 h-4 text-amber-500"   />} active={penilaianFilter === "Dubia"}                   onClick={() => { setPenilaianFilter((p) => p === "Dubia" ? "" : "Dubia"); setStatusFilter(""); }} />
        <StatCard label="Bonam / Sanam"    value={stats.kesimpulanBonamSanam} color="bg-teal-50 border-teal-100"       icon={<ThumbsUp       className="w-4 h-4 text-teal-500"    />} active={penilaianFilter === "Bonam / Sanam"}           onClick={() => { setPenilaianFilter((p) => p === "Bonam / Sanam" ? "" : "Bonam / Sanam"); setStatusFilter(""); }} />
        <StatCard label="Malam"            value={stats.kesimpulanMalam}      color="bg-red-50 border-red-100"         icon={<ThumbsDown     className="w-4 h-4 text-red-400"     />} active={penilaianFilter === "Malam"}                   onClick={() => { setPenilaianFilter((p) => p === "Malam" ? "" : "Malam"); setStatusFilter(""); }} />
      </div>

      {/* ── Cards section ────────────────────────────────────────────────── */}
      <div>
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-gray-800">Perjalanan Operasi Pasien</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {pagination.total} data{hasActiveFilter ? " (terfilter)" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors
                ${showFilters || hasActiveFilter
                  ? "bg-[#2d6a4f] border-[#2d6a4f] text-white"
                  : "bg-white border-gray-200 text-gray-600 hover:border-[#2d6a4f] hover:text-[#2d6a4f]"}`}
            >
              <Filter className="w-3.5 h-3.5" />
              Filter
              {hasActiveFilter && (
                <span className="w-4 h-4 rounded-full bg-white text-[#2d6a4f] text-[10px] font-bold flex items-center justify-center">
                  {[activeSearch, statusFilter, tahapFilter !== "" ? "1" : "", tanggalDari, tanggalSampai].filter(Boolean).length}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate("/ok-quality/form")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2d6a4f] text-white font-semibold text-xs shadow hover:bg-[#1b4332] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah
            </button>
          </div>
        </div>

        {/* ── Filter panel ─────────────────────────────────────────────── */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 space-y-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Cari No. Reg, No. MR, No. Jadwal, atau nama pasien..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]"
                />
              </div>
              <button type="submit" className="px-4 py-2 rounded-xl bg-[#2d6a4f] text-white text-xs font-semibold hover:bg-[#1b4332] transition-colors">
                Cari
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setTahapFilter(""); }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] bg-white"
                >
                  <option value="">— Semua Status —</option>
                  <option value="selesai">Selesai</option>
                  <option value="draft">Draft / Belum Selesai</option>
                </select>
              </div>

              {/* Tahap */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Tahap</label>
                <select
                  value={tahapFilter}
                  onChange={(e) => { setTahapFilter(e.target.value); setStatusFilter(""); }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] bg-white"
                >
                  <option value="">— Semua Tahap —</option>
                  {TAHAP_FILTER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Penilaian Kesimpulan */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Penilaian</label>
                <select
                  value={penilaianFilter}
                  onChange={(e) => setPenilaianFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] bg-white"
                >
                  <option value="">— Semua Penilaian —</option>
                  <option value="Dubia">Dubia</option>
                  <option value="Bonam / Sanam">Bonam / Sanam</option>
                  <option value="Malam">Malam</option>
                </select>
              </div>

              {/* Reset */}
              <div className="flex items-end">
                <button
                  onClick={resetFilters}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 hover:text-red-500 transition-colors flex items-center justify-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" /> Reset Filter
                </button>
              </div>
            </div>

            {/* Tanggal range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  <CalendarDays className="inline w-3.5 h-3.5 mr-1" />Tanggal Dari
                </label>
                <input
                  type="date"
                  value={tanggalDari}
                  onChange={(e) => setTanggalDari(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  <CalendarDays className="inline w-3.5 h-3.5 mr-1" />Tanggal Sampai
                </label>
                <input
                  type="date"
                  value={tanggalSampai}
                  onChange={(e) => setTanggalSampai(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Active filter pills ───────────────────────────────────────── */}
        {hasActiveFilter && !showFilters && (
          <div className="flex flex-wrap gap-2 mb-3">
            {activeSearch       && <FilterPill label={`Cari: "${activeSearch}"`}                              onRemove={() => { setActiveSearch(""); setSearchInput(""); }} />}
            {statusFilter       && <FilterPill label={statusFilter === "selesai" ? "Selesai" : "Draft"}       onRemove={() => setStatusFilter("")} />}
            {tahapFilter !== "" && <FilterPill label={TAHAP_FILTER_OPTIONS.find(o => o.value === tahapFilter)?.label} onRemove={() => setTahapFilter("")} />}
            {penilaianFilter    && <FilterPill label={`Penilaian: ${penilaianFilter}`}                         onRemove={() => setPenilaianFilter("")} />}
            {tanggalDari        && <FilterPill label={`Dari: ${tanggalDari}`}                                  onRemove={() => setTanggalDari("")} />}
            {tanggalSampai      && <FilterPill label={`Sampai: ${tanggalSampai}`}                              onRemove={() => setTanggalSampai("")} />}
          </div>
        )}

        {/* ── Cards grid ───────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm">Memuat data...</span>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
            <ClipboardList className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">
              {hasActiveFilter ? "Tidak ada data yang sesuai filter" : "Belum ada data penilaian"}
            </p>
            {hasActiveFilter ? (
              <button onClick={resetFilters} className="mt-3 text-xs text-[#2d6a4f] font-semibold hover:underline">
                Reset filter
              </button>
            ) : (
              <button
                onClick={() => navigate("/ok-quality/form")}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2d6a4f] text-white font-semibold text-sm hover:bg-[#1b4332] transition-colors"
              >
                <Plus className="w-4 h-4" /> Tambah Penilaian
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {data.map((row) => (
                <PatientCard
                  key={row.Id}
                  row={row}
                  onView={(id) => navigate(`/ok-quality/${id}`, { state: { activeMenu: "/home" } })}
                  onEdit={(id) => navigate(`/ok-quality/form/${id}`, { state: { activeMenu: "/home" } })}
                  onKesimpulan={(r) => setKesimpulanModal({ id: r.Id, nama: r.Nama_Pasien, noReg: r.No_Reg })}
                  canKesimpulan={canKesimpulan}
                />
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              pagination={pagination}
              limit={20}
              onPage={(p) => fetchData({ page: p })}
            />

            {/* Lihat semua */}
            <div className="mt-4 text-center">
              <button
                onClick={() => navigate("/ok-quality")}
                className="text-sm text-[#2d6a4f] hover:text-[#1b4332] font-semibold underline-offset-2 hover:underline transition-colors"
              >
                Lihat semua penilaian →
              </button>
            </div>
          </>
        )}
      </div>

      {/* Kesimpulan Modal */}
      {kesimpulanModal && (
        <KesimpulanModal
          penilaianId={kesimpulanModal.id}
          namaPassien={kesimpulanModal.nama}
          noReg={kesimpulanModal.noReg}
          onClose={() => setKesimpulanModal(null)}
          onSaved={() => fetchData()}
        />
      )}
    </div>
  );
}
