import { useState } from "react";
import { X, Bandage, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import Swal from "sweetalert2";
import { updateLukaRanap } from "../../services/ok_quality.service";

// Opsi sama dengan field "Kondisi Luka di Ranap" di OkQualityForm (Tahap 3)
export const KONDISI_LUKA_RANAP_OPTIONS = [
  "Baik / Kering",
  "Sedikit Rembes",
  "Rembes",
  "Berdarah Aktif",
  "Tanda Infeksi",
];

// Penilaian yang operasinya sudah berjalan (Tahap 2 "Waktu OP" selesai),
// pasien bukan ODC, tapi Kondisi Luka di Ranap belum diisi.
export function isLukaRanapKosong(row) {
  if (!row?.Id && !row?.Id_Penilaian) return false;
  if (row.Jenis_Rawat === "ODC") return false;
  const tahap = parseInt(row.Tahap_Selesai) || 0;
  return tahap >= 2 && !String(row.Kondisi_Luka_Ranap ?? "").trim();
}

// Label penanda di card dashboard
export function LukaRanapBelumBadge({ row, onClick }) {
  if (!isLukaRanapKosong(row)) return null;
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      {...(onClick ? { type: "button", onClick } : {})}
      className={`w-full flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-left ${
        onClick ? "hover:bg-rose-100 transition-colors" : ""
      }`}
      title="Kondisi luka di ranap setelah operasi belum diisi"
    >
      <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
      <span className="flex-1 text-[11px] font-semibold text-rose-700">
        Kondisi luka di Ranap belum diisi
      </span>
      {onClick && (
        <span className="text-[10px] font-semibold text-rose-600 underline underline-offset-2">Isi</span>
      )}
    </Tag>
  );
}

// Modal khusus role staff-ranap — hanya mengisi Kondisi_Luka_Ranap
export default function LukaRanapModal({ penilaianId, nama, noReg, initialValue = "", onClose, onSaved }) {
  const [value, setValue]   = useState(initialValue || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!value) {
      return Swal.fire({ icon: "warning", title: "Pilih kondisi luka terlebih dahulu", timer: 2000, showConfirmButton: false });
    }
    setSaving(true);
    try {
      await updateLukaRanap(penilaianId, value);
      Swal.fire({ icon: "success", title: "Kondisi luka tersimpan", timer: 1500, showConfirmButton: false });
      onSaved?.();
      onClose();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal menyimpan", text: err?.response?.data?.message || err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#1b4332] to-[#2d6a4f]">
          <div className="flex items-center gap-2.5">
            <Bandage className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-sm font-bold text-white">Kondisi Luka di Ranap</h2>
              <p className="text-white/60 text-xs">{nama || "-"} · {noReg || "-"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/70 hover:bg-white/20 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              Kondisi luka setelah operasi <span className="text-red-400">*</span>
            </label>
            <div className="flex flex-col gap-2">
              {KONDISI_LUKA_RANAP_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setValue(opt)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm text-left transition-all ${
                    value === opt
                      ? "border-[#2d6a4f] bg-[#2d6a4f]/10 text-[#1b4332] font-semibold"
                      : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {value === opt
                    ? <CheckCircle2 className="w-4 h-4 text-[#2d6a4f] shrink-0" />
                    : <span className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />}
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#2d6a4f] text-white text-sm font-semibold hover:bg-[#1b4332] disabled:opacity-60 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
