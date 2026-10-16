import { useEffect, useState } from "react";
import Select from "react-select";
import { BedDouble, Footprints, HeartCrack, StickyNote } from "lucide-react";
import { getDokterList } from "../services/dokter.service";

// Komponen kecil yang dipakai bersama di halaman Penilaian OK Quality
// (/ok-quality) dan Jadwal Operasi (/jadwal-operasi): filter DPJP, filter &
// badge Jenis Rawat (dari PENDAFTARAN.Medis → RAWAT INAP / ODC).

// ── Jenis Rawat ──────────────────────────────────────────────────────────────
export const JENIS_RAWAT_OPTIONS = [
  { value: "RAWAT INAP", label: "Rawat Inap" },
  { value: "ODC",        label: "ODC (Rawat Jalan)" },
];

export function JenisRawatBadge({ jenis }) {
  if (!jenis) return null;
  const isInap = jenis === "RAWAT INAP";
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
        isInap ? "bg-indigo-100 text-indigo-700" : "bg-sky-100 text-sky-700"
      }`}
    >
      {isInap ? <BedDouble className="w-3 h-3" /> : <Footprints className="w-3 h-3" />}
      {jenis}
    </span>
  );
}

export function JenisRawatSelect({ value, onChange, className = "" }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] bg-white ${className}`}
    >
      <option value="">— Semua Jenis Rawat —</option>
      {JENIS_RAWAT_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// ── Pasien Meninggal (No_Reg ada di ASESMEN_SURATKET_KEMATIAN) ──────────────
// BE mengirim flag Is_Meninggal (0/1) di setiap baris list / detail / jadwal.
export const isPasienMeninggal = (flag) => flag === true || Number(flag) === 1;

export function MeninggalBadge({ meninggal }) {
  if (!isPasienMeninggal(meninggal)) return null;
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700"
      title="Pasien meninggal (ada Surat Keterangan Kematian)"
    >
      <HeartCrack className="w-3 h-3 shrink-0" />
      Meninggal
    </span>
  );
}

// value: "" (semua pasien) | "MENINGGAL"
export function MeninggalSelect({ value, onChange, className = "" }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] bg-white ${className}`}
    >
      <option value="">— Semua Pasien —</option>
      <option value="MENINGGAL">Meninggal</option>
    </select>
  );
}

// ── Filter Kondisi Luka di Ranap ("" | "belum" | "sudah") ──────────────────
export function LukaRanapSelect({ value, onChange, className = "" }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] bg-white ${className}`}
    >
      <option value="">— Semua Luka Ranap —</option>
      <option value="belum">Luka Ranap belum diisi</option>
      <option value="sudah">Luka Ranap sudah diisi</option>
    </select>
  );
}

// ── Preview notes terakhir (role notes) ──────────────────────────────────────
// Teks dipotong di `max` karakter lalu diberi "…"; teks lengkap ada di
// tooltip & di modal Notes (klik).
export const NOTE_PREVIEW_MAX = 80;

export function truncateText(text, max = NOTE_PREVIEW_MAX) {
  const t = String(text ?? "").replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max).trimEnd()}…` : t;
}

export function NotePreview({ text, count, author, onClick, max = NOTE_PREVIEW_MAX, className = "" }) {
  if (!text || !(count > 0)) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      title={author ? `${author}: ${text}` : text}
      className={`w-full flex items-start gap-1.5 px-3 py-2 rounded-xl bg-yellow-50 border border-yellow-200 text-left hover:bg-yellow-100 transition-colors ${className}`}
    >
      <StickyNote className="w-3.5 h-3.5 text-yellow-600 shrink-0 mt-0.5" />
      <span className="flex-1 min-w-0 text-[11px] text-gray-700 leading-snug break-words">
        {author && <strong className="font-semibold text-gray-800">{author}: </strong>}
        {truncateText(text, max)}
      </span>
      {count > 1 && (
        <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-yellow-200 text-yellow-800">
          {count}
        </span>
      )}
    </button>
  );
}

// ── Tombol Notes (di-highlight kuning) ───────────────────────────────────────
// Selalu menonjol: kuning muda + label "Notes". Kalau jadwal sudah punya
// catatan → kuning solid + badge jumlah catatan.
// size: "sm" (kartu/tabel padat) | "md" | "full" (tombol lebar di mobile)
export function NotesButton({ count = 0, onClick, size = "sm", className = "" }) {
  const has = count > 0;
  const pad = size === "full" ? "px-3 py-2 text-sm" : size === "md" ? "px-2.5 py-1.5 text-xs" : "px-2 py-1 text-[11px]";
  const icon = size === "full" ? "w-4 h-4" : "w-3.5 h-3.5";
  return (
    <button
      type="button"
      onClick={onClick}
      title={has ? `Notes (${count} catatan)` : "Tambah notes"}
      className={`relative inline-flex items-center justify-center gap-1 rounded-lg font-semibold border shadow-sm transition-colors shrink-0 ${pad} ${
        has
          ? "bg-yellow-400 border-yellow-500 text-yellow-950 hover:bg-yellow-500"
          : "bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
      } ${className}`}
    >
      <StickyNote className={icon} />
      <span>Notes</span>
      {has && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-[18px] text-center ring-2 ring-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}

// ── DPJP (searchable select dari /dokter) ────────────────────────────────────
const dpjpSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: 38,
    borderRadius: "0.75rem",
    fontSize: "0.875rem",
    borderColor: state.isFocused ? "#2d6a4f" : "#e5e7eb",
    boxShadow: state.isFocused ? "0 0 0 2px rgb(45 106 79 / 0.3)" : "none",
    "&:hover": { borderColor: state.isFocused ? "#2d6a4f" : "#d1d5db" },
  }),
  option: (base, state) => ({
    ...base,
    fontSize: "0.875rem",
    backgroundColor: state.isSelected ? "#2d6a4f" : state.isFocused ? "rgb(45 106 79 / 0.08)" : "white",
    color: state.isSelected ? "white" : "#374151",
    cursor: "pointer",
  }),
  placeholder: (base) => ({ ...base, color: "#9ca3af" }),
  menu: (base) => ({ ...base, borderRadius: "0.75rem", overflow: "hidden", zIndex: 50 }),
  menuPortal: (base) => ({ ...base, zIndex: 60 }),
};

// value: { value: Kode_Dokter, label: Nama_Dokter } | null
export function DpjpSelect({ value, onChange }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getDokterList()
      .then((res) => { if (active) setList(res.data || []); })
      .catch(() => { /* silent */ })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const options = list.map((d) => ({
    value: d.Kode_Dokter?.trim(),
    label: d.Nama_Dokter?.trim() || d.Kode_Dokter?.trim(),
    spesialis: d.Spesialis?.trim() || "",
  }));

  return (
    <Select
      value={value}
      onChange={(opt) => onChange(opt ? { value: opt.value, label: opt.label } : null)}
      options={options}
      isClearable
      isLoading={loading}
      placeholder="— Semua DPJP — (ketik untuk cari)"
      noOptionsMessage={() => "Dokter tidak ditemukan"}
      menuPortalTarget={typeof document !== "undefined" ? document.body : null}
      formatOptionLabel={(opt, { context }) =>
        context === "menu" && opt.spesialis ? (
          <div className="flex flex-col">
            <span>{opt.label}</span>
            <span className="text-[11px] opacity-70">{opt.spesialis}</span>
          </div>
        ) : opt.label
      }
      filterOption={(opt, input) => {
        const q = input.toLowerCase();
        return (
          opt.data.label?.toLowerCase().includes(q) ||
          opt.data.value?.toLowerCase().includes(q) ||
          opt.data.spesialis?.toLowerCase().includes(q)
        );
      }}
      styles={dpjpSelectStyles}
    />
  );
}
