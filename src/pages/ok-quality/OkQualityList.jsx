import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Eye, Pencil, Loader2, CheckCircle2, Clock, AlertCircle, ClipboardCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { getAll } from "../../services/ok_quality.service";
import KesimpulanModal from "./KesimpulanModal";
import { useAuth } from "../../context/AuthContext";
import Swal from "sweetalert2";

// ── Badge status tahap ───────────────────────────────────────────────────────
const TAHAP_LABELS = ["Belum Mulai", "Sebelum OP", "Waktu OP", "Selesai"];
const TAHAP_COLORS = [
  "bg-gray-100 text-gray-500",
  "bg-amber-100 text-amber-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
];

function StatusBadge({ tahap = 0, status }) {
  const label = status === "selesai" ? "Selesai" : TAHAP_LABELS[tahap] ?? "Belum Mulai";
  const color = status === "selesai" ? "bg-emerald-100 text-emerald-700" : TAHAP_COLORS[tahap] ?? TAHAP_COLORS[0];
  const Icon  = status === "selesai" ? CheckCircle2 : tahap > 0 ? Clock : AlertCircle;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${color}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
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

// ── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ tahap = 0 }) {
  const pct = Math.round((Math.min(tahap, 3) / 3) * 100);
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5">
      <div
        className={`h-1.5 rounded-full transition-all duration-500 ${
          pct >= 100 ? "bg-emerald-500" : pct > 0 ? "bg-amber-400" : "bg-gray-300"
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────
function Pagination({ pagination, onPage }) {
  const { page, totalPages, total } = pagination;
  const limit = 15;
  const from  = total === 0 ? 0 : (page - 1) * limit + 1;
  const to    = Math.min(page * limit, total);

  // Buat array halaman: selalu tampilkan maks 5 nomor di sekitar halaman aktif
  const pages = [];
  const delta = 2;
  for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
    pages.push(i);
  }

  if (totalPages <= 1) return (
    <p className="text-xs text-gray-400 text-center mt-4">
      Menampilkan {total} data
    </p>
  );

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5 px-1">
      <p className="text-xs text-gray-500 order-2 sm:order-1">
        Menampilkan <strong className="text-gray-700">{from}–{to}</strong> dari <strong className="text-gray-700">{total}</strong> data
      </p>
      <div className="flex items-center gap-1 order-1 sm:order-2">
        {/* Prev */}
        <button
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Prev
        </button>

        {/* First page + ellipsis */}
        {pages[0] > 1 && (
          <>
            <button onClick={() => onPage(1)} className="w-8 h-8 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">1</button>
            {pages[0] > 2 && <span className="text-gray-400 text-xs px-1">…</span>}
          </>
        )}

        {/* Page numbers */}
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

        {/* Last page + ellipsis */}
        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && <span className="text-gray-400 text-xs px-1">…</span>}
            <button onClick={() => onPage(totalPages)} className="w-8 h-8 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">{totalPages}</button>
          </>
        )}

        {/* Next */}
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

export default function OkQualityList() {
  const navigate = useNavigate();
  const { canKesimpulan } = useAuth();
  const [data, setData]                       = useState([]);
  const [kesimpulanModal, setKesimpulanModal] = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [search, setSearch]                   = useState("");
  const [searchInput, setSearchInput]         = useState("");
  const [penilaianFilter, setPenilaianFilter] = useState("");
  const [pagination, setPagination]           = useState({ page: 1, totalPages: 1, total: 0 });

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await getAll({
        page, limit: 15,
        ...(search          && { search }),
        ...(penilaianFilter && { penilaian: penilaianFilter }),
      });
      setData(res.data || []);
      setPagination(res.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch {
      Swal.fire({ icon: "error", title: "Gagal memuat data", timer: 2000, showConfirmButton: false });
    } finally {
      setLoading(false);
    }
  }, [search, penilaianFilter]);

  useEffect(() => { fetchData(1); }, [fetchData]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-800">Penilaian OK Quality</h1>
          <p className="text-sm text-gray-500 mt-0.5">{pagination.total} data tersedia</p>
        </div>
        <button
          onClick={() => navigate("/ok-quality/form")}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2d6a4f] text-white font-semibold text-sm shadow-md hover:bg-[#1b4332] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Penilaian
        </button>
      </div>

      {/* Search + Filter Penilaian */}
      <div className="flex flex-wrap gap-2 mb-5">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari No. Reg / No. MR / No. Jadwal..."
              className="pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl w-56 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-[#2d6a4f] text-white text-sm font-medium hover:bg-[#1b4332] transition-colors"
          >
            Cari
          </button>
        </form>

        {/* Filter Penilaian */}
        <select
          value={penilaianFilter}
          onChange={(e) => setPenilaianFilter(e.target.value)}
          className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] bg-white"
        >
          <option value="">— Semua Penilaian —</option>
          <option value="Dubia">Dubia</option>
          <option value="Bonam / Sanam">Bonam / Sanam</option>
          <option value="Malam">Malam</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm">Memuat data...</span>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <AlertCircle className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">Belum ada data penilaian</p>
            <p className="text-xs mt-1">Klik "Tambah Penilaian" untuk mulai</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">No. Reg</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pasien</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tanggal</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Progress</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Penilaian</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.map((row) => (
                    <tr key={row.Id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">
                        {row.No_Reg}
                        {row.No_Jadwal && (
                          <p className="text-[10px] text-emerald-700 mt-0.5">Jadwal: {row.No_Jadwal}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800 text-sm">{row.Nama_Pasien ?? "-"}</p>
                        <p className="text-xs text-gray-400">{row.No_MR}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {row.Tanggal ? new Date(row.Tanggal).toLocaleDateString("id-ID") : "-"}
                      </td>
                      <td className="px-4 py-3 w-36">
                        <ProgressBar tahap={row.Tahap_Selesai} />
                        <p className="text-[10px] text-gray-400 mt-1">Tahap {row.Tahap_Selesai ?? 0}/3</p>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge tahap={row.Tahap_Selesai} status={row.Status} />
                      </td>
                      <td className="px-4 py-3">
                        <KesimpulanBadge penilaian={row.Kesimpulan_Penilaian} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => navigate(`/ok-quality/${row.Id}`)}
                            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                            title="Lihat detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/ok-quality/form/${row.Id}`)}
                            className="p-2 rounded-lg text-gray-400 hover:bg-[#2d6a4f]/10 hover:text-[#2d6a4f] transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {row.Status === "selesai" && canKesimpulan && (
                            <button
                              onClick={() => setKesimpulanModal({ id: row.Id, nama: row.Nama_Pasien, noReg: row.No_Reg })}
                              className="p-2 rounded-lg text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                              title="Kesimpulan"
                            >
                              <ClipboardCheck className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {data.map((row) => (
                <div key={row.Id} className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{row.Nama_Pasien ?? "-"}</p>
                      <p className="text-xs text-gray-400 font-mono">{row.No_Reg}</p>
                      {row.No_Jadwal && (
                        <p className="text-[10px] text-emerald-700 font-mono mt-0.5">Jadwal: {row.No_Jadwal}</p>
                      )}
                    </div>
                    <StatusBadge tahap={row.Tahap_Selesai} status={row.Status} />
                  </div>
                  <ProgressBar tahap={row.Tahap_Selesai} />
                  {row.Kesimpulan_Penilaian && (
                    <div className="mt-2">
                      <KesimpulanBadge penilaian={row.Kesimpulan_Penilaian} />
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-gray-400">
                      {row.Tanggal ? new Date(row.Tanggal).toLocaleDateString("id-ID") : "-"} · Tahap {row.Tahap_Selesai ?? 0}/3
                    </p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => navigate(`/ok-quality/${row.Id}`)}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/ok-quality/form/${row.Id}`)}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-[#2d6a4f]/10 hover:text-[#2d6a4f] transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {row.Status === "selesai" && canKesimpulan && (
                        <button
                          onClick={() => setKesimpulanModal({ id: row.Id, nama: row.Nama_Pasien, noReg: row.No_Reg })}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                          title="Kesimpulan"
                        >
                          <ClipboardCheck className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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
          onSaved={() => fetchData(pagination.page)}
        />
      )}

      {/* Pagination */}
      {pagination.totalPages > 0 && (
        <Pagination pagination={pagination} onPage={fetchData} />
      )}
    </div>
  );
}
