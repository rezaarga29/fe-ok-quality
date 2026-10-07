import { useEffect, useState } from "react";
import { FileText, X, Loader2 } from "lucide-react";
import { getSuratKematian } from "../../services/ok_quality.service";
import { StatusKeluarBadge } from "../../components/OkqShared";

// ── Modal Surat Keterangan Kematian (read-only) ──────────────────────────────
// Sumber: ASESMEN_SURATKET_KEMATIAN. Tombolnya hanya dimunculkan untuk pasien
// keluar meninggal (Kode_Keluar A/B/C) — lihat isKodeMeninggal di bawah.

export const KODE_MENINGGAL = ["A", "B", "C"];
export const isKodeMeninggal = (kode) =>
  KODE_MENINGGAL.includes(String(kode ?? "").trim().toUpperCase());

// Tanggal dari BE sudah string "yyyy-mm-dd" (lokal, tanpa timezone)
const fmtTanggalLokal = (s) => {
  if (!s) return null;
  const dt = new Date(`${s}T00:00:00`);
  return isNaN(dt.getTime())
    ? s
    : dt.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
};

function InfoRow({ label, value, span = false }) {
  return (
    <div className={span ? "sm:col-span-2" : ""}>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p
        className={`text-sm text-gray-800 break-words whitespace-pre-wrap ${!value ? "text-gray-300 italic" : ""}`}
      >
        {value || "—"}
      </p>
    </div>
  );
}

// Tombol kecil untuk baris/kartu list — render null kalau bukan pasien meninggal
export function SuratKematianButton({ kode, onClick, size = "md" }) {
  if (!isKodeMeninggal(kode)) return null;
  const pad = size === "sm" ? "p-1.5" : "p-2";
  const icon = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  return (
    <button
      onClick={onClick}
      className={`${pad} rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors`}
      title="Surat Keterangan Kematian"
    >
      <FileText className={icon} />
    </button>
  );
}

export default function SuratKematianModal({ noReg, namaPasien, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [surat, setSurat] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getSuratKematian(noReg)
      .then((res) => { if (active) setSurat(res?.data || null); })
      .catch((err) => {
        if (active) setError(err?.response?.data?.message || err.message || "Gagal memuat data");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [noReg]);

  // Tutup dengan tombol Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const records = surat?.records || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-red-100 bg-red-50/60 shrink-0">
          <div className="w-8 h-8 shrink-0 rounded-xl flex items-center justify-center bg-red-100 text-red-600">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-gray-700">Surat Keterangan Kematian</h3>
            <p className="text-[11px] text-gray-400 truncate">
              {namaPasien ?? "—"} · {noReg}
            </p>
          </div>
          {surat?.isMeninggal && (
            <StatusKeluarBadge kode={surat.Kode_Keluar} ket={surat.Ket_Keluar} />
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-red-500" />
            </div>
          ) : error ? (
            <p className="text-sm text-red-500 text-center py-4">{error}</p>
          ) : !surat?.isMeninggal ? (
            <p className="text-sm text-gray-400 text-center py-4">
              Pasien tidak tercatat keluar meninggal
            </p>
          ) : records.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              Pasien keluar meninggal, tetapi Surat Keterangan Kematian belum diisi
            </p>
          ) : (
            <div className="space-y-4">
              {records.map((r, i) => (
                <div
                  key={`${r.NoSurat || "sk"}-${i}`}
                  className={`grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 ${i > 0 ? "pt-4 border-t border-dashed border-gray-200" : ""}`}
                >
                  <InfoRow label="No. Surat" value={r.NoSurat} />
                  <InfoRow
                    label="Tanggal / Jam"
                    value={[fmtTanggalLokal(r.Tanggal), r.Jam].filter(Boolean).join(" · ") || null}
                  />
                  <InfoRow label="Telah Meninggal" value={r.TelahMeninggal} span />
                  <InfoRow label="Keterangan" value={r.Keterangan} span />
                  <InfoRow label="Dibuat Oleh" value={r.NamaUser} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
