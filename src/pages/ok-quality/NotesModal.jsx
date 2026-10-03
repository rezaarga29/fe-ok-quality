import { useEffect, useState } from "react";
import { StickyNote, X, Loader2, Send, Clock } from "lucide-react";
import Swal from "sweetalert2";
import { getNotes, createNote } from "../../services/ok_quality.service";

// ── Modal Notes per jadwal operasi (role ok-quality-notes) ───────────────────
// User bisa menulis catatan baru dan melihat riwayat catatan yang IA tulis
// sendiri untuk jadwal ini (BE memfilter berdasarkan user login).
// Kunci: No_Jadwal; data lama tanpa No_Jadwal memakai No_Reg.

const MAX_LEN = 4000;

// Tgl_Input dari BE berupa string UTC mentah "YYYY-MM-DD HH:mm:ss.SSS"
// (lihat CONVERT(varchar) di controller) → tampilkan dalam WIB.
function fmtWib(raw) {
  if (!raw) return "-";
  const d = new Date(String(raw).replace(" ", "T") + "Z");
  if (isNaN(d.getTime())) return String(raw);
  return d.toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }) + " WIB";
}

export default function NotesModal({ noJadwal, noReg, namaPasien, onClose, onSaved }) {
  const [notes, setNotes]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [text, setText]       = useState("");
  const [saving, setSaving]   = useState(false);

  const params = noJadwal ? { no_jadwal: noJadwal } : { no_reg: noReg };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getNotes(params);
      setNotes(res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Gagal memuat notes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noJadwal, noReg]);

  // Tutup dengan Escape (kecuali sedang menyimpan)
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && !saving) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const catatan = text.trim();
    if (!catatan) return;
    setSaving(true);
    try {
      const res = await createNote({ No_Jadwal: noJadwal || null, No_Reg: noReg || null, Catatan: catatan });
      if (res?.data) setNotes((prev) => [res.data, ...prev]);
      else await load();
      setText("");
      onSaved?.(); // refresh preview notes di list
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal menyimpan notes",
        text: err?.response?.data?.message || err.message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={() => !saving && onClose()}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <StickyNote className="w-5 h-5 text-white shrink-0" />
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white">Notes</h2>
              <p className="text-white/60 text-xs truncate">
                {namaPasien ? `${namaPasien} · ` : ""}
                {noJadwal ? `Jadwal ${noJadwal}` : `No. Reg ${noReg}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="min-w-11 min-h-11 flex items-center justify-center rounded-lg text-white/70 hover:bg-white/20 active:bg-white/30 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form input */}
        <form onSubmit={handleSubmit} className="px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tulis catatan baru</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
            rows={3}
            autoFocus
            placeholder="Ketik catatan untuk jadwal operasi ini..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] resize-none"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] text-gray-400">{text.length}/{MAX_LEN}</span>
            <button
              type="submit"
              disabled={saving || !text.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2d6a4f] text-white text-xs font-semibold hover:bg-[#1b4332] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Simpan
            </button>
          </div>
        </form>

        {/* Riwayat notes milik user */}
        <div className="px-6 py-4 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-500 mb-3">
            Catatan saya {!loading && !error && `(${notes.length})`}
          </p>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Memuat notes...</span>
            </div>
          ) : error ? (
            <p className="text-sm text-red-500 text-center py-6">{error}</p>
          ) : notes.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Belum ada catatan.</p>
          ) : (
            <ul className="space-y-2.5">
              {notes.map((n) => (
                <li key={n.Id} className="rounded-xl border border-yellow-100 bg-yellow-50/50 px-4 py-3">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{n.Catatan}</p>
                  <p className="flex items-center gap-1 text-[11px] text-gray-400 mt-1.5">
                    <Clock className="w-3 h-3" />
                    {fmtWib(n.Tgl_Input)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
