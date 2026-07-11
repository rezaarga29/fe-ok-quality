import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Search,
  Filter,
  Loader2,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Stethoscope,
  BedDouble,
  ClipboardPlus,
  AlertCircle,
  CheckCircle2,
  Clock,
  CircleDashed,
  ClipboardList,
} from "lucide-react";
import { getJadwal } from "../../services/ok_quality.service";
import Swal from "sweetalert2";

// ── Helpers ──────────────────────────────────────────────────────────────────

const BULAN_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const TAHAP_LABEL = ["Sebelum OP", "Sebelum OP", "Waktu OP", "Sesudah OP"];

function stepInfo(row) {
  if (!row.Id_Penilaian) {
    return {
      text: "Belum Dinilai",
      sub: "Penilaian belum dibuat",
      color: "gray",
      icon: CircleDashed,
    };
  }
  if (row.PenilaianStatus === "selesai") {
    return {
      text: "Penilaian Selesai",
      sub: "Semua tahap lengkap",
      color: "green",
      icon: CheckCircle2,
    };
  }
  const t = parseInt(row.Tahap_Selesai) || 0;
  if (t === 0) {
    return {
      text: "Sedang Dinilai",
      sub: "Tahap 1 belum diisi",
      color: "blue",
      icon: ClipboardList,
    };
  }
  const nextStep = t + 1;
  const nextLabel = TAHAP_LABEL[nextStep] ?? "Selesai";
  return {
    text: `Tahap ${t} Selesai`,
    sub: `Menunggu: ${nextLabel}`,
    color: "amber",
    icon: Clock,
  };
}

const colorMap = {
  gray:  { badge: "bg-gray-100 text-gray-500",      dot: "bg-gray-400"    },
  green: { badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  blue:  { badge: "bg-blue-100 text-blue-700",       dot: "bg-blue-500"    },
  amber: { badge: "bg-amber-100 text-amber-700",     dot: "bg-amber-500"   },
};

function StepBadge({ row }) {
  const { text, sub, color, icon: Icon } = stepInfo(row);
  const c = colorMap[color];
  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.badge}`}>
        <Icon className="w-3 h-3 shrink-0" />
        {text}
      </span>
      <span className="text-[10px] text-gray-400 pr-0.5">{sub}</span>
    </div>
  );
}

const KAMAR_OPTIONS = Array.from({ length: 10 }, (_, i) => `OK ${i + 1}`);

// Tahun options: 5 tahun ke belakang
function yearOptions() {
  const cur = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => cur - i);
}

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
      Menampilkan {total} jadwal
    </p>
  );

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 px-1">
      <p className="text-xs text-gray-500 order-2 sm:order-1">
        Menampilkan <strong className="text-gray-700">{from}–{to}</strong> dari <strong className="text-gray-700">{total}</strong> jadwal
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

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function JadwalOperasiPage() {
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);

  // ── Filter state ─────────────────────────────────────────────────────────────
  const [filterMode, setFilterMode]   = useState("tanggal"); // "tanggal" | "bulan"
  const [tanggal,    setTanggal]      = useState(today);
  const [bulan,      setBulan]        = useState(String(new Date().getMonth() + 1).padStart(2, "0"));
  const [tahun,      setTahun]        = useState(String(new Date().getFullYear()));
  const [kamar,      setKamar]        = useState("");
  const [step,       setStep]         = useState("");
  const [q,          setQ]            = useState("");

  const LIMIT = 20;

  // ── Data state ────────────────────────────────────────────────────────────────
  const [rows,       setRows]         = useState([]);
  const [loading,    setLoading]      = useState(false);
  const [searched,   setSearched]     = useState(false);
  const [pagination, setPagination]   = useState({ page: 1, totalPages: 1, total: 0 });

  // ── Fetch ─────────────────────────────────────────────────────────────────────
  const buildParams = useCallback((page = 1) => {
    const params = { q: q.trim() || undefined, page, limit: LIMIT };
    if (filterMode === "tanggal") {
      params.tanggal = tanggal || undefined;
    } else {
      params.bulan = bulan || undefined;
      params.tahun = tahun || undefined;
    }
    if (kamar) params.kamar = kamar;
    if (step !== "") params.step = step;
    return params;
  }, [filterMode, tanggal, bulan, tahun, kamar, step, q]);

  const fetchPage = useCallback(async (page = 1) => {
    setLoading(true);
    setSearched(true);
    try {
      const res = await getJadwal(buildParams(page));
      const data = res.data || [];
      setRows(data);
      setPagination(res.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal memuat jadwal",
        text: err?.response?.data?.message || err.message,
        timer: 3000,
        showConfirmButton: false,
      });
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  const handleSearch = useCallback(() => fetchPage(1), [fetchPage]);

  // Cari otomatis saat mount dengan filter hari ini
  useEffect(() => {
    fetchPage(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Navigasi ke form ──────────────────────────────────────────────────────────
  const handleMulai = (row) => {
    // Jika sudah ada penilaian, arahkan ke form edit
    if (row.Id_Penilaian) {
      if (row.PenilaianStatus === "selesai") {
        navigate(`/ok-quality/${row.Id_Penilaian}`, {
          state: { activeMenu: "/jadwal-operasi" },
        });
      } else {
        navigate(`/ok-quality/form/${row.Id_Penilaian}`, {
          state: { activeMenu: "/jadwal-operasi" },
        });
      }
      return;
    }
    // Belum ada penilaian → buka form baru dengan data jadwal di-pass via state
    navigate("/ok-quality/form", {
      state: {
        activeMenu: "/jadwal-operasi",
        jadwal: {
          No_Jadwal:   row.No_Jadwal,
          No_Reg:      row.No_Reg,
          No_MR:       row.No_MR,
          Nama_Pasien: row.Nama_Pasien,
          Tanggal:     row.Tanggal,
          Jam:         row.Jam,
          JamSelesai:  row.JamSelesai,
          Tindakan:    row.Tindakan,
          Diagnosa:    row.Diagnosa,
          KetDiagnosa: row.KetDiagnosa,
          Kamar:       row.Kamar,
          DPJP:        row.DPJP,
          DPJP_Nama:   row.DPJP_Nama,
        },
      },
    });
  };

  // ── Filtered rows (client-side kamar filter jika ingin refine) ────────────────
  const displayRows = rows;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30 pb-12">
      {/* ── Header ── */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-screen-xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2d6a4f] to-[#40916c] flex items-center justify-center shadow-sm shrink-0">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Jadwal Operasi</h1>
            <p className="text-xs text-gray-500">Daftar jadwal operasi dan status penilaian OK Quality</p>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-4">

        {/* ── Filter panel ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-gray-700">
            <Filter className="w-4 h-4 text-[#2d6a4f]" />
            Filter & Pencarian
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

            {/* Mode filter tanggal/bulan */}
            <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-2">
              <button
                onClick={() => setFilterMode("tanggal")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  filterMode === "tanggal"
                    ? "bg-[#2d6a4f] text-white border-[#2d6a4f]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#2d6a4f]"
                }`}
              >
                Per Tanggal
              </button>
              <button
                onClick={() => setFilterMode("bulan")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  filterMode === "bulan"
                    ? "bg-[#2d6a4f] text-white border-[#2d6a4f]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#2d6a4f]"
                }`}
              >
                Per Bulan
              </button>
            </div>

            {/* Tanggal atau Bulan+Tahun */}
            {filterMode === "tanggal" ? (
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Tanggal</label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] outline-none"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Bulan</label>
                  <select
                    value={bulan}
                    onChange={(e) => setBulan(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] outline-none"
                  >
                    <option value="">Semua Bulan</option>
                    {BULAN_NAMES.map((b, i) => (
                      <option key={i + 1} value={String(i + 1).padStart(2, "0")}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Tahun</label>
                  <select
                    value={tahun}
                    onChange={(e) => setTahun(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] outline-none"
                  >
                    <option value="">Semua Tahun</option>
                    {yearOptions().map((y) => (
                      <option key={y} value={String(y)}>{y}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Filter Kamar */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Kamar / Ruangan</label>
              <select
                value={kamar}
                onChange={(e) => setKamar(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] outline-none"
              >
                <option value="">Semua Kamar</option>
                {KAMAR_OPTIONS.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>

            {/* Filter Step */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status Penilaian</label>
              <select
                value={step}
                onChange={(e) => setStep(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] outline-none"
              >
                <option value="">Semua Status</option>
                <option value="0">Belum Ada Penilaian</option>
                <option value="1">Tahap 1 Selesai</option>
                <option value="2">Tahap 2 Selesai</option>
                <option value="3">Tahap 3 Selesai</option>
                <option value="selesai">Penilaian Selesai</option>
              </select>
            </div>

            {/* Search teks */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-medium text-gray-500 mb-1">Cari No. MR / Nama Pasien / No. Reg</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Ketik No. MR, No. Reg, No. Jadwal, atau Nama Pasien..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] outline-none"
                />
              </div>
            </div>

            {/* Tombol cari */}
            <div className="flex items-end gap-2">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Cari
              </button>
              <button
                onClick={() => {
                  setQ("");
                  setKamar("");
                  setStep("");
                  setFilterMode("tanggal");
                  setTanggal(today);
                }}
                title="Reset filter"
                className="p-2 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Result info ── */}
        {searched && !loading && (
          <div className="flex items-center justify-between text-xs text-gray-500 px-1">
            <span>
              {pagination.total > 0
                ? `Total ${pagination.total} jadwal ditemukan`
                : "Tidak ada jadwal ditemukan"}
            </span>
            {displayRows.length > 0 && (
              <span className="text-gray-400">
                {displayRows.filter((r) => !r.Id_Penilaian).length} belum dinilai ·{" "}
                {displayRows.filter((r) => r.PenilaianStatus === "selesai").length} selesai (halaman ini)
              </span>
            )}
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-gray-100 rounded w-2/5" />
                    <div className="h-3 bg-gray-100 rounded w-3/5" />
                    <div className="h-3 bg-gray-100 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && searched && displayRows.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 flex flex-col items-center gap-3 text-gray-400">
            <Calendar className="w-12 h-12 text-gray-200" />
            <p className="text-sm font-medium">Tidak ada jadwal operasi</p>
            <p className="text-xs text-gray-300">Coba ubah filter atau tanggal pencarian</p>
          </div>
        )}

        {/* ── Table (desktop) / Cards (mobile) ── */}
        {!loading && displayRows.length > 0 && (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[110px]">Tanggal / Jam</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pasien</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[130px]">Kamar</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">DPJP</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tindakan</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[160px]">Status Penilaian</th>
                    <th className="px-4 py-3 w-[130px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {displayRows.map((row) => {
                    const dpjp = row.DPJP_Nama
                      ? `${row.DPJP_Nama}${row.DPJP ? ` (${row.DPJP})` : ""}`
                      : row.DPJP || "-";
                    const hasPenilaian = !!row.Id_Penilaian;
                    const isSelesai = row.PenilaianStatus === "selesai";

                    return (
                      <tr key={row.No_Jadwal} className="hover:bg-emerald-50/30 transition-colors">
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="text-xs font-semibold text-gray-800">{row.Tanggal || "-"}</div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {row.Jam || "-"}{row.JamSelesai ? ` – ${row.JamSelesai}` : ""}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-gray-900 leading-tight">{row.Nama_Pasien || "-"}</div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                            <span>{row.No_MR || "-"}</span>
                            <span className="text-gray-200">·</span>
                            <span>{row.No_Reg || "-"}</span>
                          </div>
                          <div className="text-[11px] font-mono text-emerald-700 mt-0.5">
                            Jadwal: {row.No_Jadwal || "-"}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <BedDouble className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="font-medium">{row.Kamar || "-"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <Stethoscope className="w-3.5 h-3.5 text-[#2d6a4f] shrink-0" />
                            <span className="leading-tight">{dpjp}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-xs text-gray-600 leading-snug line-clamp-2 max-w-[220px]">
                            {row.Tindakan || row.KetDiagnosa || "-"}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <StepBadge row={row} />
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => handleMulai(row)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                              isSelesai
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                                : hasPenilaian
                                ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                                : "bg-[#2d6a4f] text-white hover:bg-[#1b4332] shadow-sm"
                            }`}
                          >
                            {isSelesai ? (
                              <><CheckCircle2 className="w-3.5 h-3.5" /> Lihat</>
                            ) : hasPenilaian ? (
                              <><Clock className="w-3.5 h-3.5" /> Lanjut</>
                            ) : (
                              <><ClipboardPlus className="w-3.5 h-3.5" /> Mulai</>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden space-y-3">
              {displayRows.map((row) => {
                const dpjp = row.DPJP_Nama
                  ? `${row.DPJP_Nama}${row.DPJP ? ` (${row.DPJP})` : ""}`
                  : row.DPJP || "-";
                const hasPenilaian = !!row.Id_Penilaian;
                const isSelesai = row.PenilaianStatus === "selesai";

                return (
                  <div key={row.No_Jadwal} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <p className="font-bold text-gray-900 text-sm leading-tight">{row.Nama_Pasien || "-"}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{row.No_MR} · {row.No_Reg}</p>
                        <p className="text-[11px] font-mono text-emerald-700 mt-0.5">Jadwal: {row.No_Jadwal || "-"}</p>
                      </div>
                      <StepBadge row={row} />
                    </div>

                    {/* Info baris */}
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-gray-600 mb-3">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{row.Tanggal} {row.Jam}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <BedDouble className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{row.Kamar || "-"}</span>
                      </div>
                      <div className="col-span-2 flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-[#2d6a4f] shrink-0" />
                        <span className="font-medium text-gray-700">{dpjp}</span>
                      </div>
                    </div>

                    {/* Tindakan */}
                    {(row.Tindakan || row.KetDiagnosa) && (
                      <p className="text-xs text-gray-500 leading-snug mb-3 line-clamp-2">
                        {row.Tindakan || row.KetDiagnosa}
                      </p>
                    )}

                    {/* Action */}
                    <button
                      onClick={() => handleMulai(row)}
                      className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all ${
                        isSelesai
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                          : hasPenilaian
                          ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                          : "bg-[#2d6a4f] text-white hover:bg-[#1b4332] shadow-sm"
                      }`}
                    >
                      {isSelesai ? (
                        <><CheckCircle2 className="w-4 h-4" /> Lihat Penilaian</>
                      ) : hasPenilaian ? (
                        <><Clock className="w-4 h-4" /> Lanjut Penilaian</>
                      ) : (
                        <><ClipboardPlus className="w-4 h-4" /> Mulai Penilaian</>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <Pagination
              pagination={pagination}
              limit={LIMIT}
              onPage={fetchPage}
            />
          </>
        )}

      </div>
    </div>
  );
}
