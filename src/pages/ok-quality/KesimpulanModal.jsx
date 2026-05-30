import { useState, useEffect } from "react";
import { X, ClipboardCheck, Loader2, CheckCircle2 } from "lucide-react";
import { getKesimpulan, createKesimpulan, updateKesimpulan } from "../../services/ok_quality.service";
import Swal from "sweetalert2";

const PENILAIAN_OPTIONS = ["Baik", "Cukup", "Kurang"];

const PENILAIAN_STYLE = {
  Baik:   "bg-emerald-100 text-emerald-700 border-emerald-300",
  Cukup:  "bg-amber-100  text-amber-700  border-amber-300",
  Kurang: "bg-red-100    text-red-700    border-red-300",
};

export default function KesimpulanModal({ penilaianId, namaPassien, noReg, onClose, onSaved }) {
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [isEdit,   setIsEdit]   = useState(false);
  const [form, setForm] = useState({ Penilaian: "", Catatan: "", Rekomendasi: "" });

  useEffect(() => {
    getKesimpulan(penilaianId)
      .then((res) => {
        if (res.data) {
          setIsEdit(true);
          setForm({
            Penilaian:   res.data.Penilaian   || "",
            Catatan:     res.data.Catatan     || "",
            Rekomendasi: res.data.Rekomendasi || "",
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [penilaianId]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.Penilaian) {
      return Swal.fire({ icon: "warning", title: "Pilih penilaian terlebih dahulu", timer: 2000, showConfirmButton: false });
    }
    setSaving(true);
    try {
      if (isEdit) {
        await updateKesimpulan(penilaianId, form);
      } else {
        await createKesimpulan(penilaianId, form);
      }
      Swal.fire({ icon: "success", title: "Kesimpulan tersimpan", timer: 1500, showConfirmButton: false });
      onSaved?.();
      onClose();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal menyimpan", text: err?.response?.data?.message || err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#1b4332] to-[#2d6a4f]">
          <div className="flex items-center gap-2.5">
            <ClipboardCheck className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-sm font-bold text-white">
                {isEdit ? "Edit Kesimpulan" : "Isi Kesimpulan"}
              </h2>
              <p className="text-white/60 text-xs">{namaPassien} · {noReg}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/70 hover:bg-white/20 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#2d6a4f]" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">

            {/* Penilaian */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">
                Penilaian <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2">
                {PENILAIAN_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => set("Penilaian", opt)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all
                      ${form.Penilaian === opt
                        ? `${PENILAIAN_STYLE[opt]} scale-[1.03] shadow-sm`
                        : "bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-300"}`}
                  >
                    {form.Penilaian === opt && <CheckCircle2 className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />}
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Catatan */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Catatan</label>
              <textarea
                rows={3}
                value={form.Catatan}
                onChange={(e) => set("Catatan", e.target.value)}
                placeholder="Narasi / catatan dokter setelah operasi..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] resize-none"
              />
            </div>

            {/* Rekomendasi */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Rekomendasi</label>
              <textarea
                rows={3}
                value={form.Rekomendasi}
                onChange={(e) => set("Rekomendasi", e.target.value)}
                placeholder="Tindak lanjut / rekomendasi dokter..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] resize-none"
              />
            </div>

            {/* Footer */}
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
                {isEdit ? "Update" : "Simpan"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
