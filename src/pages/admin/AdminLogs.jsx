import { useState, useEffect, useCallback } from "react";
import {
  Activity, AlertTriangle, RefreshCw, Loader2,
  Search, CalendarDays, Clock, ArrowDown, ArrowUp,
  CheckCircle2, XCircle,
} from "lucide-react";
import { getAccessLogs, getErrorLogs } from "../../services/admin.service";

// ── Helpers ───────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().slice(0, 10);

const LIMIT = 50;

const METHOD_COLOR = {
  GET:    "bg-blue-100 text-blue-700",
  POST:   "bg-emerald-100 text-emerald-700",
  PUT:    "bg-amber-100 text-amber-700",
  PATCH:  "bg-orange-100 text-orange-700",
  DELETE: "bg-red-100 text-red-700",
};

const LEVEL_COLOR = {
  error: "bg-red-100 text-red-700",
  warn:  "bg-amber-100 text-amber-700",
  info:  "bg-blue-100 text-blue-700",
};

function MethodBadge({ method }) {
  return (
    <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded ${METHOD_COLOR[method] ?? "bg-gray-100 text-gray-500"}`}>
      {method}
    </span>
  );
}

function LevelBadge({ level }) {
  const Icon = level === "error" ? XCircle : level === "warn" ? AlertTriangle : CheckCircle2;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${LEVEL_COLOR[level] ?? "bg-gray-100 text-gray-500"}`}>
      <Icon className="w-3 h-3" />
      {level}
    </span>
  );
}

// ── Pagination bar ────────────────────────────────────────────────────────────
function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) return null;
  const { page, totalPages, total } = pagination;
  return (
    <div className="flex items-center justify-between mt-3">
      <p className="text-xs text-gray-500">
        Halaman {page} dari {totalPages} · {total} baris
      </p>
      <div className="flex gap-1.5">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Prev
        </button>
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

// ── Access Log Tab ────────────────────────────────────────────────────────────
function AccessLogTab({ date }) {
  const [data,       setData]       = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState("");
  const [sortDir,    setSortDir]    = useState("desc");

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await getAccessLogs({ date, page: p, limit: LIMIT });
      setData(res.data || []);
      setPagination(res.pagination || null);
      setPage(p);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [date]);

  // Reset ke page 1 saat tanggal berubah
  useEffect(() => { setPage(1); load(1); }, [load]);

  const filtered = data
    .filter((r) =>
      !search ||
      r.url.toLowerCase().includes(search.toLowerCase()) ||
      r.method.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const ta = `${a.date} ${a.time}`;
      const tb = `${b.date} ${b.time}`;
      return sortDir === "desc" ? tb.localeCompare(ta) : ta.localeCompare(tb);
    });

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter URL / method..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]"
          />
        </div>
        <button
          onClick={() => setSortDir((d) => d === "desc" ? "asc" : "desc")}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          {sortDir === "desc"
            ? <><ArrowDown className="w-3.5 h-3.5" /> Terbaru</>
            : <><ArrowUp   className="w-3.5 h-3.5" /> Terlama</>}
        </button>
        <button onClick={() => load(page)} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-gray-500" title="Refresh">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
        <span className="ml-auto text-xs text-gray-400">{filtered.length} dari {pagination?.total ?? 0} baris</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Memuat log...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Activity className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">Tidak ada log untuk tanggal ini</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-24">Waktu</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-16">Method</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">URL</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-24">Durasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-500 whitespace-nowrap">
                      <Clock className="inline w-3 h-3 mr-1 text-gray-300" />
                      {row.time}
                    </td>
                    <td className="px-4 py-2.5">
                      <MethodBadge method={row.method} />
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-700 break-all">{row.url}</td>
                    <td className={`px-4 py-2.5 text-right font-mono text-xs font-semibold whitespace-nowrap
                      ${row.duration > 1000 ? "text-red-500" : row.duration > 500 ? "text-amber-500" : "text-emerald-600"}`}>
                      {row.duration.toFixed(1)}ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination pagination={pagination} onPageChange={(p) => load(p)} />
    </div>
  );
}

// ── Error Log Tab ─────────────────────────────────────────────────────────────
function ErrorLogTab({ date }) {
  const [data,       setData]       = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState("");

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await getErrorLogs({ date, page: p, limit: LIMIT });
      setData(res.data || []);
      setPagination(res.pagination || null);
      setPage(p);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { setPage(1); load(1); }, [load]);

  const filtered = data.filter((r) =>
    !search || r.message.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter pesan error..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]"
          />
        </div>
        <button onClick={() => load(page)} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-gray-500" title="Refresh">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
        <span className="ml-auto text-xs text-gray-400">{filtered.length} dari {pagination?.total ?? 0} baris</span>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Memuat log...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <CheckCircle2 className="w-10 h-10 mb-2 opacity-30 text-emerald-400" />
            <p className="text-sm">Tidak ada error untuk tanggal ini</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((row, i) => (
              <div key={i} className="px-4 py-3 hover:bg-gray-50/60 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <LevelBadge level={row.level} />
                  <span className="font-mono text-xs text-gray-400">
                    <Clock className="inline w-3 h-3 mr-1 text-gray-300" />
                    {row.time}
                  </span>
                </div>
                <p className="font-mono text-xs text-gray-700 break-all leading-relaxed">{row.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Pagination pagination={pagination} onPageChange={(p) => load(p)} />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminLogs() {
  const [activeTab, setActiveTab] = useState("access");
  const [date,      setDate]      = useState(today());

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-800">Log Sistem</h1>
          <p className="text-sm text-gray-500 mt-0.5">Monitor aktivitas & error server</p>
        </div>

        {/* Date picker */}
        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl shadow-sm">
          <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="date"
            value={date}
            max={today()}
            onChange={(e) => setDate(e.target.value)}
            className="text-sm text-gray-700 bg-transparent focus:outline-none"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab("access")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "access"
              ? "bg-white text-[#2d6a4f] shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Activity className="w-4 h-4" />
          Access Log
        </button>
        <button
          onClick={() => setActiveTab("error")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "error"
              ? "bg-white text-red-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Error Log
        </button>
      </div>

      {/* Tab content — key={date} supaya reset state saat tanggal ganti */}
      {activeTab === "access"
        ? <AccessLogTab key={`access-${date}`} date={date} />
        : <ErrorLogTab  key={`error-${date}`}  date={date} />
      }
    </div>
  );
}
