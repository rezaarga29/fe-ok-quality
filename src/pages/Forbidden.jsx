import { ShieldX, LogOut, MessageCircle } from "lucide-react";
import { logout } from "../services/auth.service";
import logoImage from "../assets/logo-urip.png";

const WA_NUMBER = "6281617952015";
const WA_MESSAGE = encodeURIComponent(
  "Halo Admin, saya tidak bisa mengakses OK Quality. Mohon bantu aktifkan akses akun saya."
);

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#40916c] relative overflow-hidden px-4">

      {/* Decorative blobs */}
      <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-[30%] right-[5%] w-[180px] h-[180px] bg-red-400/10 rounded-full blur-2xl pointer-events-none"></div>

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='g' width='40' height='40' patternUnits='userSpaceOnUse'%3E%3Cpath d='M0 10h40M10 0v40M0 20h40M20 0v40M0 30h40M30 0v40' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3C/svg%3E\")",
        }}
      ></div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-8 sm:p-10 shadow-2xl text-center">

          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-[#95d5b2]/50 rounded-2xl blur-xl scale-125 pointer-events-none"></div>
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-2xl p-3 sm:p-4 shadow-xl">
                <img
                  src={logoImage}
                  alt="Logo OK Quality"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-red-500 border-2 border-white flex items-center justify-center">
                <ShieldX className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-red-500/20 border border-red-400/30 text-red-200 text-[10px] sm:text-xs font-semibold px-3 py-1.5 rounded-full mb-4 tracking-widest uppercase">
            <ShieldX className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            403 Forbidden
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-1 tracking-tight drop-shadow">
            Akses Ditolak
          </h1>
          <p className="text-white/65 text-xs sm:text-sm mb-8 leading-relaxed">
            Akun Anda tidak memiliki izin untuk menggunakan{" "}
            <span className="font-semibold text-white/85">OK Quality</span>.
            Hubungi admin untuk mendapatkan akses.
          </p>

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            {/* Contact Admin — WhatsApp */}
            <a
              href={`https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white text-[#2d6a4f] font-bold text-sm sm:text-base transition-all duration-150 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] hover:scale-[1.02] active:scale-[0.97]"
            >
              <MessageCircle className="w-5 h-5 shrink-0" />
              Hubungi Admin via WhatsApp
            </a>

            {/* Logout */}
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm sm:text-base transition-all duration-150 hover:scale-[1.02] active:scale-[0.97]"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              Keluar dari Sistem
            </button>
          </div>
        </div>

        <p className="text-center text-white/35 text-xs mt-5">
          © 2025 RS Urip Sumoharjo · OK Quality
        </p>
      </div>
    </div>
  );
}
