const formatSpecialty = (value) => {
  if (!value || value === "Semua") return "";

  return value
    .replace(/spesialis/i, "") // hapus kata spesialis kalau sudah ada
    .replace(/_/g, " ") // ganti _ jadi spasi
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase()) // Title Case
    .trim();
};

export default formatSpecialty;
