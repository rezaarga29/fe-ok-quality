import React, { useState, useEffect } from "react";
import { Moon, Home, Search, ArrowLeft } from "lucide-react";

export default function NotFound404() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [stars, setStars] = useState([]);

  useEffect(() => {
    // Generate random stars
    const generateStars = () => {
      const newStars = [];
      for (let i = 0; i < 50; i++) {
        newStars.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 2 + 1,
          delay: Math.random() * 2,
        });
      }
      setStars(newStars);
    };
    generateStars();

    // Track mouse movement for parallax effect
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-900 to-slate-900 flex items-center justify-center overflow-hidden relative">
      {/* Animated stars background */}
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white animate-pulse"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: `${star.delay}s`,
            opacity: 0.6,
          }}
        />
      ))}

      {/* Main content */}
      <div className="relative z-10 text-center px-6">
        {/* Floating astronaut/moon illustration */}
        <div
          className="mb-8 inline-block transition-transform duration-300 ease-out"
          style={{
            transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
          }}
        >
          <div className="relative">
            <Moon className="w-32 h-32 text-yellow-200 animate-pulse" />
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-purple-500 rounded-full opacity-30 blur-xl animate-pulse" />
          </div>
        </div>

        {/* 404 Text */}
        <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-4 animate-pulse">
          404
        </h1>

        {/* Description */}
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Halaman Tidak Ditemukan
        </h2>
        <p className="text-gray-300 text-lg mb-8 max-w-md mx-auto">
          Sepertinya Anda tersesat di luar angkasa. Halaman yang Anda cari tidak
          ada di galaksi ini.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => window.history.back()}
            className="group flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm border border-white/20 transition-all duration-300 hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Kembali
          </button>

          <button
            onClick={() => (window.location.href = "/")}
            className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white rounded-lg transition-all duration-300 hover:scale-105 shadow-lg shadow-purple-500/50"
          >
            <Home className="w-5 h-5" />
            Ke Beranda
          </button>
        </div>

        {/* Additional info */}
        <div className="mt-12 text-gray-400 text-sm">
          <p>Error Code: 404 | Halaman tidak tersedia</p>
        </div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${
                5 + Math.random() * 10
              }s infinite ease-in-out ${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) translateX(0px);
          }
          25% {
            transform: translateY(-20px) translateX(10px);
          }
          50% {
            transform: translateY(-40px) translateX(-10px);
          }
          75% {
            transform: translateY(-20px) translateX(10px);
          }
        }
      `}</style>
    </div>
  );
}
