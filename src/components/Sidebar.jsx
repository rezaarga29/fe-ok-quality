import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  Activity,
  CalendarDays,
} from "lucide-react";
import logoImage from "../assets/logo-urip.png";
import { useAuth } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";
import Swal from "sweetalert2";
import { logout } from "../services/auth";

// ─── Menu definition ───────────────────────────────────────────────────────
const menuItems = [
  {
    name: "Beranda",
    path: "/home",
    icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
  },
  {
    name: "Jadwal Operasi",
    path: "/jadwal-operasi",
    icon: <CalendarDays className="w-5 h-5 shrink-0" />,
  },
  {
    name: "Daftar Penilaian",
    path: "/ok-quality",
    icon: <ClipboardList className="w-5 h-5 shrink-0" />,
  },
];

const adminMenuItems = [
  {
    name: "Log Sistem",
    path: "/admin/logs",
    icon: <Activity className="w-5 h-5 shrink-0" />,
  },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { collapsed, toggleCollapsed } = useSidebar();

  // Mobile drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const overlayRef = useRef(null);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Close drawer on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const isActive = (path) => {
    // Jika ada activeMenu dari navigation state (misal dari Beranda ke detail),
    // gunakan itu sebagai override
    if (location.state?.activeMenu) {
      return path === location.state.activeMenu;
    }
    return path === "/home"
      ? location.pathname === path
      : location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    Swal.fire({
      title: "Keluar dari OK Quality?",
      text: "Anda akan keluar dari sistem",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2d6a4f",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Ya, Keluar",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
        navigate("/login");
      }
    });
  };

  // ─── Sidebar inner content (shared between desktop & mobile) ────────────
  const SidebarContent = ({ isMobile = false }) => {
    const showText = !collapsed || isMobile;

    return (
      <div className="flex flex-col h-full">

        {/* Logo / Brand */}
        <div
          className={`flex items-center gap-3 border-b border-white/10 transition-all duration-300 ${
            showText ? "px-4 py-5" : "px-0 py-5 justify-center"
          }`}
        >
          <div className="w-9 h-9 shrink-0 bg-white rounded-xl p-1.5 shadow-md">
            <img src={logoImage} alt="OK Quality" className="w-full h-full object-contain" />
          </div>
          {showText && (
            <div className="overflow-hidden">
              <p className="text-white font-extrabold text-sm leading-tight tracking-tight truncate">
                OK Quality
              </p>
              <p className="text-white/50 text-[10px] truncate">RS Urip Sumoharjo</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {showText && (
            <p className="text-white/35 text-[10px] font-semibold uppercase tracking-widest mb-2 px-3">
              Menu
            </p>
          )}

          {menuItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                title={!showText ? item.name : undefined}
                className={`
                  flex items-center gap-3 rounded-xl font-medium text-sm
                  transition-all duration-200 group
                  ${showText ? "px-3 py-2.5" : "justify-center py-2.5 px-0"}
                  ${
                    active
                      ? "bg-white text-[#2d6a4f] shadow-md"
                      : "text-white/75 hover:bg-white/10 hover:text-white"
                  }
                `}
              >
                <span className={`shrink-0 ${active ? "text-[#2d6a4f]" : ""}`}>
                  {item.icon}
                </span>
                {showText && (
                  <>
                    <span className="truncate flex-1">{item.name}</span>
                    {active && (
                      <ChevronRight className="w-4 h-4 shrink-0 text-[#2d6a4f]" />
                    )}
                  </>
                )}
              </Link>
            );
          })}

          {/* ── Admin section ── hanya untuk ok-quality-admin ── */}
          {isAdmin && (
            <>
              <div className={`mt-4 mb-2 ${showText ? "px-3" : "flex justify-center"}`}>
                {showText ? (
                  <p className="text-white/35 text-[10px] font-semibold uppercase tracking-widest flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Admin
                  </p>
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-white/35" />
                )}
              </div>
              {adminMenuItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    title={!showText ? item.name : undefined}
                    className={`
                      flex items-center gap-3 rounded-xl font-medium text-sm
                      transition-all duration-200 group
                      ${showText ? "px-3 py-2.5" : "justify-center py-2.5 px-0"}
                      ${
                        active
                          ? "bg-white text-[#2d6a4f] shadow-md"
                          : "text-white/75 hover:bg-white/10 hover:text-white"
                      }
                    `}
                  >
                    <span className={`shrink-0 ${active ? "text-[#2d6a4f]" : ""}`}>
                      {item.icon}
                    </span>
                    {showText && (
                      <>
                        <span className="truncate flex-1">{item.name}</span>
                        {active && (
                          <ChevronRight className="w-4 h-4 shrink-0 text-[#2d6a4f]" />
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* User info + Logout */}
        <div className="border-t border-white/10 p-3 space-y-2">
          {/* User card */}
          {showText && user && (
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl bg-white/8">
              <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-[#95d5b2] to-[#40916c] flex items-center justify-center text-white font-bold text-sm uppercase">
                {user.name?.[0] ?? user.email?.[0] ?? "U"}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-white text-xs font-semibold truncate leading-tight">
                  {user.name ?? "Pengguna"}
                </p>
                <p className="text-white/45 text-[10px] truncate">{user.email}</p>
              </div>
            </div>
          )}

          {/* Avatar only when collapsed */}
          {!showText && user && (
            <div
              className="mx-auto w-8 h-8 rounded-full bg-gradient-to-br from-[#95d5b2] to-[#40916c] flex items-center justify-center text-white font-bold text-sm uppercase"
              title={user.name ?? user.email}
            >
              {user.name?.[0] ?? user.email?.[0] ?? "U"}
            </div>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            title={!showText ? "Keluar" : undefined}
            className={`
              flex items-center gap-2.5 w-full rounded-xl
              text-white/70 hover:bg-white/10 hover:text-white
              transition-all duration-200 text-sm font-medium
              ${showText ? "px-3 py-2.5" : "justify-center py-2.5 px-0"}
            `}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {showText && <span>Keluar</span>}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ── MOBILE TOPBAR (< lg) ──────────────────────────────────────────── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-[57px] bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] border-b border-white/10 shadow-lg flex items-center gap-3 px-4">
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Buka menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-7 h-7 shrink-0 bg-white rounded-lg p-1 shadow">
            <img src={logoImage} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-white font-extrabold text-sm truncate">OK Quality</span>
        </div>

        {user && (
          <div
            className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-[#95d5b2] to-[#40916c] flex items-center justify-center text-white font-bold text-sm uppercase"
            title={user.name}
          >
            {user.name?.[0] ?? user.email?.[0] ?? "U"}
          </div>
        )}
      </header>

      {/* ── MOBILE DRAWER OVERLAY (< lg) ────────────────────────────────── */}
      <div
        className={`lg:hidden fixed inset-0 z-50 transition-all duration-300 ${
          drawerOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
            drawerOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setDrawerOpen(false)}
        ></div>

        {/* Panel */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-64 bg-gradient-to-b from-[#1b4332] to-[#2d6a4f] shadow-2xl transition-transform duration-300 ${
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Close btn */}
          <button
            onClick={() => setDrawerOpen(false)}
            className="absolute top-4 right-3 p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors z-10"
            aria-label="Tutup menu"
          >
            <X className="w-5 h-5" />
          </button>
          <SidebarContent isMobile={true} />
        </div>
      </div>

      {/* ── DESKTOP SIDEBAR (≥ lg) ──────────────────────────────────────── */}
      <aside
        className={`
          hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-30
          bg-gradient-to-b from-[#1b4332] to-[#2d6a4f] shadow-xl
          transition-all duration-300 ease-in-out overflow-hidden
          ${collapsed ? "w-[70px]" : "w-64"}
        `}
      >
        <SidebarContent isMobile={false} />
      </aside>

      {/* Collapse toggle — fixed separately so overflow:hidden on sidebar won't clip it */}
      <button
        onClick={toggleCollapsed}
        className={`
          hidden lg:flex items-center justify-center
          fixed top-6 z-40
          w-6 h-6 bg-white border border-gray-200 rounded-full shadow-md
          text-[#2d6a4f] hover:bg-[#2d6a4f] hover:text-white hover:border-[#2d6a4f]
          transition-all duration-300 ease-in-out
          ${collapsed ? "left-[57px]" : "left-[253px]"}
        `}
        aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
      >
        <ChevronRight
          className={`w-3.5 h-3.5 transition-transform duration-300 ${
            collapsed ? "" : "rotate-180"
          }`}
        />
      </button>
    </>
  );
}
