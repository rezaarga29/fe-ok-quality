import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Pencil, Loader2, CheckCircle2, Clock,
  AlertCircle, User, Calendar, Stethoscope, Activity,
  Syringe, HeartPulse, BedDouble,
} from "lucide-react";
import { getById } from "../../services/ok_quality.service";
import Swal from "sweetalert2";

// ── Journey stepper ───────────────────────────────────────────────────────────
const STEPS = ["Sebelum OP", "Waktu OP", "Sesudah OP"];

function JourneyBanner({ tahap = 0, status }) {
  const done = status === "selesai" ? 3 : tahap;
  return (
    <div className="flex items-center gap-0 w-full">
      {STEPS.map((label, i) => {
        const stepNum  = i + 1;
        const finished = done >= stepNum;
        const active   = done === stepNum - 1 && done < 3 && stepNum === done + 1;
        const isLast   = i === STEPS.length - 1;
        return (
          <div key={label} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center shrink-0">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
                ${finished
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : active
                  ? "bg-amber-400 border-amber-400 text-white ring-4 ring-amber-200"
                  : "bg-white border-gray-200 text-gray-300"}`}
              >
                {finished ? <CheckCircle2 className="w-4 h-4" /> : stepNum}
              </div>
              <span className={`text-[11px] mt-1.5 font-semibold text-center whitespace-nowrap
                ${finished ? "text-emerald-600" : active ? "text-amber-500" : "text-gray-400"}`}>
                {label}
              </span>
            </div>
            {!isLast && (
              <div className={`flex-1 h-0.5 mx-1.5 mb-5 rounded-full
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
  if (status === "selesai") return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">
      <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
    </span>
  );
  if (tahap === 0) return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-500">
      <AlertCircle className="w-3.5 h-3.5" /> Belum Mulai
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-700">
      <Clock className="w-3.5 h-3.5" /> Tahap {tahap}/3 — Sedang Berjalan
    </span>
  );
}

// ── Info row ──────────────────────────────────────────────────────────────────
function InfoRow({ label, value, mono = false, span = false }) {
  return (
    <div className={span ? "sm:col-span-2" : ""}>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className={`text-sm text-gray-800 break-words ${mono ? "font-mono" : ""} ${!value ? "text-gray-300 italic" : ""}`}>
        {value || "—"}
      </p>
    </div>
  );
}

// ── Section card ──────────────────────────────────────────────────────────────
function Section({ title, icon: Icon, color = "text-gray-500", children, empty }) {
  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${empty ? "border-dashed border-gray-200" : "border-gray-100"}`}>
      <div className={`flex items-center gap-2.5 px-5 py-4 border-b ${empty ? "border-dashed border-gray-200" : "border-gray-100"}`}>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-gray-50 ${color}`}>
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
          <p className="text-sm text-gray-400 text-center py-4">Data belum tersedia</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">{children}</div>
        )}
      </div>
    </div>
  );
}

// ── Vital box ─────────────────────────────────────────────────────────────────
function VitalBox({ label, value, unit }) {
  return (
    <div className="flex flex-col items-center justify-center bg-gray-50 rounded-xl p-3 text-center">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-xl font-extrabold ${value ? "text-gray-800" : "text-gray-300"}`}>
        {value ?? "—"}
      </p>
      {unit && <p className="text-[10px] text-gray-400 mt-0.5">{unit}</p>}
    </div>
  );
}

// ── GCS display ──────────────────────────────────────────────────────────────
function GCSDisplay({ e, m, v }) {
  const total = (parseFloat(e) || 0) + (parseFloat(m) || 0) + (parseFloat(v) || 0);
  const hasData = e || m || v;
  return (
    <div className="sm:col-span-2 grid grid-cols-4 gap-3">
      <VitalBox label="E (Eye)"   value={e} />
      <VitalBox label="M (Motor)" value={m} />
      <VitalBox label="V (Verbal)" value={v} />
      <div className="flex flex-col items-center justify-center bg-[#2d6a4f]/5 rounded-xl p-3 text-center border border-[#2d6a4f]/10">
        <p className="text-[10px] font-semibold text-[#2d6a4f]/60 uppercase tracking-wide mb-1">Total GCS</p>
        <p className={`text-xl font-extrabold ${hasData ? "text-[#2d6a4f]" : "text-gray-300"}`}>
          {hasData ? total : "—"}
        </p>
        <p className="text-[10px] text-[#2d6a4f]/50 mt-0.5">dari 15</p>
      </div>
    </div>
  );
}

// ── Format tanggal ────────────────────────────────────────────────────────────
const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })
  : null;

const fmtDateTime = (d) => d
  ? new Date(d).toLocaleString("id-ID", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    })
  : null;

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export default function OkQualityDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getById(id)
      .then((res) => setData(res.data))
      .catch(() => {
        Swal.fire({ icon: "error", title: "Gagal memuat detail", timer: 2000, showConfirmButton: false });
        navigate("/ok-quality");
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#2d6a4f]" />
      </div>
    );
  }

  if (!data) return null;

  const tahap1Empty = !data.Diagnosa && !data.Tindakan && !data.GCS_Before_E && !data.ASA;
  const tahap2Empty = !data.Pendarahan && !data.Perlengketan && !data.Join_DPJP_Intra_Op;
  const tahap3Empty = !data.GCS_After_E && !data.VS_TD && !data.Kondisi_Luka_RR && !data.Ruangan;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-5">

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

      {/* ── Hero card ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
        {/* Pasien info */}
        <div className="flex items-start gap-4 mb-5">
          <div className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-[#2d6a4f] to-[#40916c] flex items-center justify-center text-white font-extrabold text-xl">
            {(data.Nama_Pasien ?? "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-extrabold text-gray-800 truncate">
              {data.Nama_Pasien ?? "—"}
            </h1>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
              <span className="text-xs text-gray-400 font-mono">No. Reg: {data.No_Reg}</span>
              <span className="text-xs text-gray-400 font-mono">No. MR: {data.No_MR ?? "—"}</span>
              {data.Tgl_Lahir && (
                <span className="text-xs text-gray-400">{fmtDate(data.Tgl_Lahir)}</span>
              )}
              {data.Jenis_Kelamin && (
                <span className="text-xs text-gray-400">{data.Jenis_Kelamin}</span>
              )}
            </div>
          </div>
          <StatusBadge tahap={data.Tahap_Selesai} status={data.Status} />
        </div>

        {/* Meta info */}
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
              Diisi oleh: <strong className="text-gray-600">{data.NamaUser}</strong>
              {data.Tgl_Update && ` · ${fmtDateTime(data.Tgl_Update)}`}
            </span>
          )}
        </div>

        {/* Journey stepper */}
        <JourneyBanner tahap={data.Tahap_Selesai} status={data.Status} />
      </div>

      {/* ── TAHAP 1: SEBELUM OP ──────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
          Tahap 1 — Sebelum Operasi
        </p>
        <div className="space-y-3">
          <Section title="Diagnosa & Tindakan" icon={Stethoscope} color="text-sky-500" empty={tahap1Empty}>
            {!tahap1Empty && (
              <>
                <InfoRow label="Diagnosa"          value={data.Diagnosa}          span />
                <InfoRow label="Tindakan"           value={data.Tindakan}          span />
                <InfoRow label="Penyakit Penyerta"  value={data.Penyakit_Penyerta} span />
                <InfoRow label="Asal Pasien"        value={data.Asal_Pasien} />
                <InfoRow label="ASA Grade"          value={data.ASA} />
              </>
            )}
          </Section>

          <Section title="GCS Sebelum Operasi" icon={Activity} color="text-violet-500" empty={!data.GCS_Before_E && !data.GCS_Before_M && !data.GCS_Before_V}>
            {(data.GCS_Before_E || data.GCS_Before_M || data.GCS_Before_V) && (
              <GCSDisplay e={data.GCS_Before_E} m={data.GCS_Before_M} v={data.GCS_Before_V} />
            )}
          </Section>

          <Section title="Tanda-Tanda Vital" icon={HeartPulse} color="text-rose-500" empty={!data.TTV_TD && !data.TTV_HR && !data.TTV_Suhu}>
            {(data.TTV_TD || data.TTV_HR || data.TTV_Suhu) && (
              <div className="sm:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <VitalBox label="TD Sistolik"  value={data.TTV_TD}    unit="mmHg" />
                <VitalBox label="TD Diastolik" value={data.TTV_TDPer} unit="mmHg" />
                <VitalBox label="HR / Nadi"    value={data.TTV_HR}    unit="bpm"  />
                <VitalBox label="Suhu"         value={data.TTV_Suhu}  unit="°C"   />
              </div>
            )}
          </Section>
        </div>
      </div>

      {/* ── TAHAP 2: WAKTU OP ────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
          Tahap 2 — Waktu Operasi
        </p>
        <Section title="Kondisi Selama Operasi" icon={Syringe} color="text-amber-500" empty={tahap2Empty}>
          {!tahap2Empty && (
            <>
              <InfoRow label="Pendarahan"           value={data.Pendarahan}        span />
              <InfoRow label="Perlengketan"         value={data.Perlengketan}      span />
              <InfoRow label="Join DPJP Intra OP"  value={data.Join_DPJP_Intra_Op} span />
            </>
          )}
        </Section>
      </div>

      {/* ── TAHAP 3: SESUDAH OP ──────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
          Tahap 3 — Sesudah Operasi
        </p>
        <div className="space-y-3">
          <Section title="GCS Sesudah Operasi" icon={Activity} color="text-violet-500" empty={!data.GCS_After_E && !data.GCS_After_M && !data.GCS_After_V}>
            {(data.GCS_After_E || data.GCS_After_M || data.GCS_After_V) && (
              <GCSDisplay e={data.GCS_After_E} m={data.GCS_After_M} v={data.GCS_After_V} />
            )}
          </Section>

          <Section title="Vital Sign Pasca Operasi" icon={HeartPulse} color="text-rose-500" empty={!data.VS_TD && !data.VS_Nadi && !data.VS_Suhu}>
            {(data.VS_TD || data.VS_Nadi || data.VS_Suhu) && (
              <div className="sm:col-span-2 grid grid-cols-3 sm:grid-cols-5 gap-3">
                <VitalBox label="TD Sistolik"  value={data.VS_TD}    unit="mmHg"     />
                <VitalBox label="TD Diastolik" value={data.VS_TDPer} unit="mmHg"     />
                <VitalBox label="Nadi"         value={data.VS_Nadi}  unit="bpm"      />
                <VitalBox label="Suhu"         value={data.VS_Suhu}  unit="°C"       />
                <VitalBox label="RR"           value={data.VS_RR}    unit="napas/m"  />
              </div>
            )}
          </Section>

          <Section title="Kondisi Luka & Ruangan" icon={BedDouble} color="text-teal-500" empty={!data.Kondisi_Luka_RR && !data.Kondisi_Luka_Ranap && !data.Ruangan}>
            {(data.Kondisi_Luka_RR || data.Kondisi_Luka_Ranap || data.Ruangan) && (
              <>
                <InfoRow label="Kondisi Luka di RR"    value={data.Kondisi_Luka_RR}    span />
                <InfoRow label="Kondisi Luka di Ranap" value={data.Kondisi_Luka_Ranap} span />
                <InfoRow label="Ruangan"               value={data.Ruangan} />
              </>
            )}
          </Section>
        </div>
      </div>

      {/* Bottom edit button */}
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
