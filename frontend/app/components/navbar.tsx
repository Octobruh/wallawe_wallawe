"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type User = {
  username: string;
  role: string;
  accessible_kelurahans?: { kelurahan_name: string }[] | string[];
} | null;

export default function Navbar() {
  const [user, setUser] = useState<User>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          localStorage.removeItem("token");
          setUser(null);
        }
      } catch (err) {
        console.error("Gagal mengambil profil", err);
      }
    };

    fetchProfile();
  }, [pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset" };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setProfileOpen(false);
    window.location.href = "/";
  };

  const initials = user ? user.username.substring(0, 2).toUpperCase() : null;

  return (
    <>
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 min-h-16 flex flex-wrap items-center justify-between px-4 sm:px-8 py-2 bg-[#08503C]/95 backdrop-blur border-b border-white/10">

        <div className="flex items-center gap-4 sm:gap-10 flex-wrap">
          <Link href="/" className="text-white font-extrabold text-lg tracking-widest">
            Wall-awe
          </Link>

          {/* DESKTOP MENU */}
          <div className="hidden md:flex gap-7 text-sm">
            {[
              { href: "/form", label: "Buat Laporan" },
              { href: "/complaints", label: "Pantau Laporan" },
              { href: "/jadwal", label: "Jadwal Keliling" }
            ].map(n => {
              const isActive = pathname === n.href;

              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`transition whitespace-nowrap ${isActive
                    ? "text-white font-extrabold relative after:content-[''] after:absolute after:-bottom-[6px] after:left-0 after:w-full after:h-[2px] after:bg-[#5FD4AA] after:rounded-sm"
                    : "text-white/70 font-semibold hover:text-white"
                    }`}
                >
                  {n.label}
                </Link>
              )
            })}
          </div>

          {/* BURGER BUTTON */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden text-white"
          >
            ☰
          </button>
        </div>

        {/* RIGHT SIDE */}
        <div ref={profileRef} className="relative flex-shrink-0">
          {user ? (
            <>
              <button
                onClick={() => setProfileOpen(p => !p)}
                className={`w-9 h-9 rounded-full border border-white/30 flex items-center justify-center text-white font-bold text-sm transition
              ${profileOpen ? "border-green-300 text-green-300 bg-green-300/10" : "bg-white/10 hover:border-green-300"}`}
              >
                {initials}
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">

                  {/* HEADER PROFIL */}
                  <div className="p-5 border-b flex gap-3 items-start">
                    <div className="w-10 h-10 shrink-0 rounded-full bg-[#08503C] flex items-center justify-center text-white font-bold">
                      {initials}
                    </div>
                    <div>
                      <div className="font-semibold text-sm capitalize">{user.username}</div>
                      <div className="text-xs text-gray-500 capitalize mt-0.5">{user.role}</div>

                      {/* --- FITUR BADGE KELURAHAN --- */}
                      {user.role !== "admin" && user.accessible_kelurahans && user.accessible_kelurahans.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {user.accessible_kelurahans.map((kel, index) => {
                            const kelName = typeof kel === 'string' ? kel : kel.kelurahan_name;
                            return (
                              <span
                                key={index}
                                className="bg-green-50 border border-green-200 text-[#08503C] text-[0.65rem] font-bold px-2 py-1 rounded-md uppercase tracking-wider"
                              >
                                {kelName}
                              </span>
                            );
                          })}
                        </div>
                      )}

                    </div>
                  </div>

                  {/* MENU */}
                  <div className="p-2">
                    <Link
                      href="/dashboard"
                      onClick={() => setProfileOpen(false)} // <--- Tambahkan baris ini
                      className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                    >
                      Masuk Dashboard
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-red-500 hover:bg-red-50 transition"
                    >
                      Keluar
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <Link
              href="/login"
              className="px-5 py-2 rounded-full border border-white/30 text-white text-sm font-bold bg-white/10 hover:bg-white hover:text-[#08503C] transition"
            >
              Masuk
            </Link>
          )}
        </div>
      </nav>

      {/* MOBILE MENU (DENGAN ANIMASI GESER) */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      >
        {/* Latar Belakang Hitam Blur */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Panel Menu Putih */}
        <div
          className={`absolute top-0 left-0 h-full w-64 bg-white shadow-xl p-5 flex flex-col gap-2 transform transition-transform duration-300 ease-in-out ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <span className="font-extrabold text-lg text-[#08503C]">Menu</span>
            <button className="text-gray-400 hover:text-red-500 text-xl font-bold p-1" onClick={() => setMobileMenuOpen(false)}>✕</button>
          </div>

          {[
            { href: "/form", label: "Buat Laporan" },
            { href: "/complaints", label: "Pantau Laporan" },
            { href: "/jadwal", label: "Jadwal Keliling" }
          ].map(n => {
            const isActive = pathname === n.href;

            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`py-3 px-2 border-b font-medium transition ${isActive
                  ? "text-[#08503C] font-bold border-[#08503C]"
                  : "text-gray-600 border-gray-100 hover:text-[#08503C]"
                  }`}
              >
                {n.label}
              </Link>
            )
          })}

          {!user && (
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-6 text-center bg-[#08503C] text-white py-3 rounded-xl font-bold hover:bg-[#063B2C] shadow-lg transition"
            >
              Masuk
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
