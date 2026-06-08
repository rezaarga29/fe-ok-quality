import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Pencil, Loader2, CheckCircle2, Clock,
  AlertCircle, User, Calendar, Stethoscope, Activity,
  Syringe, HeartPulse, BedDouble, ArrowRight,
  ClipboardCheck, ThumbsUp, Minus, ThumbsDown, UserCheck,
} from "lucide-react";
import { getById, getKesimpulan } from "../../services/ok_quality.service";
import Swal from "sweetalert2";

// ── Journey stepper ───────────────────────────────────────────────────────────
const STEPS = ["Sebelum OP", "Waktu OP", "Sesudah OP"];

function JourneyBanner({ tahap = 0, status }) {
  const done = status === "selesai" ? 3 : tahap;
  return (
    <div className="flex items-center gap-0 w-full">
      {STEPS.map((label, i) => {
        const stepNum = i + 1;
        const finished = done >= stepNum;
        const active = stepNum === done + 1 && done < 3;
        const isLast = i === STEPS.length - 1;
        return (
          <div key={label} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center shrink-0">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
                ${
                  finished
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : active
                      ? "bg-amber-400 border-amber-400 text-white ring-4 ring-amber-200"
                      : "bg-white border-gray-200 text-gray-300"
                }`}
              >
                {finished ? <CheckCircle2 className="w-4 h-4" /> : stepNum}
              </div>
              <span
                className={`text-[11px] mt-1.5 font-semibold text-center whitespace-nowrap
                ${finished ? "text-emerald-600" : active ? "text-amber-500" : "text-gray-400"}`}
              >
                {label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`flex-1 h-0.5 mx-1.5 mb-5 rounded-full
                ${done > stepNum ? "bg-emerald-400" : "bg-gray-200"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ tahap = 0, status }) {
  if (status === "selesai")
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">
        <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
      </span>
    );
  if (tahap === 0)
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-500">
        <AlertCircle className="w-3.5 h-3.5" /> Belum Mulai
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-700">
      <Clock className="w-3.5 h-3.5" /> Tahap {tahap}/3
    </span>
  );
}

// ── Info row ──────────────────────────────────────────────────────────────────
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

// ── Section card ──────────────────────────────────────────────────────────────
function Section({
  title,
  icon: Icon,
  color = "text-gray-500",
  children,
  empty,
}) {
  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${empty ? "border-dashed border-gray-200" : "border-gray-100"}`}
    >
      <div
        className={`flex items-center gap-2.5 px-5 py-4 border-b ${empty ? "border-dashed border-gray-200" : "border-gray-100"}`}
      >
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center bg-gray-50 ${color}`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-bold text-gray-700">{title}</h3>
        {empty && (
          <span className="ml-auto text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            Belum diisi
          </span>
        )}
      </div>
      <div className="p-5">
        {empty ? (
          <p className="text-sm text-gray-400 text-center py-4">
            Data belum tersedia
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Vital box ─────────────────────────────────────────────────────────────────
function VitalBox({ label, value, unit, highlight }) {
  const hasVal = value !== null && value !== undefined && value !== "";
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl p-3 text-center
      ${highlight ? "bg-[#2d6a4f]/5 border border-[#2d6a4f]/10" : "bg-gray-50"}`}
    >
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p
        className={`text-xl font-extrabold ${hasVal ? (highlight ? "text-[#2d6a4f]" : "text-gray-800") : "text-gray-300"}`}
      >
        {hasVal ? value : "—"}
      </p>
      {unit && <p className="text-[10px] text-gray-400 mt-0.5">{unit}</p>}
    </div>
  );
}

// ── GCS panel (side-by-side) ──────────────────────────────────────────────────
function GCSPanel({ e, m, v, label, color }) {
  const total =
    (parseFloat(e) || 0) + (parseFloat(m) || 0) + (parseFloat(v) || 0);
  const hasData = e || m || v;
  return (
    <div className="flex flex-col gap-2">
      <p
        className={`text-[11px] font-bold uppercase tracking-widest text-center ${color}`}
      >
        {label}
      </p>
      <div className="grid grid-cols-4 gap-2">
        <VitalBox label="E" value={e} />
        <VitalBox label="M" value={m} />
        <VitalBox label="V" value={v} />
        <VitalBox
          label="Total"
          value={hasData ? total : null}
          unit="/15"
          highlight
        />
      </div>
    </div>
  );
}

// ── Vitals panel (side-by-side) ───────────────────────────────────────────────
function VitalsPanel({ td, tdper, hr, suhu, rr, label, color, showRR }) {
  return (
    <div className="flex flex-col gap-2">
      <p
        className={`text-[11px] font-bold uppercase tracking-widest text-center ${color}`}
      >
        {label}
      </p>
      <div className={`grid gap-2 ${showRR ? "grid-cols-3" : "grid-cols-2"}`}>
        <VitalBox label="TD Sistolik" value={td} unit="mmHg" />
        <VitalBox label="TD Diastolik" value={tdper} unit="mmHg" />
        <VitalBox label={showRR ? "Nadi" : "HR/Nadi"} value={hr} unit="bpm" />
        <VitalBox label="Suhu" value={suhu} unit="°C" />
        {showRR && <VitalBox label="Respiratory Rate" value={rr} unit="x/m" />}
      </div>
    </div>
  );
}

// ── Kesimpulan card ───────────────────────────────────────────────────────────
const PENILAIAN_CFG = {
  Baik:   { bg: "bg-emerald-50",  border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-700", icon: ThumbsUp,   iconColor: "text-emerald-500" },
  Cukup:  { bg: "bg-amber-50",    border: "border-amber-200",   badge: "bg-amber-100 text-amber-700",     icon: Minus,      iconColor: "text-amber-500"   },
  Kurang: { bg: "bg-red-50",      border: "border-red-200",     badge: "bg-red-100 text-red-700",         icon: ThumbsDown, iconColor: "text-red-500"     },
};

function KesimpulanCard({ k }) {
  const cfg  = PENILAIAN_CFG[k.Penilaian] ?? PENILAIAN_CFG["Cukup"];
  const Icon = cfg.icon;
  const tgl  = k.Tgl_Input
    ? new Date(k.Tgl_Input).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className={`rounded-2xl border ${cfg.border} ${cfg.bg} overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-inherit">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-white/70 ${cfg.iconColor}`}>
          <ClipboardCheck className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-bold text-gray-700 flex-1">Kesimpulan Dokter</h3>
        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${cfg.badge}`}>
          <Icon className="w-3.5 h-3.5" />
          {k.Penilaian}
        </span>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-3">
        {k.Catatan && (
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Catatan</p>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{k.Catatan}</p>
          </div>
        )}
        {k.Rekomendasi && (
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Rekomendasi</p>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{k.Rekomendasi}</p>
          </div>
        )}
        <div className="flex items-center gap-1.5 pt-1 text-xs text-gray-400 border-t border-inherit">
          <UserCheck className="w-3.5 h-3.5 shrink-0" />
          <span>{k.NamaUser}</span>
          {tgl && <span className="ml-auto">{tgl}</span>}
        </div>
      </div>
    </div>
  );
}

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;
const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════
export default function OkQualityDetail() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [data,       setData]       = useState(null);
  const [kesimpulan, setKesimpulan] = useState(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    Promise.all([getById(id), getKesimpulan(id)])
      .then(([detailRes, kesimpulanRes]) => {
        setData(detailRes.data);
        setKesimpulan(kesimpulanRes.data || null);
      })
      .catch(() => {
        Swal.fire({ icon: "error", title: "Gagal memuat detail", timer: 2000, showConfirmButton: false });
        navigate("/ok-quality");
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#2d6a4f]" />
      </div>
    );
  if (!data) return null;

  const hasGCSBefore =
    data.GCS_Before_E || data.GCS_Before_M || data.GCS_Before_V;
  const hasGCSAfter = data.GCS_After_E || data.GCS_After_M || data.GCS_After_V;
  const hasGCS = hasGCSBefore || hasGCSAfter;

  const hasTTV = data.TTV_TD || data.TTV_HR || data.TTV_Suhu;
  const hasVS = data.VS_TD || data.VS_Nadi || data.VS_Suhu;
  const hasVitals = hasTTV || hasVS;

  const tahap1Empty =
    !data.Diagnosa && !data.Tindakan && !data.GCS_Before_E && !data.ASA;
  const tahap2Empty =
    !data.Pendarahan && !data.Perlengketan && !data.Join_DPJP_Intra_Op;
  const tahap3Empty =
    !hasGCSAfter && !hasVS && !data.Kondisi_Luka_RR && !data.Ruangan;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-5">
      {/* Back + Edit */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/ok-quality")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </button>
        <button
          onClick={() => navigate(`/ok-quality/form/${id}`)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2d6a4f] text-white text-sm font-semibold hover:bg-[#1b4332] transition-colors shadow"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </button>
      </div>

      {/* Hero card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-[#2d6a4f] to-[#40916c] flex items-center justify-center text-white font-extrabold text-xl">
            {(data.Nama_Pasien ?? "?")
              .split(" ")
              .slice(0, 2)
              .map((w) => w[0])
              .join("")
              .toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-extrabold text-gray-800 truncate">
              {data.Nama_Pasien ?? "—"}
            </h1>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
              <span className="text-xs text-gray-400 font-mono">
                No. Reg: {data.No_Reg}
              </span>
              <span className="text-xs text-gray-400 font-mono">
                No. MR: {data.No_MR ?? "—"}
              </span>
              {data.Tgl_Lahir && (
                <span className="text-xs text-gray-400">
                  {fmtDate(data.Tgl_Lahir)}
                </span>
              )}
              {data.Jenis_Kelamin && (
                <span className="text-xs text-gray-400">
                  {data.Jenis_Kelamin}
                </span>
              )}
            </div>
          </div>
          <StatusBadge tahap={data.Tahap_Selesai} status={data.Status} />
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 mb-5 pb-5 border-b border-gray-100 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {fmtDate(data.Tanggal) ?? "—"}
          </span>
          {data.Kode_Ruang && (
            <span className="flex items-center gap-1.5">
              <BedDouble className="w-3.5 h-3.5" />
              {data.Kode_Ruang}
            </span>
          )}
          {data.Asal_Pasien && (
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              {data.Asal_Pasien}
            </span>
          )}
          {data.NamaUser && (
            <span className="text-gray-400 ml-auto">
              Diisi: <strong className="text-gray-600">{data.NamaUser}</strong>
              {data.Tgl_Update && ` · ${fmtDateTime(data.Tgl_Update)}`}
            </span>
          )}
        </div>

        <JourneyBanner tahap={data.Tahap_Selesai} status={data.Status} />
      </div>

      {/* ── KESIMPULAN DOKTER ───────────────────────────────────────────────── */}
      {kesimpulan && <KesimpulanCard k={kesimpulan} />}

      {/* ── PERBANDINGAN GCS ─────────────────────────────────────────────────── */}
      {hasGCS && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-violet-50 text-violet-500">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-gray-700">
              Perbandingan GCS
            </h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 items-start">
              {/* Before */}
              <div className={!hasGCSBefore ? "opacity-40" : ""}>
                <GCSPanel
                  e={data.GCS_Before_E}
                  m={data.GCS_Before_M}
                  v={data.GCS_Before_V}
                  label="Sebelum Operasi"
                  color="text-sky-500"
                />
              </div>

              {/* Divider arrow */}
              <div className="hidden sm:flex items-center justify-center pt-6">
                <ArrowRight className="w-5 h-5 text-gray-300" />
              </div>
              <div className="sm:hidden flex justify-center">
                <div className="w-8 h-0.5 bg-gray-200 rounded-full my-1" />
              </div>

              {/* After */}
              <div className={!hasGCSAfter ? "opacity-40" : ""}>
                <GCSPanel
                  e={data.GCS_After_E}
                  m={data.GCS_After_M}
                  v={data.GCS_After_V}
                  label="Sesudah Operasi"
                  color="text-emerald-600"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PERBANDINGAN VITAL SIGN ──────────────────────────────────────────── */}
      {hasVitals && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-rose-50 text-rose-500">
              <HeartPulse className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-gray-700">
              Perbandingan Tanda Vital
            </h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 items-start">
              {/* TTV Before */}
              <div className={!hasTTV ? "opacity-40" : ""}>
                <VitalsPanel
                  td={data.TTV_TD}
                  tdper={data.TTV_TDPer}
                  hr={data.TTV_HR}
                  suhu={data.TTV_Suhu}
                  label="Tanda Vital Sebelum Operasi"
                  color="text-sky-500"
                  showRR={false}
                />
              </div>

              {/* Divider arrow */}
              <div className="hidden sm:flex items-center justify-center pt-6">
                <ArrowRight className="w-5 h-5 text-gray-300" />
              </div>
              <div className="sm:hidden flex justify-center">
                <div className="w-8 h-0.5 bg-gray-200 rounded-full my-1" />
              </div>

              {/* VS After */}
              <div className={!hasVS ? "opacity-40" : ""}>
                <VitalsPanel
                  td={data.VS_TD}
                  tdper={data.VS_TDPer}
                  hr={data.VS_Nadi}
                  suhu={data.VS_Suhu}
                  rr={data.VS_RR}
                  label="Tanda Vital Sesudah Operasi"
                  color="text-emerald-600"
                  showRR={true}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 3 TAHAP — 1 ROW ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Tahap 1 */}
        <div className="flex flex-col gap-1">
          <p className="text-xs font-bold text-sky-500 uppercase tracking-widest mb-2 px-1 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-sky-100 flex items-center justify-center text-[10px] font-extrabold">
              1
            </span>
            Sebelum Operasi
          </p>
          <div
            className={`bg-white rounded-2xl border shadow-sm overflow-hidden flex-1 ${tahap1Empty ? "border-dashed border-gray-200" : "border-gray-100"}`}
          >
            <div
              className={`flex items-center gap-2 px-4 py-3 border-b ${tahap1Empty ? "border-dashed border-gray-200" : "border-gray-100"}`}
            >
              <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-sky-50 text-sky-500">
                <Stethoscope className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-gray-700">
                Diagnosa & Tindakan
              </span>
              {tahap1Empty && (
                <span className="ml-auto text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  Belum diisi
                </span>
              )}
            </div>
            <div className="p-4">
              {tahap1Empty ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  Data belum tersedia
                </p>
              ) : (
                <div className="space-y-3">
                  <InfoRow label="Diagnosa" value={data.Diagnosa} />
                  <InfoRow label="Tindakan" value={data.Tindakan} />
                  <InfoRow
                    label="Penyakit Penyerta"
                    value={data.Penyakit_Penyerta}
                  />
                  <InfoRow label="Asal Pasien" value={data.Asal_Pasien} />
                  <InfoRow label="ASA Grade" value={data.ASA} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tahap 2 */}
        <div className="flex flex-col gap-1">
          <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-2 px-1 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-[10px] font-extrabold">
              2
            </span>
            Waktu Operasi
          </p>
          <div
            className={`bg-white rounded-2xl border shadow-sm overflow-hidden flex-1 ${tahap2Empty ? "border-dashed border-gray-200" : "border-gray-100"}`}
          >
            <div
              className={`flex items-center gap-2 px-4 py-3 border-b ${tahap2Empty ? "border-dashed border-gray-200" : "border-gray-100"}`}
            >
              <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-amber-50 text-amber-500">
                <Syringe className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-gray-700">
                Kondisi Selama Operasi
              </span>
              {tahap2Empty && (
                <span className="ml-auto text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  Belum diisi
                </span>
              )}
            </div>
            <div className="p-4">
              {tahap2Empty ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  Data belum tersedia
                </p>
              ) : (
                <div className="space-y-3">
                  <InfoRow label="Pendarahan" value={data.Pendarahan} />
                  <InfoRow label="Perlengketan" value={data.Perlengketan} />
                  <InfoRow
                    label="Join DPJP Intra OP"
                    value={data.Join_DPJP_Intra_Op}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tahap 3 */}
        <div className="flex flex-col gap-1">
          <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-2 px-1 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center text-[10px] font-extrabold">
              3
            </span>
            Sesudah Operasi
          </p>
          <div
            className={`bg-white rounded-2xl border shadow-sm overflow-hidden flex-1 ${!data.Kondisi_Luka_RR && !data.Kondisi_Luka_Ranap && !data.Ruangan ? "border-dashed border-gray-200" : "border-gray-100"}`}
          >
            <div
              className={`flex items-center gap-2 px-4 py-3 border-b ${!data.Kondisi_Luka_RR && !data.Kondisi_Luka_Ranap && !data.Ruangan ? "border-dashed border-gray-200" : "border-gray-100"}`}
            >
              <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-teal-50 text-teal-600">
                <BedDouble className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-gray-700">
                Kondisi Luka & Ruangan
              </span>
              {!data.Kondisi_Luka_RR &&
                !data.Kondisi_Luka_Ranap &&
                !data.Ruangan && (
                  <span className="ml-auto text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    Belum diisi
                  </span>
                )}
            </div>
            <div className="p-4">
              {!data.Kondisi_Luka_RR &&
              !data.Kondisi_Luka_Ranap &&
              !data.Ruangan ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  Data belum tersedia
                </p>
              ) : (
                <div className="space-y-3">
                  <InfoRow
                    label="Kondisi Luka di RR"
                    value={data.Kondisi_Luka_RR}
                  />
                  <InfoRow
                    label="Kondisi Luka di Ranap"
                    value={data.Kondisi_Luka_Ranap}
                  />
                  <InfoRow label="Ruangan" value={data.Ruangan} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom edit */}
      <div className="flex justify-end pt-2 pb-6">
        <button
          onClick={() => navigate(`/ok-quality/form/${id}`)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2d6a4f] text-white text-sm font-semibold hover:bg-[#1b4332] transition-colors shadow"
        >
          <Pencil className="w-4 h-4" />
          Edit Penilaian
        </button>
      </div>
    </div>
  );
}
