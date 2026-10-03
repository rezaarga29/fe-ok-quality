import { useEffect, useState } from "react";
import { Route, X, Loader2, Calendar, ArrowRight, MapPin } from "lucide-react";
import { getLembarTransferStatus } from "../../services/ok_quality.service";

// ── Modal Perjalanan Perpindahan Pasien (read-only) ──────────────────────────
// Dipakai di /home supaya dokter bisa melihat riwayat perpindahan ruangan
// pasien (ASESMEN_TRANSFER_PASIEN) tanpa membuka form. Data diambil dari
// endpoint yang sama dengan modal Lembar Transfer di form Tahap 3, lalu
// diurutkan dari perpindahan PERTAMA → TERAKHIR supaya terbaca sebagai alur.

const datePart = (v) => (v ? String(v).slice(0, 10) : null);
const timePart = (v) => (v ? String(v).slice(11, 16) : null);

// Kunci urut: pakai Tgl/Jam Pindah, fallback ke Tanggal/Jam pengisian lembar
const sortKey = (r) =>
  `${datePart(r.TglPindah) || datePart(r.Tanggal) || ""} ${
    timePart(r.JamPindah) || timePart(r.Jam) || ""
  } ${String(r.Id_Transfer ?? "").padStart(12, "0")}`;

export default function PerjalananPasienModal({ noReg, namaPasien, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getLembarTransferStatus(noReg)
      .then((res) => {
        if (!active) return;
        const list = res?.data?.records || [];
        setRecords([...list].sort((a, b) => sortKey(a).localeCompare(sortKey(b))));
      })
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <Route className="w-5 h-5 text-white shrink-0" />
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white">Perjalanan Perpindahan Pasien</h2>
              <p className="text-white/60 text-xs truncate">
                {namaPasien ? `${namaPasien} · ` : ""}No. Reg {noReg}
                {!loading && !error && ` · ${records.length} perpindahan`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-w-11 min-h-11 flex items-center justify-center rounded-lg text-white/70 hover:bg-white/20 active:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Memuat perjalanan pasien...</span>
            </div>
          ) : error ? (
            <p className="text-sm text-red-500 text-center py-8">{error}</p>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-gray-400">
              <MapPin className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">Belum ada Lembar Transfer Pasien untuk No. Reg ini.</p>
            </div>
          ) : (
            <ol className="relative">
              {records.map((r, idx) => {
                const isLast = idx === records.length - 1;
                const tglPindah = datePart(r.TglPindah);
                const jamPindah = timePart(r.JamPindah);
                return (
                  <li key={r.Id_Transfer ?? idx} className="relative pl-9 pb-5 last:pb-0">
                    {/* Garis timeline */}
                    {!isLast && (
                      <span className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-emerald-200" />
                    )}
                    {/* Titik nomor urut */}
                    <span
                      className={`absolute left-0 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white ${
                        isLast ? "bg-[#2d6a4f] ring-4 ring-emerald-100" : "bg-emerald-400"
                      }`}
                    >
                      {idx + 1}
                    </span>

                    <div className="rounded-xl border border-gray-200 px-4 py-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {tglPindah || datePart(r.Tanggal) || "—"}
                        {(jamPindah || timePart(r.Jam)) && (
                          <span className="text-gray-400 font-normal">· {jamPindah || timePart(r.Jam)}</span>
                        )}
                        {isLast && (
                          <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                            Terakhir
                          </span>
                        )}
                      </div>

                      {(r.RuangAsal || r.RuangTujuan) && (
                        <p className="flex flex-wrap items-center gap-1.5 text-sm text-gray-800">
                          <strong className="uppercase">{r.RuangAsal || "—"}</strong>
                          <ArrowRight className="w-3.5 h-3.5 text-[#2d6a4f]" />
                          <strong className="uppercase">{r.RuangTujuan || "—"}</strong>
                        </p>
                      )}

                      {r.Tanggal && (
                        <p className="text-[11px] text-gray-500 mt-1">
                          Lembar diisi: {datePart(r.Tanggal)}
                          {timePart(r.Jam) && ` · ${timePart(r.Jam)}`}
                        </p>
                      )}

                      {(r.NamaPetugasMenyerahkan || r.NamaPetugasMenerima) && (
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5 pt-1.5 border-t border-gray-100 text-[11px] text-gray-500">
                          {r.NamaPetugasMenyerahkan && (
                            <span>Menyerahkan: <strong>{r.NamaPetugasMenyerahkan}</strong></span>
                          )}
                          {r.NamaPetugasMenerima && (
                            <span>Menerima: <strong>{r.NamaPetugasMenerima}</strong></span>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
