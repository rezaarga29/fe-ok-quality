import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Select from "react-select";
import {
  ChevronRight,
  ChevronLeft,
  Save,
  Search,
  Loader2,
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
  Calendar,
  X,
  Stethoscope,
  MapPin,
  ImageOff,
  Droplet,
  ShieldCheck,
  ShieldAlert,
  BedDouble,
  FileText,
  Users,
  Syringe,
  UserCheck,
  User,
} from "lucide-react";
import {
  getById,
  getAutoFill,
  getJadwal,
  create,
  updateTahap,
  getHasilOperasi,
  getInformedConsent,
  getInformedConsentDetail,
  getKesiapanPindahRuangan,
  getLembarTransferStatus,
  getReferensiTTV,
  getTimMedis,
} from "../../services/ok_quality.service";
import { getPenandaan } from "../../services/penandaan_lokasi.service";
import { getDokterList } from "../../services/dokter.service";
import Swal from "sweetalert2";

// ── Static maps (sama dengan controller) ─────────────────────────────────────
const CARA_MASUK_OPTIONS = [
  "IGD",
  "POLIKLINIK",
  "KEMOTHERAPI",
  "HEMODIALISA",
  "REHAB MEDIK",
  "RAPID ANTIGEN",
  "PCR",
  "PCR SAMPEL",
  "PCR SAMPEL+VTM",
  "MCU",
  "PENUNJANG",
  "RADIOTERAPI",
  "KEDOKTERAN NUKLIR",
  "HOMECARE",
  "ODC",
  "LAIN-LAIN",
];

const ASAL_PASIEN_OPTIONS = [
  "DATANG SENDIRI",
  "REKOM KARYAWAN",
  "DOKTER INTERNAL",
  "KIRIMAN AMBULANCE",
];

const ASA_OPTIONS = ["I", "II", "III", "IV", "V", "VI"];

// ── ASA Physical Status — deskripsi tiap grade ───────────────────────────────
const ASA_DESCRIPTIONS = {
  I: "Pasien sehat, tanpa gangguan organik, fisiologik, biokimia, maupun psikiatrik.",
  II: "Pasien dengan penyakit sistemik ringan–sedang, tanpa keterbatasan fungsional (mis. hipertensi terkontrol, DM terkontrol).",
  III: "Pasien dengan penyakit sistemik berat yang membatasi aktivitas, namun tidak mengancam jiwa.",
  IV: "Pasien dengan penyakit sistemik berat yang secara terus-menerus mengancam jiwa.",
  V: "Pasien sekarat (moribund) yang diperkirakan tidak akan bertahan hidup tanpa dilakukan operasi.",
  VI: "Pasien dengan mati batang otak, organnya akan diambil untuk keperluan donor.",
};

// ── Interpretasi Total GCS (E+M+V) ───────────────────────────────────────────
function gcsInterpretation(total) {
  if (total === null) return null;
  if (total === 15) return "Kesadaran normal (Compos Mentis)";
  if (total >= 13) return "Cedera / penurunan kesadaran ringan";
  if (total >= 9) return "Cedera / penurunan kesadaran sedang";
  return "Cedera / penurunan kesadaran berat";
}

const PENDARAHAN_OPTIONS = [
  "Tidak Ada",
  "Minimal (< 50 cc)",
  "Sedang (50–500 cc)",
  "Banyak (> 500 cc)",
];

const PERLENGKETAN_OPTIONS = ["Tidak Ada", "Ringan", "Sedang", "Berat"];

const KONDISI_LUKA_OPTIONS = [
  "Baik / Kering",
  "Sedikit Rembes",
  "Rembes",
  "Berdarah Aktif",
  "Tanda Infeksi",
];

const RUANGAN_OPTIONS = ["RECOVERY ROOM", "RANAP", "ICU", "HCU"];

// ── Tim medis chip/group (referensi read-only, Tahap 2) ──────────────────────
function PersonChip({ nama, kode }) {
  return (
    <div className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-3 py-2.5">
      <div className="w-8 h-8 shrink-0 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-400">
        <User className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">
          {nama || "—"}
        </p>
        {kode && <p className="text-[11px] text-gray-400">Kode: {kode}</p>}
      </div>
    </div>
  );
}

function TimMedisGroup({ title, icon: Icon, color, people }) {
  if (!people?.length) return null;
  return (
    <div>
      <p
        className={`text-[11px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5 ${color}`}
      >
        <Icon className="w-3.5 h-3.5" /> {title}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {people.map((p, i) => (
          <PersonChip key={`${title}-${i}`} nama={p.nama} kode={p.kode} />
        ))}
      </div>
    </div>
  );
}

// ── Komponen input kecil ─────────────────────────────────────────────────────
function SelectInput({
  autoFilled,
  options,
  placeholder = "— Pilih —",
  ...props
}) {
  return (
    <select
      {...props}
      className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] transition-colors appearance-none bg-white ${
        autoFilled ? "border-emerald-300 bg-emerald-50/50" : "border-gray-200"
      } ${props.disabled ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}`}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}
        {hint && (
          <span className="ml-1.5 font-normal text-gray-400">({hint})</span>
        )}
      </label>
      {children}
    </div>
  );
}

function Input({ autoFilled, ...props }) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] transition-colors ${
        autoFilled
          ? "border-emerald-300 bg-emerald-50/50"
          : "border-gray-200 bg-white"
      } ${props.disabled ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}`}
    />
  );
}

// ── Note box (dipakai untuk Total GCS & deskripsi ASA) ───────────────────────
function NoteBox({ label, value, hint }) {
  return (
    <div className="sm:col-span-2 rounded-xl border border-[#2d6a4f]/15 bg-[#2d6a4f]/5 px-4 py-3">
      <div className="flex items-baseline gap-2">
        <span className="text-xs font-semibold text-gray-600">{label}</span>
        {value && (
          <span className="text-sm font-bold text-[#2d6a4f]">{value}</span>
        )}
      </div>
      {hint && (
        <p className="mt-1 text-xs text-gray-500 leading-relaxed">{hint}</p>
      )}
    </div>
  );
}

function Textarea({ autoFilled, ...props }) {
  return (
    <textarea
      rows={3}
      {...props}
      className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] transition-colors resize-none ${
        autoFilled
          ? "border-emerald-300 bg-emerald-50/50"
          : "border-gray-200 bg-white"
      }`}
    />
  );
}

// ── Step indicator ───────────────────────────────────────────────────────────
const STEPS = [
  { num: 1, label: "Sebelum OP" },
  { num: 2, label: "Waktu OP" },
  { num: 3, label: "Sesudah OP" },
];

function StepIndicator({ current, tahapSelesai = 0 }) {
  return (
    <div className="flex items-center gap-0 mb-6 sm:mb-8">
      {STEPS.map((s, i) => {
        const done = s.num <= tahapSelesai;
        const active = s.num === current;
        const pending = s.num > Math.max(current, tahapSelesai);
        return (
          <div key={s.num} className="flex items-center flex-1 last:flex-none">
            <div
              className={`flex items-center gap-2 ${active || done ? "opacity-100" : "opacity-40"}`}
            >
              <div
                className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  done && !active
                    ? "bg-emerald-500 text-white"
                    : active
                      ? "bg-[#2d6a4f] text-white ring-4 ring-[#2d6a4f]/20"
                      : "bg-gray-200 text-gray-500"
                }`}
              >
                {done && !active ? <CheckCircle2 className="w-4 h-4" /> : s.num}
              </div>
              <span
                className={`text-xs font-semibold hidden sm:block ${active ? "text-[#2d6a4f]" : done ? "text-emerald-600" : "text-gray-400"}`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 sm:mx-3 transition-colors ${s.num < tahapSelesai ? "bg-emerald-400" : "bg-gray-200"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Section card ─────────────────────────────────────────────────────────────
function Section({ title, action, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-700">{title}</h3>
        {action}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

// ── Auto-fill badge ──────────────────────────────────────────────────────────
function AutoFillInfo({ sources }) {
  if (!sources) return null;
  const list = Object.entries(sources)
    .filter(([, v]) => v)
    .map(([k]) => k);
  if (!list.length) return null;
  return (
    <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 mb-4">
      <CheckCircle2 className="w-4 h-4 shrink-0" />
      <span>
        Data otomatis diisi dari: <strong>{list.join(", ")}</strong>. Anda dapat
        mengubahnya.
      </span>
    </div>
  );
}

// ── Informed Consent status (referensi read-only, klik untuk lihat detail) ───
// matched     : Informed Consent ada & PemberiInformasi == DPJP jadwal
// hasRecord   : Informed Consent ada untuk No_Reg ini, tapi belum tentu cocok DPJP
// additional  : No_Reg ini punya lebih dari 1 record Informed Consent
function InformedConsentStatus({ data, onOpenDetail }) {
  if (!data) return null;

  if (data.matched) {
    return (
      <button
        type="button"
        onClick={onOpenDetail}
        className="w-full min-h-11 flex items-center gap-2 flex-wrap bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3.5 text-xs text-emerald-800 hover:bg-emerald-100 active:bg-emerald-200 transition-colors text-left"
      >
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-[#2d6a4f]" />
        <span>
          Informed Consent: <strong>sudah ada</strong>
        </span>
        {data.PemberiInformasi && (
          <span className="text-emerald-600">
            · Pemberi Informasi: <strong>{data.PemberiInformasi}</strong>
          </span>
        )}
        {data.Tanggal && (
          <span className="text-emerald-600">
            · Tanggal: <strong>{String(data.Tanggal).slice(0, 10)}</strong>
          </span>
        )}
        {data.additional && (
          <span className="text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-2 py-0.5">
            + Ada Informed Consent tambahan ({data.count})
          </span>
        )}
        <span className="ml-auto text-emerald-600 font-semibold underline underline-offset-2 shrink-0">
          Lihat detail
        </span>
      </button>
    );
  }

  if (data.hasRecord) {
    return (
      <button
        type="button"
        onClick={onOpenDetail}
        className="w-full min-h-11 flex items-center gap-2 flex-wrap bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5 text-xs text-amber-800 hover:bg-amber-100 active:bg-amber-200 transition-colors text-left"
      >
        <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-amber-600" />
        <span>
          Informed Consent ditemukan, tapi Pemberi Informasi (
          <strong>{data.PemberiInformasi || "-"}</strong>) belum sesuai DPJP
          jadwal (<strong>{data.DPJP_Nama || data.DPJP || "-"}</strong>)
        </span>
        {data.additional && (
          <span className="text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-2 py-0.5">
            + Ada Informed Consent tambahan ({data.count})
          </span>
        )}
        <span className="ml-auto text-amber-700 font-semibold underline underline-offset-2 shrink-0">
          Lihat detail
        </span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-400">
      <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
      <span className="text-xs">Informed Consent belum tersedia</span>
    </div>
  );
}

// ── Baris info kecil dipakai di dalam modal Informed Consent ─────────────────
function IcRow({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm text-gray-700 whitespace-pre-line">{value}</p>
    </div>
  );
}

// ── Section "Isi" (Diagnosis/Kondisi/Tindakan/dll) dipakai di modal ──────────
function IcIsiSection({ label, isi }) {
  if (!isi) return null;
  return (
    <div className="rounded-xl border border-gray-100 px-4 py-3">
      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
        {isi}
      </p>
    </div>
  );
}

// ── Kartu Persetujuan / Penolakan dipakai di modal ────────────────────────────
function IcKeputusanCard({ title, tone, data }) {
  if (!data) return null;
  const toneCls =
    tone === "setuju"
      ? "border-emerald-200 bg-emerald-50/60"
      : "border-rose-200 bg-rose-50/60";
  return (
    <div className={`rounded-xl border ${toneCls} p-4 space-y-2`}>
      <p
        className={`text-xs font-bold uppercase tracking-wide ${tone === "setuju" ? "text-emerald-700" : "text-rose-700"}`}
      >
        {title}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-700">
        <IcRow label="Nama" value={data.nama} />
        <IcRow label="Jenis Kelamin" value={data.jk} />
        <IcRow label="Alamat" value={data.alamat} />
        <IcRow label="Terhadap" value={data.terhadap} />
        <IcRow
          label="Tindakan"
          value={data.tindakan}
        />
        <IcRow label="Menyatakan" value={data.namaMenyatakan} />
        <IcRow label="Saksi Keluarga" value={data.namaKeluarga} />
      </div>
      {(data.ttdMenyatakan || data.ttdKeluarga) && (
        <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100/80">
          {data.ttdMenyatakan && (
            <div>
              <p className="text-[10px] text-gray-400 mb-1">TTD Menyatakan</p>
              <img
                src={`data:image/png;base64,${data.ttdMenyatakan}`}
                alt="TTD menyatakan"
                className="h-16 rounded-lg border border-gray-200 bg-white"
              />
            </div>
          )}
          {data.ttdKeluarga && (
            <div>
              <p className="text-[10px] text-gray-400 mb-1">TTD Keluarga</p>
              <img
                src={`data:image/png;base64,${data.ttdKeluarga}`}
                alt="TTD keluarga"
                className="h-16 rounded-lg border border-gray-200 bg-white"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Modal detail Informed Consent (referensi read-only, Tahap 1 & 2) ─────────
// data : { No_Reg, DPJP, DPJP_Nama, count, records: [...] } — 1 No_Reg bisa
// punya lebih dari 1 Informed Consent (mis. tindakan utama + tambahan),
// makanya semua record ditampilkan lewat tab pemilih, bukan cuma 1 saja.
function InformedConsentModal({ data, loading, onClose }) {
  const records = data?.records || [];
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Default ke record yang "matched" (sesuai DPJP) kalau ada, tiap kali data berubah
  useEffect(() => {
    if (!records.length) return;
    const matchedIdx = records.findIndex((r) => r.matched);
    setSelectedIdx(matchedIdx >= 0 ? matchedIdx : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const record = records[selectedIdx] || null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] shrink-0">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-sm font-bold text-white">
                Detail Informed Consent
              </h2>
              {records.length > 1 && (
                <p className="text-white/60 text-xs">
                  {records.length} record ditemukan untuk No. Reg ini
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-11 min-h-11 flex items-center justify-center rounded-lg text-white/70 hover:bg-white/20 active:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab pemilih record — hanya tampil kalau lebih dari 1 */}
        {records.length > 1 && (
          <div className="flex items-center gap-1.5 px-6 pt-3 overflow-x-auto shrink-0 border-b border-gray-100 pb-3">
            {records.map((r, idx) => (
              <button
                key={r.Id_Consent ?? idx}
                type="button"
                onClick={() => setSelectedIdx(idx)}
                className={`shrink-0 min-h-11 flex flex-col items-start justify-center gap-0.5 px-3.5 py-2.5 rounded-lg border text-left transition-colors ${
                  idx === selectedIdx
                    ? "bg-[#2d6a4f] border-[#2d6a4f] text-white"
                    : "bg-white border-gray-200 text-gray-600 hover:border-[#2d6a4f]/40"
                }`}
              >
                <span className="text-[11px] font-bold whitespace-nowrap flex items-center gap-1">
                  {r.Tanggal ? String(r.Tanggal).slice(0, 10) : `Record ${idx + 1}`}
                  {r.matched && (
                    <ShieldCheck
                      className={`w-3 h-3 ${idx === selectedIdx ? "text-white" : "text-emerald-500"}`}
                    />
                  )}
                </span>
                <span
                  className={`text-[10px] whitespace-nowrap ${idx === selectedIdx ? "text-white/80" : "text-gray-400"}`}
                >
                  {r.PemberiInformasi || "—"}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : !record ? (
            <p className="text-xs text-gray-400 text-center py-6">
              Detail Informed Consent tidak ditemukan.
            </p>
          ) : (
            <>
              {record.matched && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-xs text-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-[#2d6a4f]" />
                  Record ini sesuai dengan DPJP jadwal (
                  <strong>{data.DPJP_Nama || data.DPJP || "-"}</strong>)
                </div>
              )}

              {/* Ringkasan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                <IcRow
                  label="Pemberi Informasi"
                  value={record.PemberiInformasi}
                />
                <IcRow
                  label="Pelaksana Tindakan"
                  value={record.PelaksanaTindakan}
                />
                <IcRow
                  label="Penerima Informasi"
                  value={record.PenerimaInformasi}
                />
                <IcRow
                  label="Tanggal"
                  value={
                    record.Tanggal
                      ? `${String(record.Tanggal).slice(0, 10)}${record.Jam ? ` · ${String(record.Jam).slice(11, 16)}` : ""}`
                      : null
                  }
                />
              </div>

              {/* Informasi tindakan */}
              <div className="space-y-2">
                <IcIsiSection label="Diagnosis" isi={record.Diagnosis?.isi} />
                <IcIsiSection label="Kondisi Pasien" isi={record.Kondisi?.isi} />
                <IcIsiSection
                  label="Nama Tindakan"
                  isi={record.NamaTindakan?.isi}
                />
                <IcIsiSection label="Dasar Tindakan" isi={record.Tindakan?.isi} />
                <IcIsiSection label="Tata Cara" isi={record.TataCara?.isi} />
                <IcIsiSection label="Risiko" isi={record.Risiko?.isi} />
                <IcIsiSection label="Komplikasi" isi={record.Komplikasi?.isi} />
                <IcIsiSection label="Alternatif" isi={record.Alternatif?.isi} />
                <IcIsiSection label="Prognosis" isi={record.Prognosis?.isi} />
                <IcIsiSection
                  label="Hal Tidak Terduga"
                  isi={record.TidakTerduga?.isi}
                />
                <IcIsiSection
                  label="Jika Tindakan Tidak Dilakukan"
                  isi={record.TidakDilakukan?.isi}
                />
                <IcIsiSection label="Lain-lain" isi={record.LainLain} />
              </div>

              {/* Persetujuan / Penolakan */}
              {(record.setuju || record.tolak) && (
                <div className="space-y-3">
                  <IcKeputusanCard
                    title="Persetujuan (Setuju)"
                    tone="setuju"
                    data={record.setuju}
                  />
                  <IcKeputusanCard
                    title="Penolakan (Tolak)"
                    tone="tolak"
                    data={record.tolak}
                  />
                </div>
              )}

              {record.TtdPasien && (
                <div>
                  <p className="text-[11px] text-gray-400 mb-1">TTD Pasien</p>
                  <img
                    src={`data:image/png;base64,${record.TtdPasien}`}
                    alt="TTD pasien"
                    className="h-20 rounded-lg border border-gray-200 bg-white"
                  />
                </div>
              )}
            </>
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

// ── Status bar referensi read-only, klik untuk buka modal daftar record ──────
// Dipakai untuk Kriteria Kesiapan Pindah Ruangan (ASESMEN_MONITORING_PASCA_
// BEDAH) dan Lembar Transfer Pasien (ASESMEN_TRANSFER_PASIEN) — kedua tabel
// ini bisa punya lebih dari 1 record per No_Reg, jadi nilainya tidak lagi
// ditampilkan langsung di form, cukup ringkasan jumlah + tombol buka modal.
function ReferensiStatusBar({ count, icon, label, emptyLabel, onClick }) {
  if (!count) {
    return (
      <div className="sm:col-span-2 flex items-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-400">
        {icon}
        <span className="text-xs">{emptyLabel}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="sm:col-span-2 min-h-11 flex items-center justify-between gap-2 flex-wrap bg-sky-50 border border-sky-200 rounded-xl px-4 py-3.5 text-xs text-sky-800 hover:bg-sky-100 active:bg-sky-200 transition-colors text-left"
    >
      <span className="flex items-center gap-2">
        {icon}
        {label} — <strong>{count}</strong> record ditemukan
      </span>
      <span className="font-semibold text-sky-700">Lihat detail →</span>
    </button>
  );
}

// ── Status Laporan Operasi (referensi read-only) ─────────────────────────────
// Reuse data hasilOperasi (JADWAL_OPERASI_HASIL) yang sudah dimuat untuk
// Tahap 2 — di sini hanya dipakai sebagai penanda sudah/belum diisi
function LaporanOperasiStatus({ data }) {
  if (!data) {
    return (
      <div className="sm:col-span-2 flex items-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-400">
        <FileText className="w-3.5 h-3.5 shrink-0" />
        <span className="text-xs">Laporan Operasi belum diisi</span>
      </div>
    );
  }

  return (
    <div className="sm:col-span-2 flex items-center gap-2 flex-wrap bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-xs text-emerald-800">
      <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-[#2d6a4f]" />
      <span>
        Laporan Operasi: <strong>sudah diisi</strong>
      </span>
    </div>
  );
}

// ── Satu record acuan Monitoring Pasca Bedah, dipakai di dalam modal ─────────
// Dibedakan lewat Tanggal/Jam + Dari Ruang, karena 1 No_Reg bisa punya >1
// record (operasi berulang dalam satu masa rawat).
function PascaBedahRecordCard({ data, onApplyEVM, onApplyVitalSign }) {
  const skor = [
    { label: "Aldrete", nilai: data.Aldrete, isi: data.Aldrete_isi },
    { label: "Bromage", nilai: data.Bromage, isi: data.Bromage_isi },
    { label: "Steward", nilai: data.Steward, isi: data.Steward_isi },
    { label: "PADSS", nilai: data.PADDS, isi: data.PADDS_isi },
  ].filter((s) => s.nilai || s.isi);

  const evmRows = [
    { key: "E", label: "E (Eye)", value: data.E },
    { key: "M", label: "M (Motor)", value: data.M },
    { key: "V", label: "V (Verbal)", value: data.V },
  ];
  const hasEVM = evmRows.some((r) => r.value !== null && r.value !== undefined && r.value !== "");

  const vsRows = [
    { key: "VS_TD",    label: "TD Sistolik (mmHg)",  value: data.VS_TD },
    { key: "VS_TDPer", label: "TD Diastolik (mmHg)", value: data.VS_TDPer },
    { key: "VS_Nadi",  label: "Nadi (bpm)",           value: data.VS_Nadi },
    { key: "VS_RR",    label: "Respirasi (napas/menit)", value: data.VS_RR },
    { key: "VS_SpO2",  label: "Saturasi O2 / SpO2 (%)",  value: data.VS_SpO2 },
  ];
  const hasVS = vsRows.some((r) => r.value !== null && r.value !== undefined && r.value !== "");

  // ICU/HCU/Bangsal adalah CHAR(1) dari SIMRS — sering tidak NULL, cuma diisi
  // "0" saat tidak dipilih. String "0" tetap truthy di JS, jadi cek harus
  // eksplisit menyingkirkan representasi "kosong/tidak dipilih" yang umum,
  // bukan sekadar truthy check.
  const isChecked = (v) => {
    if (v === null || v === undefined) return false;
    const s = String(v).trim().toUpperCase();
    return s !== "" && s !== "0" && s !== "N" && s !== "-";
  };

  const tujuan = [
    isChecked(data.ICU) ? "ICU" : null,
    isChecked(data.HCU) ? "HCU" : null,
    isChecked(data.Bangsal) ? (data.Bangsal_isi || "Bangsal") : null,
  ].filter(Boolean);

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      {/* Header record: Tanggal/Jam + Dari Ruang — pembeda antar record */}
      <div className="flex items-center justify-between flex-wrap gap-2 bg-gray-50 px-4 py-2.5 border-b border-gray-200">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          {data.Tanggal ? String(data.Tanggal).slice(0, 10) : "—"}
          {data.Jam && <span className="text-gray-400 font-normal">· {String(data.Jam).slice(11, 16)}</span>}
        </div>
        {data.DariRuang && (
          <span className="text-[11px] font-medium text-sky-700 bg-sky-100 rounded-full px-2.5 py-1">
            Dari Ruang: {data.DariRuang}
          </span>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Skor pemulihan */}
        {skor.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {skor.map((s) => (
              <div key={s.label} className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{s.label}</p>
                <p className="text-sm font-bold text-gray-800">{s.nilai || "—"}</p>
                {s.isi && <p className="text-[11px] text-gray-500 mt-0.5">{s.isi}</p>}
              </div>
            ))}
          </div>
        )}

        {(tujuan.length > 0 || data.SpO2Sebelum || data.SpO2Setelah) && (
          <div className="flex items-center gap-2 flex-wrap text-[11px] text-sky-700 bg-sky-50 border border-sky-100 rounded-lg px-3 py-2">
            {tujuan.length > 0 && <span>Tujuan: <strong>{tujuan.join(", ")}</strong></span>}
            {data.SpO2Sebelum && <span>· SpO2 Sebelum: <strong>{data.SpO2Sebelum}%</strong></span>}
            {data.SpO2Setelah && <span>· SpO2 Setelah: <strong>{data.SpO2Setelah}%</strong></span>}
          </div>
        )}

        {/* GCS / EVM */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-600">Kondisi Umum (GCS)</p>
            {hasEVM && (
              <button
                type="button"
                onClick={() =>
                  onApplyEVM({
                    GCS_After_E: data.E ?? "",
                    GCS_After_M: data.M ?? "",
                    GCS_After_V: data.V ?? "",
                  })
                }
                className="min-h-11 flex items-center px-3 -my-2 text-[11px] font-semibold text-[#2d6a4f] hover:text-[#1b4332] hover:bg-[#2d6a4f]/10 active:bg-[#2d6a4f]/20 rounded-lg underline underline-offset-2 transition-colors"
              >
                Gunakan
              </button>
            )}
          </div>
          {hasEVM ? (
            <div className="grid grid-cols-3 gap-2">
              {evmRows.map((r) => (
                <div key={r.key} className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{r.label}</p>
                  <p className="text-sm font-bold text-gray-800">{r.value ?? "—"}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">Belum ada data GCS pada record ini.</p>
          )}
        </div>

        {/* Vital Sign */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-600">Vital Sign (Tanda Vital Keluar)</p>
            {hasVS && (
              <button
                type="button"
                onClick={() =>
                  onApplyVitalSign({
                    VS_TD: data.VS_TD ?? "",
                    VS_TDPer: data.VS_TDPer ?? "",
                    VS_Nadi: data.VS_Nadi ?? "",
                    VS_RR: data.VS_RR ?? "",
                    VS_SpO2: data.VS_SpO2 ?? "",
                  })
                }
                className="min-h-11 flex items-center px-3 -my-2 text-[11px] font-semibold text-[#2d6a4f] hover:text-[#1b4332] hover:bg-[#2d6a4f]/10 active:bg-[#2d6a4f]/20 rounded-lg underline underline-offset-2 transition-colors"
              >
                Gunakan
              </button>
            )}
          </div>
          {hasVS ? (
            <div className="grid grid-cols-2 gap-2">
              {vsRows.map((r) => (
                <div key={r.key} className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{r.label}</p>
                  <p className="text-sm font-bold text-gray-800">{r.value ?? "—"}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">Belum ada data vital sign pada record ini.</p>
          )}
        </div>

        {(data.PetugasMenyerahkan || data.PetugasMenerima) && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 border-t border-gray-100 text-[11px] text-gray-500">
            {data.PetugasMenyerahkan && <span>Petugas Menyerahkan: <strong>{data.PetugasMenyerahkan}</strong></span>}
            {data.PetugasMenerima && <span>Petugas Menerima: <strong>{data.PetugasMenerima}</strong></span>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Modal Referensi Pasca Bedah (EVM & Vital Sign) ───────────────────────────
// Menampilkan SEMUA record ASESMEN_MONITORING_PASCA_BEDAH milik No_Reg ini
// (tabel tidak punya No_Jadwal & bisa punya >1 record — mis. operasi
// berulang). User memilih sendiri record yang relevan (dibantu Tanggal/Jam +
// Dari Ruang) sebelum menekan "Gunakan".
function AcuanPascaBedahModal({ records, onClose, onApplyEVM, onApplyVitalSign }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] shrink-0">
          <div className="flex items-center gap-2.5">
            <Droplet className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-sm font-bold text-white">
                Referensi Monitoring Pasca Bedah
              </h2>
              <p className="text-white/60 text-xs">
                {records.length} record ditemukan untuk No. Reg ini
              </p>
            </div>
          </div>
          <button onClick={onClose} className="min-w-11 min-h-11 flex items-center justify-center rounded-lg text-white/70 hover:bg-white/20 active:bg-white/30 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 pt-4 shrink-0">
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5 text-xs text-amber-800">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
            <span>
              Tabel acuan ini tidak terikat No. Jadwal. Cocokkan sendiri lewat
              Tanggal/Jam dan Dari Ruang sebelum menekan "Gunakan", terutama
              jika pasien punya lebih dari satu jadwal operasi.
            </span>
          </div>
        </div>

        {/* Body: daftar record — scrollable */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {records.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">Tidak ada record ditemukan.</p>
          ) : (
            records.map((r, idx) => (
              <PascaBedahRecordCard
                key={r.Id_Transfer ?? idx}
                data={r}
                onApplyEVM={onApplyEVM}
                onApplyVitalSign={onApplyVitalSign}
              />
            ))
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

// ── Modal Lembar Transfer Pasien (referensi read-only) ───────────────────────
// Menampilkan SEMUA record ASESMEN_TRANSFER_PASIEN milik No_Reg ini —
// dibedakan lewat Tanggal/Jam serta Ruang Asal → Ruang Tujuan. Tidak ada
// tombol "Gunakan" — lembar ini murni status/referensi, bukan sumber field
// form Tahap 3.
function LembarTransferModal({ records, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] shrink-0">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-sm font-bold text-white">Lembar Transfer Pasien</h2>
              <p className="text-white/60 text-xs">
                {records.length} record ditemukan untuk No. Reg ini
              </p>
            </div>
          </div>
          <button onClick={onClose} className="min-w-11 min-h-11 flex items-center justify-center rounded-lg text-white/70 hover:bg-white/20 active:bg-white/30 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-3 overflow-y-auto">
          {records.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">Tidak ada record ditemukan.</p>
          ) : (
            records.map((r, idx) => (
              <div key={r.Id_Transfer ?? idx} className="rounded-xl border border-gray-200 px-4 py-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  {r.Tanggal ? String(r.Tanggal).slice(0, 10) : "—"}
                  {r.Jam && <span className="text-gray-400 font-normal">· {String(r.Jam).slice(11, 16)}</span>}
                </div>
                {r.RuangAsal && r.RuangTujuan && (
                  <p className="text-sm text-gray-800">
                    <strong>{r.RuangAsal}</strong> → <strong>{r.RuangTujuan}</strong>
                  </p>
                )}
                {r.TglPindah && (
                  <p className="text-[11px] text-gray-500 mt-1">
                    Tgl Pindah: {String(r.TglPindah).slice(0, 10)}
                    {r.JamPindah && ` · ${String(r.JamPindah).slice(11, 16)}`}
                  </p>
                )}
                {(r.NamaPetugasMenyerahkan || r.NamaPetugasMenerima) && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5 pt-1.5 border-t border-gray-100 text-[11px] text-gray-500">
                    {r.NamaPetugasMenyerahkan && <span>Menyerahkan: <strong>{r.NamaPetugasMenyerahkan}</strong></span>}
                    {r.NamaPetugasMenerima && <span>Menerima: <strong>{r.NamaPetugasMenerima}</strong></span>}
                  </div>
                )}
              </div>
            ))
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

// ── Satu record acuan TTV Sebelum OP, dipakai di dalam modal ─────────────────
// Dibedakan lewat sumber tabel (IGD / Transfer Pasien) + Tanggal/Jam.
function TTVRecordCard({ data, onApply }) {
  const vsRows = [
    { key: "TTV_TD",    label: "TD Sistolik (mmHg)",  value: data.TD },
    { key: "TTV_TDPer", label: "TD Diastolik (mmHg)", value: data.TDPer },
    { key: "TTV_HR",    label: "HR / Nadi (bpm)",     value: data.HR },
    { key: "TTV_Suhu",  label: "Suhu (°C)",           value: data.Suhu },
    { key: "TTV_RR",    label: "Respiratory Rate (x/menit)", value: data.RR },
  ];
  const hasAny = vsRows.some((r) => r.value !== null && r.value !== undefined && r.value !== "");

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between flex-wrap gap-2 bg-gray-50 px-4 py-2.5 border-b border-gray-200">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          {data.Tanggal ? String(data.Tanggal).slice(0, 10) : "—"}
          {data.Jam && <span className="text-gray-400 font-normal">· {String(data.Jam).slice(11, 16)}</span>}
        </div>
        <div className="flex items-center gap-2">
          {data.RuangAsal && data.RuangTujuan && (
            <span className="text-[11px] text-gray-500">{data.RuangAsal} → {data.RuangTujuan}</span>
          )}
          <span className="text-[11px] font-medium text-sky-700 bg-sky-100 rounded-full px-2.5 py-1">
            {data.source}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-600">Tanda-Tanda Vital</p>
          {hasAny && (
            <button
              type="button"
              onClick={() =>
                onApply({
                  TTV_TD: data.TD ?? "",
                  TTV_TDPer: data.TDPer ?? "",
                  TTV_HR: data.HR ?? "",
                  TTV_Suhu: data.Suhu ?? "",
                  TTV_RR: data.RR ?? "",
                })
              }
              className="min-h-11 flex items-center px-3 -my-2 text-[11px] font-semibold text-[#2d6a4f] hover:text-[#1b4332] hover:bg-[#2d6a4f]/10 active:bg-[#2d6a4f]/20 rounded-lg underline underline-offset-2 transition-colors"
            >
              Gunakan
            </button>
          )}
        </div>
        {hasAny ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {vsRows.map((r) => (
              <div key={r.key} className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{r.label}</p>
                <p className="text-sm font-bold text-gray-800">{r.value ?? "—"}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400">Belum ada data vital sign pada record ini.</p>
        )}
      </div>
    </div>
  );
}

// ── Modal Referensi TTV Sebelum OP ────────────────────────────────────────────
// Menampilkan SEMUA kandidat Tanda-Tanda Vital dari ASESMEN_IGD (maks 1
// record — No_Reg adalah PK di tabel itu) dan ASESMEN_TRANSFER_PASIEN (bisa
// >1 record). User memilih sendiri record yang relevan sebelum "Gunakan" —
// tidak ada lagi auto-fill diam-diam untuk TTV.
function ReferensiTTVModal({ records, onClose, onApply }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] shrink-0">
          <div className="flex items-center gap-2.5">
            <Droplet className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-sm font-bold text-white">Referensi Tanda-Tanda Vital</h2>
              <p className="text-white/60 text-xs">
                {records.length} record ditemukan (IGD + Transfer Pasien)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="min-w-11 min-h-11 flex items-center justify-center rounded-lg text-white/70 hover:bg-white/20 active:bg-white/30 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 pt-4 shrink-0">
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5 text-xs text-amber-800">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
            <span>
              Bisa ada lebih dari satu record (mis. beberapa kali transfer).
              Cocokkan lewat Tanggal/Jam dan sumber tabel sebelum menekan
              "Gunakan".
            </span>
          </div>
        </div>

        {/* Body: daftar record — scrollable */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {records.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">Tidak ada record ditemukan.</p>
          ) : (
            records.map((r, idx) => (
              <TTVRecordCard key={`${r.source}-${r.Id_Transfer ?? idx}`} data={r} onApply={onApply} />
            ))
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

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export default function OkQualityForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = !!id;

  // Data jadwal yang di-pass dari halaman Jadwal Operasi
  const jadwalFromState = location.state?.jadwal || null;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoFilling, setAutoFilling] = useState(false);
  const [recordId, setRecordId] = useState(id || null);
  const [tahapSelesai, setTahapSelesai] = useState(0);
  const [autoFillSrc, setAutoFillSrc] = useState(null);
  const [noRegInput, setNoRegInput] = useState("");
  const [dokterOptions, setDokterOptions] = useState([]);

  // ── Jadwal picker state ────────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  const [jadwalDate, setJadwalDate] = useState(today);
  const [jadwalQ, setJadwalQ] = useState("");
  const [jadwalRows, setJadwalRows] = useState([]);
  const [jadwalLoading, setJadwalLoading] = useState(false);
  const [jadwalSearched, setJadwalSearched] = useState(false);
  // Jika dari JadwalOperasiPage, gunakan data yang sudah ada di state
  const [selectedJadwal, setSelectedJadwal] = useState(jadwalFromState);
  const [dpjpSelected, setDpjpSelected] = useState([]); // array of {value, label}

  // ── Penandaan Lokasi Operasi (read-only dari tabel referensi) ────────────────
  const [penandaan, setPenandaan] = useState(null); // { Prosedur, Photo (base64), Tgl_Pasien, Tgl_Dokter }
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [hasilOperasi, setHasilOperasi] = useState(null); // { DarahHilang, JumlahDarahHilang } dari JADWAL_OPERASI_HASIL — referensi saja
  const [informedConsent, setInformedConsent] = useState(null); // { hasRecord, matched, additional, count, ... } dari ASESMEN_INFORMED_CONSENT — referensi saja
  const [icDetail, setIcDetail] = useState(null); // detail lengkap Informed Consent, di-load lazy saat modal dibuka
  const [icDetailLoading, setIcDetailLoading] = useState(false);
  const [showIcModal, setShowIcModal] = useState(false);
  const [kesiapanPindah, setKesiapanPindah] = useState(null); // skor Aldrete/Bromage/Steward/PADSS + GCS/vital sign acuan dari ASESMEN_MONITORING_PASCA_BEDAH — referensi saja
  const [lembarTransfer, setLembarTransfer] = useState(null); // { hasRecord, RuangAsal, RuangTujuan, ... } dari ASESMEN_TRANSFER_PASIEN — referensi saja
  const [referensiTTV, setReferensiTTV] = useState(null); // { hasRecord, count, records } kandidat TTV dari ASESMEN_IGD + ASESMEN_TRANSFER_PASIEN — referensi saja (Tahap 1)
  const [showAcuanModal, setShowAcuanModal] = useState(false); // modal referensi EVM & vital sign pasca bedah (Tahap 3)
  const [showTransferModal, setShowTransferModal] = useState(false); // modal daftar Lembar Transfer Pasien (Tahap 3)
  const [showTTVModal, setShowTTVModal] = useState(false); // modal referensi Tanda-Tanda Vital (Tahap 1)
  const [timMedis, setTimMedis] = useState(null); // { anastesi, penataAnastesi, dokterOperasi, perawatSirkuler, asistenOperator } — referensi saja (Tahap 2)
  const [timMedisModalOpen, setTimMedisModalOpen] = useState(false);

  // Load daftar dokter untuk react-select
  useEffect(() => {
    getDokterList()
      .then((res) => {
        const opts = (res.data || []).map((d) => ({
          value: d.Kode_Dokter,
          label: `${d.Nama_Dokter}${d.Spesialis ? ` — ${d.Spesialis}` : ""}`,
        }));
        setDokterOptions(opts);

        // Restore selected saat edit — cocokkan dari string yang sudah tersimpan
        setDpjpSelected((prev) => {
          if (prev.length > 0) return prev; // sudah ada isinya dari load data
          const saved = form.Join_DPJP_Intra_Op || "";
          if (!saved) return [];
          const labels = saved.split(" | ").map((s) => s.trim());
          return opts.filter((o) => labels.includes(o.label));
        });
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    No_Reg: "",
    No_Jadwal: "", // 1 No_Reg bisa punya >1 jadwal operasi
    No_MR: "",
    Nama_Pasien: "",
    // Tahap 1
    Diagnosa: "",
    Tindakan: "",
    GCS_Before_E: "",
    GCS_Before_M: "",
    GCS_Before_V: "",
    ASA: "",
    TTV_TD: "",
    TTV_TDPer: "",
    TTV_HR: "",
    TTV_Suhu: "",
    TTV_RR: "",
    Cara_Masuk: "",
    Asal_Pasien: "",
    Penyakit_Penyerta: "",
    // Tahap 2
    Pendarahan: "",
    Perlengketan: "",
    Join_DPJP_Intra_Op: "",
    // Tahap 3
    GCS_After_E: "",
    GCS_After_M: "",
    GCS_After_V: "",
    VS_TD: "",
    VS_TDPer: "",
    VS_Nadi: "",
    VS_Suhu: "",
    VS_RR: "",
    VS_SpO2: "",
    Kondisi_Luka_RR: "",
    Kondisi_Luka_Ranap: "",
    Ruangan: "",
  });

  // Track field mana yg di-autofill (untuk highlight hijau)
  const [filledFields, setFilledFields] = useState(new Set());

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  // Terapkan nilai dari modal referensi Monitoring Pasca Bedah ke form.
  // fields: object { formKey: value }. Field yang diisi di-highlight hijau
  // sama seperti autofill lainnya, lalu modal ditutup.
  const applyAcuanPascaBedah = (fields) => {
    setForm((f) => ({ ...f, ...fields }));
    setFilledFields((prev) => {
      const next = new Set(prev);
      Object.keys(fields).forEach((k) => next.add(k));
      return next;
    });
    setShowAcuanModal(false);
  };

  // Terapkan nilai dari modal referensi TTV (Tahap 1) ke form — sama seperti
  // applyAcuanPascaBedah, cuma nutup modal yang berbeda.
  const applyReferensiTTV = (fields) => {
    setForm((f) => ({ ...f, ...fields }));
    setFilledFields((prev) => {
      const next = new Set(prev);
      Object.keys(fields).forEach((k) => next.add(k));
      return next;
    });
    setShowTTVModal(false);
  };

  // ── Load existing record ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    setRecordId(id); // sinkronkan saat pindah antar id (mis. redirect 409)
    getById(id)
      .then((res) => {
        const d = res.data;
        // Split Asal_Pasien "CARA · ASAL" kembali ke dua field
        const [caraMasuk = "", asalPasien = ""] = (d.Asal_Pasien || "").split(
          " · ",
        );

        setForm((f) => ({
          ...f,
          ...Object.fromEntries(
            Object.keys(f)
              .filter((k) => k !== "Cara_Masuk" && k !== "Asal_Pasien")
              .map((k) => [k, d[k] ?? f[k]]),
          ),
          Cara_Masuk: caraMasuk || "",
          Asal_Pasien: asalPasien || "",
        }));
        setNoRegInput(d.No_Reg || "");
        setTahapSelesai(d.Tahap_Selesai || 0);
        // Restore DPJP selected dari string tersimpan
        if (d.Join_DPJP_Intra_Op) {
          const labels = d.Join_DPJP_Intra_Op.split(" | ").map((s) => s.trim());
          setDpjpSelected((prev) =>
            prev.length > 0
              ? prev
              : dokterOptions.filter((o) => labels.includes(o.label)),
          );
          // Simpan juga sebagai fallback label kalau dokterOptions belum load
          setDpjpSelected(labels.map((label) => ({ value: label, label })));
        }
        // Mulai dari tahap berikutnya yang belum selesai
        const nextStep = Math.min((d.Tahap_Selesai || 0) + 1, 3);
        setStep(nextStep);
      })
      .catch(() =>
        Swal.fire({
          icon: "error",
          title: "Gagal memuat data",
          timer: 2000,
          showConfirmButton: false,
        }),
      )
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  // ── Jika dari Jadwal Operasi, langsung auto-fill saat mount ──────────────────
  useEffect(() => {
    if (!jadwalFromState || isEdit) return;
    const noReg = jadwalFromState.No_Reg;
    if (!noReg) return;

    setNoRegInput(noReg);

    // Pre-fill field yang ada di jadwal (tanpa tunggu autoFill)
    setForm((f) => {
      const next = { ...f, No_Reg: noReg };
      if (jadwalFromState.No_Jadwal) next.No_Jadwal = jadwalFromState.No_Jadwal;
      if (jadwalFromState.No_MR) next.No_MR = jadwalFromState.No_MR;
      if (jadwalFromState.Nama_Pasien)
        next.Nama_Pasien = jadwalFromState.Nama_Pasien;
      if (jadwalFromState.Diagnosa) next.Diagnosa = jadwalFromState.Diagnosa;
      if (jadwalFromState.Tindakan) next.Tindakan = jadwalFromState.Tindakan;
      return next;
    });

    const filled = new Set(["No_Reg"]);
    if (jadwalFromState.No_MR) filled.add("No_MR");
    if (jadwalFromState.Nama_Pasien) filled.add("Nama_Pasien");
    if (jadwalFromState.Diagnosa) filled.add("Diagnosa");
    if (jadwalFromState.Tindakan) filled.add("Tindakan");
    setFilledFields(filled);
    setAutoFillSrc({ "Jadwal Operasi": true });

    // Lanjut coba auto-fill tambahan dari tabel referensi
    // Kirim No_Jadwal supaya data diambil dari jadwal yang tepat
    setAutoFilling(true);
    getAutoFill(noReg, jadwalFromState.No_Jadwal)
      .then((res) => {
        const d = res.data;
        const newFilled = new Set(filled);
        setForm((f) => {
          const next = { ...f };
          const map = {
            GCS_Before_E: d.GCS_Before_E,
            GCS_Before_M: d.GCS_Before_M,
            GCS_Before_V: d.GCS_Before_V,
            ASA: d.ASA,
            // TTV (Tanda-Tanda Vital) sengaja TIDAK di-autofill di sini —
            // user pilih sendiri lewat modal "Referensi Vital Sign"
            Cara_Masuk: d.Cara_Masuk,
            Asal_Pasien: d.Asal_Pasien,
            // Ambil data medis dari referensi jika belum ada di jadwal
            ...(!jadwalFromState.Diagnosa && d.Diagnosa
              ? { Diagnosa: d.Diagnosa }
              : {}),
            ...(!jadwalFromState.Tindakan && d.Tindakan
              ? { Tindakan: d.Tindakan }
              : {}),
            ...(!jadwalFromState.No_MR && d.No_MR ? { No_MR: d.No_MR } : {}),
            ...(d._pasien?.Nama_Pasien
              ? { Nama_Pasien: d._pasien.Nama_Pasien }
              : {}),
          };
          Object.entries(map).forEach(([k, v]) => {
            if (v !== null && v !== undefined && v !== "") {
              next[k] = v;
              newFilled.add(k);
            }
          });
          return next;
        });
        setFilledFields(newFilled);
        setAutoFillSrc(
          d._sources
            ? { ...d._sources, "Jadwal Operasi": true }
            : { "Jadwal Operasi": true },
        );
      })
      .catch(() => {})
      .finally(() => setAutoFilling(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-fill dari tabel referensi ─────────────────────────────────────────
  const handleAutoFill = async () => {
    if (!noRegInput.trim()) {
      return Swal.fire({
        icon: "warning",
        title: "Masukkan No. Reg terlebih dahulu",
        timer: 2000,
        showConfirmButton: false,
      });
    }
    setAutoFilling(true);
    try {
      // Manual by No_Reg: BE ambil jadwal terbaru bila ada >1 jadwal
      const res = await getAutoFill(noRegInput.trim());
      const d = res.data;
      const filled = new Set();

      setForm((f) => {
        const next = { ...f, No_Reg: noRegInput.trim() };
        const map = {
          No_Jadwal: d.No_Jadwal,
          No_MR: d.No_MR,
          Nama_Pasien: d._pasien?.Nama_Pasien,
          Diagnosa: d.Diagnosa,
          Tindakan: d.Tindakan,
          GCS_Before_E: d.GCS_Before_E,
          GCS_Before_M: d.GCS_Before_M,
          GCS_Before_V: d.GCS_Before_V,
          ASA: d.ASA,
          // TTV (Tanda-Tanda Vital) sengaja TIDAK di-autofill di sini —
          // user pilih sendiri lewat modal "Referensi Vital Sign"
          Cara_Masuk: d.Cara_Masuk,
          Asal_Pasien: d.Asal_Pasien,
        };
        Object.entries(map).forEach(([k, v]) => {
          if (v !== null && v !== undefined && v !== "") {
            next[k] = v;
            filled.add(k);
          }
        });
        return next;
      });

      setFilledFields(filled);
      setAutoFillSrc(d._sources);
      loadPenandaan(noRegInput.trim());

      Swal.fire({
        icon: "success",
        title: "Data berhasil diisi otomatis",
        text: d._pasien ? `Pasien: ${d._pasien.Nama_Pasien}` : undefined,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal auto-fill",
        text: err?.response?.data?.message || err.message,
        timer: 3000,
        showConfirmButton: false,
      });
    } finally {
      setAutoFilling(false);
    }
  };

  // ── Cari jadwal operasi ────────────────────────────────────────────────────
  const handleJadwalSearch = async () => {
    setJadwalLoading(true);
    setJadwalSearched(true);
    try {
      const params = {};
      if (jadwalDate) params.tanggal = jadwalDate;
      if (jadwalQ.trim()) params.q = jadwalQ.trim();
      const res = await getJadwal(params);
      setJadwalRows(res.data || []);
    } catch {
      setJadwalRows([]);
    } finally {
      setJadwalLoading(false);
    }
  };

  // Pilih jadwal → auto-fill form
  const handleJadwalPilih = async (row) => {
    setSelectedJadwal(row);
    setJadwalRows([]);
    setJadwalSearched(false);
    const noReg = row.No_Reg;
    setNoRegInput(noReg);
    set("No_Reg", noReg);
    set("No_Jadwal", row.No_Jadwal || "");
    // Panggil autoFill untuk ambil data lengkap dari tabel referensi
    // (kirim No_Jadwal — 1 No_Reg bisa punya >1 jadwal)
    setAutoFilling(true);
    try {
      const res = await getAutoFill(noReg, row.No_Jadwal);
      const d = res.data;
      const filled = new Set();
      setForm((f) => {
        const next = { ...f, No_Reg: noReg, No_Jadwal: row.No_Jadwal || "" };
        const map = {
          No_MR: d.No_MR,
          Nama_Pasien: d._pasien?.Nama_Pasien,
          Diagnosa: d.Diagnosa,
          Tindakan: d.Tindakan,
          GCS_Before_E: d.GCS_Before_E,
          GCS_Before_M: d.GCS_Before_M,
          GCS_Before_V: d.GCS_Before_V,
          ASA: d.ASA,
          // TTV (Tanda-Tanda Vital) sengaja TIDAK di-autofill di sini —
          // user pilih sendiri lewat modal "Referensi Vital Sign"
          Cara_Masuk: d.Cara_Masuk,
          Asal_Pasien: d.Asal_Pasien,
        };
        Object.entries(map).forEach(([k, v]) => {
          if (v !== null && v !== undefined && v !== "") {
            next[k] = v;
            filled.add(k);
          }
        });
        return next;
      });
      setFilledFields(filled);
      setAutoFillSrc(d._sources);
      loadPenandaan(noReg);
    } catch {
      // Tetap lanjut walau autoFill gagal — No_Reg sudah terisi
    } finally {
      setAutoFilling(false);
    }
  };

  // ── Load penandaan lokasi by No_Reg (read-only) ───────────────────────────
  const loadPenandaan = async (noReg) => {
    if (!noReg) return;
    try {
      const res = await getPenandaan(noReg);
      if (res.success && res.data) {
        setPenandaan(res.data);
      } else {
        setPenandaan(null);
      }
    } catch {
      setPenandaan(null);
    }
  };

  // Muat saat edit
  useEffect(() => {
    if (isEdit && form.No_Reg) loadPenandaan(form.No_Reg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, form.No_Reg]);

  // Muat saat dari JadwalOperasiPage
  useEffect(() => {
    if (jadwalFromState?.No_Reg) loadPenandaan(jadwalFromState.No_Reg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load hasil operasi by No_Jadwal (read-only referensi) ─────────────────
  const loadHasilOperasi = async (noJadwal) => {
    if (!noJadwal) return;
    try {
      const res = await getHasilOperasi(noJadwal);
      setHasilOperasi(res.success && res.data ? res.data : null);
    } catch {
      setHasilOperasi(null);
    }
  };

  // Muat saat No_Jadwal tersedia di form (isi manual / dari JadwalOperasiPage)
  useEffect(() => {
    if (form.No_Jadwal) loadHasilOperasi(form.No_Jadwal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.No_Jadwal]);

  // ── Load status Informed Consent by No_Jadwal (read-only referensi) ───────
  const loadInformedConsent = async (noJadwal) => {
    if (!noJadwal) return;
    try {
      const res = await getInformedConsent(noJadwal);
      setInformedConsent(res.success && res.data ? res.data : null);
    } catch {
      setInformedConsent(null);
    }
  };

  // Muat saat No_Jadwal tersedia di form (isi manual / dari JadwalOperasiPage)
  useEffect(() => {
    if (form.No_Jadwal) loadInformedConsent(form.No_Jadwal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.No_Jadwal]);

  // Klik status bar Informed Consent → buka modal & lazy-load detail lengkapnya
  const openIcDetail = async () => {
    if (!form.No_Jadwal) return;
    setShowIcModal(true);
    setIcDetailLoading(true);
    try {
      const res = await getInformedConsentDetail(form.No_Jadwal);
      setIcDetail(res.success && res.data ? res.data : null);
    } catch {
      setIcDetail(null);
    } finally {
      setIcDetailLoading(false);
    }
  };

  // ── Load Tim Medis by No_Jadwal (read-only referensi, Tahap 2) ────────────
  const loadTimMedis = async (noJadwal) => {
    if (!noJadwal) return;
    try {
      const res = await getTimMedis(noJadwal);
      setTimMedis(res.success && res.data ? res.data : null);
    } catch {
      setTimMedis(null);
    }
  };

  // Muat saat No_Jadwal tersedia di form (isi manual / dari JadwalOperasiPage)
  useEffect(() => {
    if (form.No_Jadwal) loadTimMedis(form.No_Jadwal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.No_Jadwal]);

  // ── Load kriteria kesiapan pindah ruangan by No_Reg (read-only referensi) ──
  // Skor pemulihan pasca bedah (Aldrete/Bromage/Steward/PADSS), GCS, & vital
  // sign dari ASESMEN_MONITORING_PASCA_BEDAH — tabel ini tidak punya
  // No_Jadwal DAN bisa punya >1 record per No_Reg, jadi SEMUA record
  // dikembalikan ({ hasRecord, count, records }) dan ditampilkan lewat modal
  // (dibedakan Tanggal/Jam + Dari Ruang), bukan langsung di form.
  const loadKesiapanPindah = async (noReg) => {
    if (!noReg) return;
    try {
      const res = await getKesiapanPindahRuangan(noReg);
      setKesiapanPindah(res.success && res.data ? res.data : null);
    } catch {
      setKesiapanPindah(null);
    }
  };

  useEffect(() => {
    if (form.No_Reg) loadKesiapanPindah(form.No_Reg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.No_Reg]);

  // ── Load referensi TTV by No_Reg (read-only, Tahap 1) ─────────────────────
  // Kandidat Tanda-Tanda Vital dari ASESMEN_IGD + ASESMEN_TRANSFER_PASIEN —
  // TIDAK di-autofill otomatis (sumbernya ambigu / bisa >1 record), user
  // pilih sendiri lewat modal referensi.
  const loadReferensiTTV = async (noReg) => {
    if (!noReg) return;
    try {
      const res = await getReferensiTTV(noReg);
      setReferensiTTV(res.success && res.data ? res.data : null);
    } catch {
      setReferensiTTV(null);
    }
  };

  useEffect(() => {
    if (form.No_Reg) loadReferensiTTV(form.No_Reg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.No_Reg]);

  // ── Load status Lembar Transfer by No_Reg (read-only referensi) ───────────
  // dari ASESMEN_TRANSFER_PASIEN — tabel ini tidak terikat No_Jadwal DAN bisa
  // punya >1 record per No_Reg, jadi SEMUA record dikembalikan
  // ({ hasRecord, count, records }) dan ditampilkan lewat modal, dibedakan
  // Tanggal/Jam + Ruang Asal → Ruang Tujuan.
  const loadLembarTransfer = async (noReg) => {
    if (!noReg) return;
    try {
      const res = await getLembarTransferStatus(noReg);
      setLembarTransfer(res.success && res.data ? res.data : null);
    } catch {
      setLembarTransfer(null);
    }
  };

  useEffect(() => {
    if (form.No_Reg) loadLembarTransfer(form.No_Reg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.No_Reg]);

  // ── Auto-fill "RECOVERY ROOM" saat masuk Tahap 3 ──────────────────────────
  useEffect(() => {
    if (step === 3 && !form.Ruangan) {
      set("Ruangan", "RECOVERY ROOM");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // ── Save step ──────────────────────────────────────────────────────────────
  const handleSave = async (goNext = true) => {
    if (!form.No_Reg) {
      return Swal.fire({
        icon: "warning",
        title: "No. Reg wajib diisi",
        timer: 2000,
        showConfirmButton: false,
      });
    }

    setSaving(true);
    try {
      // Gabungkan Cara_Masuk + Asal_Pasien → satu field Asal_Pasien
      const { Cara_Masuk, Asal_Pasien, ...rest } = form;
      const asalKombined =
        [Cara_Masuk, Asal_Pasien].filter(Boolean).join(" · ") || null;
      const payload = { ...rest, Asal_Pasien: asalKombined };

      let res;
      if (!recordId) {
        // Create baru dengan data tahap 1
        res = await create({ ...payload, Tahap_Selesai: step });
        setRecordId(res.data.Id);
      } else {
        // Update tahap yg sedang dikerjakan
        res = await updateTahap(recordId, step, payload);
      }

      const newTahap = res.data.Tahap_Selesai ?? step;
      setTahapSelesai(newTahap);

      // Selesai & keluar ke /home hanya kalau memang lagi ada di tab terakhir
      // (Sesudah OP) dan user pilih "Simpan & Lanjut" / "Selesai". Saat edit
      // tahap 1/2 pada record yang overall-nya sudah "selesai" sebelumnya,
      // newTahap dari BE tetap >= 3 walau step saat ini bukan 3 — makanya
      // pengecekan step === 3 wajib, supaya tidak nyasar balik ke /home.
      if (step === 3 && goNext) {
        await Swal.fire({
          icon: "success",
          title: "Penilaian Selesai!",
          text: "Semua tahap telah diisi.",
          timer: 2500,
          showConfirmButton: false,
        });
        navigate("/home");
        return;
      }

      if (goNext && step < 3) {
        setStep((s) => s + 1);
        Swal.fire({
          icon: "success",
          title: `Tahap ${step} tersimpan`,
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "success",
          title: "Tersimpan",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      // 409 = jadwal ini sudah punya penilaian → tawarkan buka yang sudah ada
      const existingId =
        err?.response?.status === 409 ? err?.response?.data?.data?.Id : null;
      if (existingId) {
        const result = await Swal.fire({
          icon: "info",
          title: "Penilaian sudah ada",
          text: "Jadwal operasi ini sudah memiliki penilaian. Buka penilaian tersebut?",
          showCancelButton: true,
          confirmButtonText: "Buka",
          cancelButtonText: "Batal",
          confirmButtonColor: "#2d6a4f",
        });
        if (result.isConfirmed) {
          navigate(`/ok-quality/form/${existingId}`, { replace: true });
        }
      } else {
        Swal.fire({
          icon: "error",
          title: "Gagal menyimpan",
          text: err?.response?.data?.message || err.message,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Konfirmasi sebelum simpan ──────────────────────────────────────────────
  const confirmSave = async (goNext) => {
    const isFinal = goNext && step === 3;
    const text = isFinal
      ? "Penilaian akan disimpan dan ditandai selesai."
      : goNext
        ? "Data tahap ini akan disimpan, lalu Anda akan lanjut ke tahap berikutnya."
        : "Data pada tahap ini akan disimpan.";

    const result = await Swal.fire({
      icon: "question",
      title: "Apakah Anda yakin?",
      text,
      showCancelButton: true,
      confirmButtonText: "Ya, simpan",
      cancelButtonText: "Batal",
      confirmButtonColor: "#2d6a4f",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      handleSave(goNext);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#2d6a4f]" />
      </div>
    );
  }

  // Referensi Tim Medis (anastesi, dokter operator, perawat) — Tahap 2
  const hasTimMedis =
    !!timMedis &&
    (timMedis.anastesi?.length > 0 ||
      timMedis.penataAnastesi?.length > 0 ||
      timMedis.dokterOperasi?.length > 0 ||
      timMedis.perawatSirkuler?.length > 0 ||
      timMedis.asistenOperator?.length > 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke daftar
      </button>

      {/* Title */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-800">
          {isEdit ? "Edit Penilaian" : "Tambah Penilaian"} OK Quality
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Isi data penilaian sesuai tahap operasi
        </p>
      </div>

      {/* Step indicator */}
      <StepIndicator current={step} tahapSelesai={tahapSelesai} />

      {/* ──────────────────────────────────────────────────────────────
          TAHAP 1: SEBELUM OP
      ────────────────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          {/* ── Cari dari Jadwal Operasi ──────────────────────────────── */}
          {!isEdit && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-4 pb-3 border-b border-gray-100 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-[#2d6a4f]" />
                Cari dari Jadwal Operasi
              </h3>

              {/* Jika sudah ada yang dipilih */}
              {selectedJadwal ? (
                <div className="flex items-start justify-between gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-emerald-800 truncate">
                      {selectedJadwal.Nama_Pasien || "—"}
                    </p>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      No. Reg: <strong>{selectedJadwal.No_Reg}</strong>
                      {" · "}No. MR: <strong>{selectedJadwal.No_MR}</strong>
                      {selectedJadwal.Tanggal
                        ? ` · ${selectedJadwal.Tanggal}`
                        : ""}
                      {selectedJadwal.Kamar ? ` · ${selectedJadwal.Kamar}` : ""}
                    </p>
                    {selectedJadwal.No_Jadwal && (
                      <p className="text-xs text-emerald-700 mt-0.5 font-mono">
                        No. Jadwal: <strong>{selectedJadwal.No_Jadwal}</strong>
                      </p>
                    )}
                    {(selectedJadwal.DPJP_Nama || selectedJadwal.DPJP) && (
                      <p className="text-xs text-emerald-700 mt-0.5 flex items-center gap-1">
                        <Stethoscope className="w-3 h-3 shrink-0" />
                        DPJP:{" "}
                        <strong>
                          {selectedJadwal.DPJP_Nama || selectedJadwal.DPJP}
                        </strong>
                      </p>
                    )}
                    {selectedJadwal.Tindakan && (
                      <p className="text-xs text-emerald-600 mt-0.5 line-clamp-1">
                        {selectedJadwal.Tindakan}
                      </p>
                    )}
                  </div>
                  {/* Jika dari state (JadwalOperasiPage), tidak tampilkan X — sudah commit */}
                  {!jadwalFromState && (
                    <button
                      onClick={() => {
                        setSelectedJadwal(null);
                        setJadwalRows([]);
                        setJadwalSearched(false);
                        // Reset field yang diisi dari jadwal
                        setNoRegInput("");
                        setFilledFields(new Set());
                        setAutoFillSrc(null);
                        setForm((f) => ({
                          ...f,
                          No_Reg: "",
                          No_Jadwal: "",
                          No_MR: "",
                          Nama_Pasien: "",
                          Diagnosa: "",
                          Tindakan: "",
                          GCS_Before_E: "",
                          GCS_Before_M: "",
                          GCS_Before_V: "",
                          ASA: "",
                          TTV_TD: "",
                          TTV_TDPer: "",
                          TTV_HR: "",
                          TTV_Suhu: "",
                          TTV_RR: "",
                          Cara_Masuk: "",
                          Asal_Pasien: "",
                        }));
                      }}
                      className="shrink-0 text-emerald-600 hover:text-emerald-900 transition-colors"
                      title="Ganti jadwal"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Filter & search bar */}
                  <div className="flex flex-col sm:flex-row gap-2 mb-3">
                    <div className="flex items-center gap-1.5 border border-gray-200 rounded-xl px-3 bg-white">
                      <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <input
                        type="date"
                        value={jadwalDate}
                        onChange={(e) => setJadwalDate(e.target.value)}
                        className="text-sm py-2 bg-transparent outline-none w-full"
                      />
                    </div>
                    <div className="flex flex-1 gap-2">
                      <input
                        type="text"
                        value={jadwalQ}
                        onChange={(e) => setJadwalQ(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleJadwalSearch()
                        }
                        placeholder="No. MR / No. Reg / No. Jadwal / Nama Pasien"
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f]"
                      />
                      <button
                        onClick={handleJadwalSearch}
                        disabled={jadwalLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#2d6a4f] text-white text-xs font-semibold hover:bg-[#1b4332] disabled:opacity-60 transition-colors shrink-0"
                      >
                        {jadwalLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline">Cari</span>
                      </button>
                    </div>
                  </div>

                  {/* Hasil pencarian */}
                  {jadwalSearched &&
                    (jadwalLoading ? (
                      <div className="flex justify-center py-6">
                        <Loader2 className="w-5 h-5 animate-spin text-[#2d6a4f]" />
                      </div>
                    ) : jadwalRows.length === 0 ? (
                      <p className="text-center text-xs text-gray-400 py-4">
                        Tidak ada jadwal ditemukan
                      </p>
                    ) : (
                      <div className="border border-gray-100 rounded-xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-gray-50">
                        {jadwalRows.map((row) => (
                          <button
                            key={row.No_Jadwal}
                            onClick={() => handleJadwalPilih(row)}
                            className="w-full text-left px-4 py-3 hover:bg-emerald-50 transition-colors group"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-semibold text-gray-800 group-hover:text-emerald-800 truncate">
                                {row.Nama_Pasien || "—"}
                              </span>
                              <span className="text-xs text-gray-400 shrink-0">
                                {row.Tanggal}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              No. Reg: <strong>{row.No_Reg}</strong>
                              {" · "}No. MR: <strong>{row.No_MR}</strong>
                              {row.Kamar ? ` · ${row.Kamar}` : ""}
                            </div>
                            <div className="text-[11px] text-emerald-700 font-mono mt-0.5">
                              Jadwal: {row.No_Jadwal}
                              {row.Jam ? ` · ${row.Jam}` : ""}
                            </div>
                            {row.Tindakan && (
                              <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                                {row.Tindakan}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    ))}
                </>
              )}
            </div>
          )}

          {/* No Reg + Auto-fill (manual / edit mode) */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-4 pb-3 border-b border-gray-100">
              Identifikasi Pasien
            </h3>
            <div className="flex gap-2 mb-4">
              <div className="flex-1">
                <Field label="No. Registrasi" hint="wajib">
                  <Input
                    value={noRegInput}
                    onChange={(e) => {
                      setNoRegInput(e.target.value);
                      set("No_Reg", e.target.value);
                    }}
                    placeholder="Contoh: 2504000001"
                  />
                </Field>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleAutoFill}
                  disabled={autoFilling}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                  title="Auto-fill dari data referensi"
                >
                  {autoFilling ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">Auto-fill</span>
                </button>
              </div>
            </div>

            <AutoFillInfo sources={autoFillSrc} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="No. MR">
                <Input
                  value={form.No_MR}
                  onChange={(e) => set("No_MR", e.target.value)}
                  autoFilled={filledFields.has("No_MR")}
                  placeholder="-"
                />
              </Field>
              <Field label="Cara Masuk">
                <SelectInput
                  value={form.Cara_Masuk}
                  onChange={(e) => set("Cara_Masuk", e.target.value)}
                  options={CARA_MASUK_OPTIONS}
                  autoFilled={filledFields.has("Cara_Masuk")}
                  placeholder="— Pilih Cara Masuk —"
                />
              </Field>
              <Field label="Asal Pasien">
                <SelectInput
                  value={form.Asal_Pasien}
                  onChange={(e) => set("Asal_Pasien", e.target.value)}
                  options={ASAL_PASIEN_OPTIONS}
                  autoFilled={filledFields.has("Asal_Pasien")}
                  placeholder="— Pilih Asal Pasien —"
                />
              </Field>
            </div>
          </div>

          <Section title="Diagnosa & Tindakan">
            <div className="sm:col-span-2">
              <Field label="Diagnosa">
                <Textarea
                  value={form.Diagnosa}
                  onChange={(e) => set("Diagnosa", e.target.value)}
                  autoFilled={filledFields.has("Diagnosa")}
                  placeholder="Diagnosa kerja..."
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Tindakan">
                <Textarea
                  value={form.Tindakan}
                  onChange={(e) => set("Tindakan", e.target.value)}
                  autoFilled={filledFields.has("Tindakan")}
                  placeholder="Tindakan operasi..."
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Penyakit Penyerta">
                <Textarea
                  value={form.Penyakit_Penyerta}
                  onChange={(e) => set("Penyakit_Penyerta", e.target.value)}
                  placeholder="Penyakit penyerta..."
                />
              </Field>
            </div>
          </Section>

          <Section title="Kondisi Umum Sebelum Operasi">
            <Field label="E (Eye)">
              <Input
                type="number"
                value={form.GCS_Before_E}
                onChange={(e) => set("GCS_Before_E", e.target.value)}
                autoFilled={filledFields.has("GCS_Before_E")}
                placeholder="1-4"
              />
            </Field>
            <Field label="M (Motor)">
              <Input
                type="number"
                value={form.GCS_Before_M}
                onChange={(e) => set("GCS_Before_M", e.target.value)}
                autoFilled={filledFields.has("GCS_Before_M")}
                placeholder="1-6"
              />
            </Field>
            <Field label="V (Verbal)">
              <Input
                value={form.GCS_Before_V}
                onChange={(e) => set("GCS_Before_V", e.target.value)}
                autoFilled={filledFields.has("GCS_Before_V")}
                placeholder="1-5"
              />
            </Field>
            {(() => {
              const e = parseInt(form.GCS_Before_E, 10);
              const m = parseInt(form.GCS_Before_M, 10);
              const v = parseInt(form.GCS_Before_V, 10);
              const hasAny =
                !Number.isNaN(e) || !Number.isNaN(m) || !Number.isNaN(v);
              if (!hasAny) return null;
              const total =
                (Number.isNaN(e) ? 0 : e) +
                (Number.isNaN(m) ? 0 : m) +
                (Number.isNaN(v) ? 0 : v);
              const complete =
                !Number.isNaN(e) && !Number.isNaN(m) && !Number.isNaN(v);
              return (
                <NoteBox
                  label="Total GCS:"
                  value={
                    complete ? `${total} / 15` : `${total} / 15 (belum lengkap)`
                  }
                  hint={
                    complete
                      ? gcsInterpretation(total)
                      : "Lengkapi nilai E, M, dan V untuk interpretasi total GCS."
                  }
                />
              );
            })()}
          </Section>

          <InformedConsentStatus
            data={informedConsent}
            onOpenDetail={openIcDetail}
          />

          <Section title="ASA Grade">
            <Field label="ASA Grade">
              <SelectInput
                value={form.ASA}
                onChange={(e) => set("ASA", e.target.value)}
                options={ASA_OPTIONS}
                autoFilled={filledFields.has("ASA")}
                placeholder="— Pilih ASA —"
              />
            </Field>
            {form.ASA && (
              <NoteBox
                label={`ASA ${form.ASA}:`}
                value=""
                hint={ASA_DESCRIPTIONS[form.ASA]}
              />
            )}
          </Section>

          <Section
            title="Tanda-Tanda Vital"
            action={
              referensiTTV?.hasRecord && (
                <button
                  type="button"
                  onClick={() => setShowTTVModal(true)}
                  className="inline-flex items-center gap-1.5 min-h-11 text-xs font-semibold text-emerald-700 border border-emerald-200 bg-emerald-50 shadow-sm hover:bg-emerald-100 hover:border-emerald-300 active:bg-emerald-200 rounded-lg px-3.5 py-2.5 transition-colors"
                >
                  <Droplet className="w-3.5 h-3.5" />
                  Referensi Vital Sign ({referensiTTV.count})
                </button>
              )
            }
          >
            <Field label="TD Sistolik (mmHg)">
              <Input
                type="number"
                value={form.TTV_TD}
                onChange={(e) => set("TTV_TD", e.target.value)}
                autoFilled={filledFields.has("TTV_TD")}
                placeholder="120"
              />
            </Field>
            <Field label="TD Diastolik (mmHg)">
              <Input
                type="number"
                value={form.TTV_TDPer}
                onChange={(e) => set("TTV_TDPer", e.target.value)}
                autoFilled={filledFields.has("TTV_TDPer")}
                placeholder="80"
              />
            </Field>
            <Field label="HR / Nadi (bpm)">
              <Input
                type="number"
                value={form.TTV_HR}
                onChange={(e) => set("TTV_HR", e.target.value)}
                autoFilled={filledFields.has("TTV_HR")}
                placeholder="80"
              />
            </Field>
            <Field label="Suhu (°C)">
              <Input
                type="number"
                step="0.1"
                value={form.TTV_Suhu}
                onChange={(e) => set("TTV_Suhu", e.target.value)}
                autoFilled={filledFields.has("TTV_Suhu")}
                placeholder="36.5"
              />
            </Field>
            <Field label="Respiratory Rate (x/menit)">
              <Input
                type="number"
                value={form.TTV_RR}
                onChange={(e) => set("TTV_RR", e.target.value)}
                autoFilled={filledFields.has("TTV_RR")}
                placeholder="20"
              />
            </Field>
          </Section>

          {showTTVModal && (
            <ReferensiTTVModal
              records={referensiTTV?.records || []}
              onClose={() => setShowTTVModal(false)}
              onApply={applyReferensiTTV}
            />
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────
          TAHAP 2: WAKTU OP
      ────────────────────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Info jadwal / DPJP + referensi Tim Medis */}
          {(selectedJadwal &&
            (selectedJadwal.DPJP_Nama || selectedJadwal.DPJP) ||
            hasTimMedis) && (
            <div className="flex items-center justify-between gap-2 flex-wrap bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-xs text-emerald-800">
              <div className="flex items-center gap-2 flex-wrap">
                {selectedJadwal &&
                  (selectedJadwal.DPJP_Nama || selectedJadwal.DPJP) && (
                    <>
                      <Stethoscope className="w-3.5 h-3.5 shrink-0 text-[#2d6a4f]" />
                      <span>
                        DPJP:{" "}
                        <strong>
                          {selectedJadwal.DPJP_Nama || selectedJadwal.DPJP}
                        </strong>
                      </span>
                      {selectedJadwal.Kamar && (
                        <span className="text-emerald-600 ml-2">
                          · Kamar: <strong>{selectedJadwal.Kamar}</strong>
                        </span>
                      )}
                    </>
                  )}
              </div>
              {hasTimMedis && (
                <button
                  type="button"
                  onClick={() => setTimMedisModalOpen(true)}
                  className="inline-flex items-center gap-1.5 min-h-11 px-3.5 py-2.5 rounded-lg border border-indigo-200 bg-indigo-50 shadow-sm text-indigo-600 text-xs font-semibold hover:bg-indigo-100 hover:border-indigo-300 active:bg-indigo-200 transition-colors shrink-0"
                >
                  <Users className="w-3.5 h-3.5" />
                  Tim Medis
                </button>
              )}
            </div>
          )}
          {/* ── Penandaan Lokasi Operasi (read-only referensi) ────────── */}
          {penandaan !== null && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
              <h3 className="text-sm font-bold text-gray-700 mb-4 pb-3 border-b border-gray-100 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#2d6a4f]" />
                Penandaan Lokasi Operasi
              </h3>

              {penandaan.Prosedur && (
                <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                  {penandaan.Prosedur}
                </p>
              )}

              {penandaan.Photo ? (
                <>
                  <div
                    onClick={() => setPhotoModalOpen(true)}
                    className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center cursor-zoom-in relative group"
                  >
                    <img
                      src={`data:image/jpeg;base64,${penandaan.Photo}`}
                      alt="Foto penandaan lokasi operasi"
                      className="max-h-56 max-w-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-xs rounded-full px-3 py-1.5 flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5" />
                        Perbesar
                      </span>
                    </div>
                  </div>

                  {/* Modal foto */}
                  {photoModalOpen && (
                    <div
                      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                      onClick={() => setPhotoModalOpen(false)}
                    >
                      <div
                        className="relative max-w-3xl w-full"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setPhotoModalOpen(false)}
                          className="absolute -top-3 -right-3 z-10 w-11 h-11 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 active:bg-gray-100 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
                          <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-[#2d6a4f]" />
                            <span className="text-sm font-semibold text-gray-700">
                              Foto Penandaan Lokasi Operasi
                            </span>
                          </div>
                          <div className="p-4 flex items-center justify-center bg-gray-50">
                            <img
                              src={`data:image/jpeg;base64,${penandaan.Photo}`}
                              alt="Foto penandaan lokasi operasi"
                              className="max-h-[70vh] max-w-full object-contain rounded-lg"
                            />
                          </div>
                          {penandaan.Prosedur && (
                            <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                              <p className="text-xs text-gray-500 font-medium mb-1">
                                Prosedur
                              </p>
                              <p className="text-sm text-gray-700">
                                {penandaan.Prosedur}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-gray-400">
                  <ImageOff className="w-5 h-5 shrink-0" />
                  <span className="text-xs">Foto penandaan belum tersedia</span>
                </div>
              )}

              {(penandaan.Tgl_Pasien || penandaan.Tgl_Dokter) && (
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
                  {penandaan.Tgl_Pasien && (
                    <span>
                      Tgl. Pasien:{" "}
                      <strong>{penandaan.Tgl_Pasien?.slice(0, 10)}</strong>
                    </span>
                  )}
                  {penandaan.Tgl_Dokter && (
                    <span>
                      Tgl. Dokter:{" "}
                      <strong>{penandaan.Tgl_Dokter?.slice(0, 10)}</strong>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          <Section title="Kondisi Selama Operasi">
            {hasilOperasi &&
              (hasilOperasi.DarahHilang || hasilOperasi.JumlahDarahHilang) && (
                <div className="sm:col-span-2 flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5 text-xs text-rose-800 mb-2">
                  <Droplet className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  <span className="text-rose-500">
                    Referensi dari data operasi:
                  </span>
                  {hasilOperasi.DarahHilang && (
                    <span>
                      Darah Hilang: <strong>{hasilOperasi.DarahHilang}</strong>
                    </span>
                  )}
                  {hasilOperasi.JumlahDarahHilang && (
                    <span>
                      · Jumlah Darah Hilang:{" "}
                      <strong>{hasilOperasi.JumlahDarahHilang} CC</strong>
                    </span>
                  )}
                </div>
              )}
            <div className="sm:col-span-2">
              <Field label="Pendarahan">
                <SelectInput
                  value={form.Pendarahan}
                  onChange={(e) => set("Pendarahan", e.target.value)}
                  options={PENDARAHAN_OPTIONS}
                  placeholder="— Pilih kondisi pendarahan —"
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Perlengketan">
                <SelectInput
                  value={form.Perlengketan}
                  onChange={(e) => set("Perlengketan", e.target.value)}
                  options={PERLENGKETAN_OPTIONS}
                  placeholder="— Pilih kondisi perlengketan —"
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field
                label="Join DPJP Intra Operasi"
                hint="bisa pilih lebih dari 1"
              >
                <Select
                  isMulti
                  options={dokterOptions}
                  value={dpjpSelected}
                  onChange={(selected) => {
                    const arr = selected || [];
                    setDpjpSelected(arr);
                    set(
                      "Join_DPJP_Intra_Op",
                      arr.map((s) => s.label).join(" | "),
                    );
                  }}
                  placeholder="Cari dan pilih DPJP..."
                  noOptionsMessage={() => "Dokter tidak ditemukan"}
                  isClearable
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    control: (base, state) => ({
                      ...base,
                      borderRadius: "0.75rem",
                      borderColor: state.isFocused ? "#2d6a4f" : "#e5e7eb",
                      boxShadow: state.isFocused
                        ? "0 0 0 2px rgba(45,106,79,0.2)"
                        : "none",
                      fontSize: "0.875rem",
                      minHeight: "2.5rem",
                      "&:hover": { borderColor: "#2d6a4f" },
                    }),
                    option: (base, state) => ({
                      ...base,
                      fontSize: "0.875rem",
                      backgroundColor: state.isSelected
                        ? "#2d6a4f"
                        : state.isFocused
                          ? "#d1fae5"
                          : "white",
                      color: state.isSelected ? "white" : "#1f2937",
                    }),
                    multiValue: (base) => ({
                      ...base,
                      backgroundColor: "#d1fae5",
                      borderRadius: "0.5rem",
                    }),
                    multiValueLabel: (base) => ({
                      ...base,
                      color: "#065f46",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                    }),
                    multiValueRemove: (base) => ({
                      ...base,
                      color: "#065f46",
                      borderRadius: "0 0.5rem 0.5rem 0",
                      "&:hover": {
                        backgroundColor: "#6ee7b7",
                        color: "#064e3b",
                      },
                    }),
                    placeholder: (base) => ({
                      ...base,
                      color: "#9ca3af",
                      fontSize: "0.875rem",
                    }),
                    menu: (base) => ({
                      ...base,
                      borderRadius: "0.75rem",
                      overflow: "hidden",
                    }),
                  }}
                />
              </Field>
            </div>
          </Section>

          <InformedConsentStatus
            data={informedConsent}
            onOpenDetail={openIcDetail}
          />
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────
          TAHAP 3: SESUDAH OP
      ────────────────────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-4">
          {/* Info jadwal / DPJP */}
          {selectedJadwal &&
            (selectedJadwal.DPJP_Nama || selectedJadwal.DPJP) && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-xs text-emerald-800">
                <Stethoscope className="w-3.5 h-3.5 shrink-0 text-[#2d6a4f]" />
                <span>
                  DPJP:{" "}
                  <strong>
                    {selectedJadwal.DPJP_Nama || selectedJadwal.DPJP}
                  </strong>
                </span>
                {selectedJadwal.Kamar && (
                  <span className="text-emerald-600 ml-2">
                    · Kamar: <strong>{selectedJadwal.Kamar}</strong>
                  </span>
                )}
              </div>
            )}
          <Section
            title="Kondisi Umum Sesudah Operasi"
            action={
              kesiapanPindah?.hasRecord && (
                <button
                  type="button"
                  onClick={() => setShowAcuanModal(true)}
                  className="inline-flex items-center gap-1.5 min-h-11 text-xs font-semibold text-emerald-700 border border-emerald-200 bg-emerald-50 shadow-sm hover:bg-emerald-100 hover:border-emerald-300 active:bg-emerald-200 rounded-lg px-3.5 py-2.5 transition-colors"
                >
                  <Droplet className="w-3.5 h-3.5" />
                  Referensi Pasca Bedah
                </button>
              )
            }
          >
            <Field label="E (Eye)">
              <Input
                type="number"
                value={form.GCS_After_E}
                onChange={(e) => set("GCS_After_E", e.target.value)}
                placeholder="1-4"
                autoFilled={filledFields.has("GCS_After_E")}
              />
            </Field>
            <Field label="M (Motor)">
              <Input
                type="number"
                value={form.GCS_After_M}
                onChange={(e) => set("GCS_After_M", e.target.value)}
                placeholder="1-6"
                autoFilled={filledFields.has("GCS_After_M")}
              />
            </Field>
            <Field label="V (Verbal)">
              <Input
                value={form.GCS_After_V}
                onChange={(e) => set("GCS_After_V", e.target.value)}
                placeholder="1-5"
                autoFilled={filledFields.has("GCS_After_V")}
              />
            </Field>
            {(() => {
              const e = parseInt(form.GCS_After_E, 10);
              const m = parseInt(form.GCS_After_M, 10);
              const v = parseInt(form.GCS_After_V, 10);
              const hasAny = !Number.isNaN(e) || !Number.isNaN(m) || !Number.isNaN(v);
              if (!hasAny) return null;
              const total = (Number.isNaN(e) ? 0 : e) + (Number.isNaN(m) ? 0 : m) + (Number.isNaN(v) ? 0 : v);
              const complete = !Number.isNaN(e) && !Number.isNaN(m) && !Number.isNaN(v);
              return (
                <NoteBox
                  label="Total GCS:"
                  value={complete ? `${total} / 15` : `${total} / 15 (belum lengkap)`}
                  hint={complete ? gcsInterpretation(total) : "Lengkapi nilai E, M, dan V untuk interpretasi total GCS."}
                />
              );
            })()}
          </Section>

          <Section title="Kriteria Kesiapan Pindah Ruangan">
            <ReferensiStatusBar
              count={kesiapanPindah?.count || 0}
              icon={<BedDouble className="w-3.5 h-3.5 shrink-0" />}
              label="Kriteria Kesiapan Pindah Ruangan (Monitoring Pasca Bedah)"
              emptyLabel="Kriteria kesiapan pindah ruangan belum tersedia — Monitoring Pasca Bedah belum diisi"
              onClick={() => setShowAcuanModal(true)}
            />
          </Section>

          <Section
            title="Vital Sign Pasca Operasi"
            action={
              kesiapanPindah?.hasRecord && (
                <button
                  type="button"
                  onClick={() => setShowAcuanModal(true)}
                  className="inline-flex items-center gap-1.5 min-h-11 text-xs font-semibold text-emerald-700 border border-emerald-200 bg-emerald-50 shadow-sm hover:bg-emerald-100 hover:border-emerald-300 active:bg-emerald-200 rounded-lg px-3.5 py-2.5 transition-colors"
                >
                  <Droplet className="w-3.5 h-3.5" />
                  Referensi Pasca Bedah ({kesiapanPindah.count})
                </button>
              )
            }
          >
            <Field label="TD Sistolik (mmHg)">
              <Input
                type="number"
                value={form.VS_TD}
                onChange={(e) => set("VS_TD", e.target.value)}
                placeholder="120"
                autoFilled={filledFields.has("VS_TD")}
              />
            </Field>
            <Field label="TD Diastolik (mmHg)">
              <Input
                type="number"
                value={form.VS_TDPer}
                onChange={(e) => set("VS_TDPer", e.target.value)}
                placeholder="80"
                autoFilled={filledFields.has("VS_TDPer")}
              />
            </Field>
            <Field label="Nadi (bpm)">
              <Input
                type="number"
                value={form.VS_Nadi}
                onChange={(e) => set("VS_Nadi", e.target.value)}
                placeholder="80"
                autoFilled={filledFields.has("VS_Nadi")}
              />
            </Field>
            <Field label="Suhu (°C)">
              <Input
                type="number"
                step="0.1"
                value={form.VS_Suhu}
                onChange={(e) => set("VS_Suhu", e.target.value)}
                placeholder="36.5"
              />
            </Field>
            <Field label="Respirasi (napas/menit)">
              <Input
                type="number"
                value={form.VS_RR}
                onChange={(e) => set("VS_RR", e.target.value)}
                placeholder="18"
                autoFilled={filledFields.has("VS_RR")}
              />
            </Field>
            <Field label="Saturasi O2 / SpO2 (%)">
              <Input
                type="number"
                value={form.VS_SpO2}
                onChange={(e) => set("VS_SpO2", e.target.value)}
                placeholder="98"
                autoFilled={filledFields.has("VS_SpO2")}
              />
            </Field>
          </Section>

          {showAcuanModal && (
            <AcuanPascaBedahModal
              records={kesiapanPindah?.records || []}
              onClose={() => setShowAcuanModal(false)}
              onApplyEVM={applyAcuanPascaBedah}
              onApplyVitalSign={applyAcuanPascaBedah}
            />
          )}

          {/* Keterangan Lembar Transfer — referensi read-only dari ASESMEN_TRANSFER_PASIEN */}
          <ReferensiStatusBar
            count={lembarTransfer?.count || 0}
            icon={<ShieldCheck className="w-3.5 h-3.5 shrink-0" />}
            label="Lembar Transfer Pasien"
            emptyLabel="Lembar Transfer Pasien belum diisi"
            onClick={() => setShowTransferModal(true)}
          />
          {showTransferModal && (
            <LembarTransferModal
              records={lembarTransfer?.records || []}
              onClose={() => setShowTransferModal(false)}
            />
          )}

          <Section title="Kondisi Luka & Ruangan">
            <div className="sm:col-span-2">
              <Field label="Kondisi Luka di Ruang Pemulihan">
                <SelectInput
                  value={form.Kondisi_Luka_RR}
                  onChange={(e) => set("Kondisi_Luka_RR", e.target.value)}
                  options={KONDISI_LUKA_OPTIONS}
                  placeholder="— Pilih kondisi luka —"
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Kondisi Luka di Ranap">
                <SelectInput
                  value={form.Kondisi_Luka_Ranap}
                  onChange={(e) => set("Kondisi_Luka_Ranap", e.target.value)}
                  options={KONDISI_LUKA_OPTIONS}
                  placeholder="— Pilih kondisi luka —"
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Ruangan">
                <SelectInput
                  value={form.Ruangan}
                  onChange={(e) => set("Ruangan", e.target.value)}
                  options={RUANGAN_OPTIONS}
                  placeholder="— Pilih ruangan —"
                />
              </Field>
            </div>
          </Section>

          {/* Keterangan Laporan Operasi — referensi read-only dari JADWAL_OPERASI_HASIL */}
          <LaporanOperasiStatus data={hasilOperasi} />
        </div>
      )}

      {/* ── Navigation buttons ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
        <button
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Sebelumnya
        </button>

        <div className="flex items-center gap-2">
          {/* Simpan tanpa pindah step */}
          <button
            onClick={() => confirmSave(false)}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#2d6a4f] text-[#2d6a4f] text-sm font-semibold hover:bg-[#2d6a4f]/5 disabled:opacity-60 transition-colors"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Simpan
          </button>

          {/* Simpan & lanjut */}
          {step < 3 ? (
            <button
              onClick={() => confirmSave(true)}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2d6a4f] text-white text-sm font-semibold hover:bg-[#1b4332] disabled:opacity-60 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Simpan & Lanjut
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => confirmSave(true)}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 transition-colors"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Selesai
            </button>
          )}
        </div>
      </div>

      {/* Modal detail Informed Consent — referensi read-only (Tahap 1 & 2) */}
      {showIcModal && (
        <InformedConsentModal
          data={icDetail}
          loading={icDetailLoading}
          onClose={() => setShowIcModal(false)}
        />
      )}

      {/* Modal Tim Medis — referensi anastesi, dokter operator, perawat (Tahap 2) */}
      {timMedisModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setTimMedisModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg max-h-[85vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 shrink-0">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-500">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-gray-700 flex-1">
                Tim Medis
              </h3>
              <button
                type="button"
                onClick={() => setTimMedisModalOpen(false)}
                className="w-11 h-11 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 active:bg-gray-200 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto">
              <TimMedisGroup
                title="Dokter Anastesi"
                icon={Syringe}
                color="text-violet-500"
                people={timMedis?.anastesi}
              />
              <TimMedisGroup
                title="Penata Anastesi"
                icon={UserCheck}
                color="text-violet-400"
                people={timMedis?.penataAnastesi}
              />
              <TimMedisGroup
                title="Dokter Operator"
                icon={Stethoscope}
                color="text-emerald-600"
                people={timMedis?.dokterOperasi}
              />
              <TimMedisGroup
                title="Perawat Sirkuler"
                icon={UserCheck}
                color="text-sky-500"
                people={timMedis?.perawatSirkuler}
              />
              <TimMedisGroup
                title="Asisten Operator"
                icon={UserCheck}
                color="text-sky-400"
                people={timMedis?.asistenOperator}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
