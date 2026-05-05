"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

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

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

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
        }
      } catch (err) {
        console.error("Gagal mengambil profil", err);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setProfileOpen(false);
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
            ].map(n => (
              <Link
                key={n.href}
                href={n.href}
                className="text-white/70 font-semibold hover:text-white transition whitespace-nowrap"
              >
                {n.label}
              </Link>
            ))}
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

                  {/* HEADER */}
                  <div className="p-5 border-b flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-full bg-[#08503C] flex items-center justify-center text-white font-bold">
                      {initials}
                    </div>
                    <div>
                      <div className="font-semibold text-sm capitalize">{user.username}</div>
                      <div className="text-xs text-gray-400 capitalize">{user.role}</div>
                    </div>
                  </div>

                  {/* MENU */}
                  <div className="p-2">
                    <Link href="/dashboard" className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">
                      Masuk Dashboard
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-red-500 hover:bg-red-50"
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

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="absolute top-0 left-0 h-full w-64 bg-white shadow-xl p-5 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-[#08503C]">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)}>✕</button>
            </div>

            {[
              { href: "/form", label: "Buat Laporan" },
              { href: "/complaints", label: "Pantau Laporan" },
              { href: "/jadwal", label: "Jadwal Keliling" }
            ].map(n => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 font-medium py-2 border-b"
              >
                {n.label}
              </Link>
            ))}

            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-4 text-center bg-[#08503C] text-white py-2 rounded-lg font-bold"
            >
              Masuk
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
