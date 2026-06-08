import { useState } from "react";
import { LogIn, CheckCircle2 } from "lucide-react";
import logoImage from "../assets/logo-urip.png";
import { useLocation } from "react-router-dom";
import { startLogin } from "../services/auth";

export default function LoginPage() {
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState([]);
  const location = useLocation();
  const nextAfterLogin = location.state?.from || "/home";

  const handleSSOLogin = (next) => {
    startLogin(next);
  };

  const createRipple = (event) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    const newRipple = { x, y, size, id: Date.now() };
    setRipples((prev) => [...prev, newRipple]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#40916c] relative overflow-hidden px-4">

      {/* Decorative blobs */}
      <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-[30%] right-[5%] w-[180px] h-[180px] bg-[#95d5b2]/10 rounded-full blur-2xl pointer-events-none"></div>

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
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-white/15 border border-white/25 text-white/90 text-[10px] sm:text-xs font-semibold px-3 py-1.5 rounded-full mb-4 tracking-widest uppercase">
            <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            Sistem Manajemen Kualitas
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-1 tracking-tight drop-shadow">
            OK Quality
          </h1>
          <p className="text-white/65 text-xs sm:text-sm mb-8">
            RS Urip Sumoharjo
          </p>

          {/* SSO Button */}
          <button
            onClick={(e) => {
              createRipple(e);
              handleSSOLogin(nextAfterLogin);
            }}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            onMouseLeave={() => setIsPressed(false)}
            className={`
              relative overflow-hidden
              w-full flex items-center justify-center gap-2.5
              px-6 py-4 rounded-2xl
              bg-white text-[#2d6a4f] font-bold text-sm sm:text-base
              transition-all duration-150 ease-out select-none
              ${
                isPressed
                  ? "scale-[0.97] shadow-inner"
                  : "shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] hover:scale-[1.02]"
              }
            `}
          >
            {ripples.map((ripple) => (
              <span
                key={ripple.id}
                className="absolute bg-[#40916c]/15 rounded-full animate-ripple pointer-events-none"
                style={{
                  left: ripple.x,
                  top: ripple.y,
                  width: ripple.size,
                  height: ripple.size,
                }}
              />
            ))}
            <LogIn className="w-5 h-5 relative z-10 shrink-0" />
            <span className="relative z-10">Masuk dengan SSO</span>
          </button>

          {/* Footer note */}
          <p className="mt-6 text-white/45 text-xs flex items-center justify-center gap-1.5">
            <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            Akses aman dengan Single Sign-On
          </p>
        </div>

        <p className="text-center text-white/35 text-xs mt-5">
          © 2025 RS Urip Sumoharjo · OK Quality
        </p>
      </div>

      <style>{`
        @keyframes ripple {
          to { transform: scale(4); opacity: 0; }
        }
        .animate-ripple {
          animation: ripple 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}
