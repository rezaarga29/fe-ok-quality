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
} from "lucide-react";
import {
  getById,
  getAutoFill,
  getJadwal,
  create,
  updateTahap,
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
function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
      <h3 className="text-sm font-bold text-gray-700 mb-4 pb-3 border-b border-gray-100">
        {title}
      </h3>
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
  const [penandaan, setPenandaan]       = useState(null); // { Prosedur, Photo (base64), Tgl_Pasien, Tgl_Dokter }
  const [photoModalOpen, setPhotoModalOpen] = useState(false);

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
    Kondisi_Luka_RR: "",
    Kondisi_Luka_Ranap: "",
    Ruangan: "",
  });

  // Track field mana yg di-autofill (untuk highlight hijau)
  const [filledFields, setFilledFields] = useState(new Set());

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

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
            TTV_TD: d.TTV_TD,
            TTV_TDPer: d.TTV_TDPer,
            TTV_HR: d.TTV_HR,
            TTV_Suhu: d.TTV_Suhu,
            TTV_RR: d.TTV_RR,
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
          TTV_TD: d.TTV_TD,
          TTV_TDPer: d.TTV_TDPer,
          TTV_HR: d.TTV_HR,
          TTV_Suhu: d.TTV_Suhu,
          TTV_RR: d.TTV_RR,
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
          TTV_TD: d.TTV_TD,
          TTV_TDPer: d.TTV_TDPer,
          TTV_HR: d.TTV_HR,
          TTV_Suhu: d.TTV_Suhu,
          TTV_RR: d.TTV_RR,
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

      if (newTahap >= 3) {
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
      const existingId = err?.response?.status === 409
        ? err?.response?.data?.data?.Id
        : null;
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#2d6a4f]" />
      </div>
    );
  }

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

          <Section title="GCS Sebelum Operasi">
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
            <Field label="ASA Grade">
              <SelectInput
                value={form.ASA}
                onChange={(e) => set("ASA", e.target.value)}
                options={ASA_OPTIONS}
                autoFilled={filledFields.has("ASA")}
                placeholder="— Pilih ASA —"
              />
            </Field>
          </Section>

          <Section title="Tanda-Tanda Vital">
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
                placeholder="20"
              />
            </Field>
          </Section>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────
          TAHAP 2: WAKTU OP
      ────────────────────────────────────────────────────────────── */}
      {step === 2 && (
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
                          className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
                          <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-[#2d6a4f]" />
                            <span className="text-sm font-semibold text-gray-700">Foto Penandaan Lokasi Operasi</span>
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
                              <p className="text-xs text-gray-500 font-medium mb-1">Prosedur</p>
                              <p className="text-sm text-gray-700">{penandaan.Prosedur}</p>
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
                    <span>Tgl. Pasien: <strong>{penandaan.Tgl_Pasien?.slice(0, 10)}</strong></span>
                  )}
                  {penandaan.Tgl_Dokter && (
                    <span>Tgl. Dokter: <strong>{penandaan.Tgl_Dokter?.slice(0, 10)}</strong></span>
                  )}
                </div>
              )}
            </div>
          )}

          <Section title="Kondisi Selama Operasi">
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
          <Section title="GCS Sesudah Operasi">
            <Field label="E (Eye)">
              <Input
                type="number"
                value={form.GCS_After_E}
                onChange={(e) => set("GCS_After_E", e.target.value)}
                placeholder="1-4"
              />
            </Field>
            <Field label="M (Motor)">
              <Input
                type="number"
                value={form.GCS_After_M}
                onChange={(e) => set("GCS_After_M", e.target.value)}
                placeholder="1-6"
              />
            </Field>
            <Field label="V (Verbal)">
              <Input
                value={form.GCS_After_V}
                onChange={(e) => set("GCS_After_V", e.target.value)}
                placeholder="1-5"
              />
            </Field>
          </Section>

          <Section title="Vital Sign Pasca Operasi">
            <Field label="TD Sistolik (mmHg)">
              <Input
                type="number"
                value={form.VS_TD}
                onChange={(e) => set("VS_TD", e.target.value)}
                placeholder="120"
              />
            </Field>
            <Field label="TD Diastolik (mmHg)">
              <Input
                type="number"
                value={form.VS_TDPer}
                onChange={(e) => set("VS_TDPer", e.target.value)}
                placeholder="80"
              />
            </Field>
            <Field label="Nadi (bpm)">
              <Input
                type="number"
                value={form.VS_Nadi}
                onChange={(e) => set("VS_Nadi", e.target.value)}
                placeholder="80"
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
              />
            </Field>
          </Section>

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
              <Field label="Ruangan" hint="Ranap / ICU / HCU">
                <Input
                  value={form.Ruangan}
                  onChange={(e) => set("Ruangan", e.target.value)}
                  placeholder="Nama ruang perawatan..."
                />
              </Field>
            </div>
          </Section>
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
            onClick={() => handleSave(false)}
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
              onClick={() => handleSave(true)}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2d6a4f] text-white text-sm font-semibold hover:bg-[#1b4332] disabled:opacity-60 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Simpan & Lanjut
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => handleSave(true)}
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
    </div>
  );
}
