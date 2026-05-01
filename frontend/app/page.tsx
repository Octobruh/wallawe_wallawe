"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

// Tipe data untuk User sesuai dengan schemas.py di Backend
type User = {
  username: string;
  role: string;
  accessible_kelurahans?: { kelurahan_name: string }[] | string[];
} | null;

export default function LandingPage() {
  // State untuk Profil
  const [user, setUser] = useState<User>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // 1. Cek Token & Ambil Data Profil dari Backend saat halaman dimuat
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) return; // Jika tidak ada token, biarkan user = null

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
          // Token kedaluwarsa atau tidak valid
          localStorage.removeItem("token");
        }
      } catch (err) {
        console.error("Gagal mengambil profil", err);
      }
    };

    fetchProfile();
  }, []);

  // 2. Menutup dropdown jika klik di luar elemen
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Handler Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setProfileOpen(false);
  };

  // Inisial nama (misal: "admin" -> "AD")
  const initials = user
    ? user.username.substring(0, 2).toUpperCase()
    : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .wl-root {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #F4F6F5; /* Off-white */
          min-height: 100vh;
          color: #111;
          display: flex;
          flex-direction: column;
        }

        /* NAVBAR */
        .wl-nav {
          position: sticky; top: 0; z-index: 100;
          height: 64px;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 2rem;
          background: rgba(8,80,60,0.97); /* Hijau gelap */
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255,255,255,0.10);
        }
        .wl-brand { 
          font-size: 1.35rem; 
          font-weight: 800; 
          color: #fff; 
          letter-spacing: 0.12em; 
          text-decoration: none; 
        }
        .wl-nav-link { 
          font-size: 0.84rem; 
          font-weight: 600; 
          color: rgba(255,255,255,0.75); 
          text-decoration: none; 
          letter-spacing: 0.02em;
          transition: color 0.15s; 
        }
        .wl-nav-link:hover { color: #fff; }

        /* PROFIL AVATAR & DROPDOWN */
        .wl-avatar-btn {
          width: 36px; height: 36px; border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.1); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.85rem; font-weight: 700; color: #fff;
          transition: all 0.15s; font-family: inherit;
        }
        .wl-avatar-btn:hover, .wl-avatar-btn.active { 
          border-color: #5FD4AA; 
          background: rgba(95,212,170,0.15); 
          color: #5FD4AA;
        }
        
        .wl-dropdown {
          position: absolute; top: calc(100% + 12px); right: 0;
          width: 280px;
          background: #fff;
          border: 1px solid #E8EDEB;
          border-radius: 16px;
          box-shadow: 0 16px 40px rgba(0,0,0,0.12);
          overflow: hidden;
          animation: dropIn 0.18s cubic-bezier(.22,1,.36,1);
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Tombol Link Login Navbar */
        .wl-nav-login-btn {
          padding: 8px 20px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 999px;
          color: #fff;
          font-weight: 700;
          font-size: 0.85rem;
          text-decoration: none;
          transition: all 0.2s;
        }
        .wl-nav-login-btn:hover {
          background: #fff;
          color: #08503C;
        }

        /* KONTEN UTAMA (Tengah) */
        .wl-hero-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .dot-pattern {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(8,80,60,0.05) 1px, transparent 1px);
          background-size: 24px 24px;
          z-index: 0;
          pointer-events: none;
        }
        .wl-hero-content {
          position: relative;
          z-index: 1;
          max-width: 800px;
        }
        .wl-hero-content h1 {
          font-size: clamp(3.5rem, 6vw, 5rem);
          font-weight: 800; 
          line-height: 1.1;
          color: #08503C; 
          letter-spacing: -0.03em; 
          margin-bottom: 1.5rem;
        }
        .wl-hero-content h1 em { font-style: normal; color: #5FD4AA; }
        .wl-hero-content p { 
          font-size: clamp(1.1rem, 2vw, 1.35rem); 
          color: #374553; 
          line-height: 1.7; 
          max-width: 650px; 
          margin: 0 auto 3rem; 
        }

        /* Tombol */
        .wl-btn-primary { 
          padding: 14px 32px; background: #08503C; border-radius: 12px; color: #fff; 
          font-weight: 700; font-size: 1rem; text-decoration: none; 
          box-shadow: 0 4px 16px rgba(8,80,60,0.25);
          transition: transform 0.15s, box-shadow 0.15s, background 0.15s;
        }
        .wl-btn-primary:hover { background: #063B2C; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(8,80,60,0.35); }
        .wl-btn-secondary { 
          padding: 14px 32px; background: transparent; border-radius: 12px; color: #08503C; 
          font-weight: 700; font-size: 1rem; text-decoration: none; border: 2px solid rgba(8,80,60,0.2);
          transition: border-color 0.15s, color 0.15s;
        }
        .wl-btn-secondary:hover { border-color: #08503C; }

        /* WHATSAPP CTA */
        .wl-cta {
          position: fixed; bottom: 2rem; right: 2rem; z-index: 50;
          display: flex; align-items: center; gap: 10px;
          background: #25D366; color: #fff;
          font-weight: 700; font-size: 0.9rem; font-family: inherit;
          padding: 14px 24px; border-radius: 999px;
          border: none; cursor: pointer;
          box-shadow: 0 8px 24px rgba(37,211,102,0.35);
          text-decoration: none; transition: transform 0.15s, box-shadow 0.15s;
        }
        .wl-cta:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(37,211,102,0.45); }
      `}</style>

      <div className="wl-root">

        {/* NAVBAR */}
        <nav className="wl-nav">
          <div style={{ display: "flex", alignItems: "center", gap: "2.5rem" }}>
            <Link href="/" className="wl-brand">Wall-awe</Link>
            <div style={{ display: "flex", gap: "1.75rem" }}>
              {[
                { href: "/form", label: "Buat Laporan" },
                { href: "/complaints", label: "Pantau Laporan" },
                { href: "/jadwal", label: "Jadwal Keliling" }
              ].map(n => (
                <Link key={n.href} href={n.href} className="wl-nav-link">{n.label}</Link>
              ))}
            </div>
          </div>

          {/* SISI KANAN NAVBAR (Profil atau Tombol Login) */}
          <div ref={profileRef} style={{ position: "relative" }}>
            {user ? (
              <>
                <button
                  className={`wl-avatar-btn${profileOpen ? " active" : ""}`}
                  onClick={() => setProfileOpen(p => !p)}
                >
                  {initials}
                </button>

                {profileOpen && (
                  <div className="wl-dropdown">
                    <div style={{ padding: "1.25rem", borderBottom: "1px solid #E8EDEB", display: "flex", gap: 12, alignItems: "center" }}>
                      <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#08503C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.95rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                        {initials}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#111", textTransform: "capitalize" }}>
                          {user.username}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#8A9490", marginTop: 2, textTransform: "capitalize" }}>
                          {user.role}
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: "0.75rem" }}>
                      <Link href="/dashboard" style={{ display: "block", padding: "10px 12px", borderRadius: 8, fontSize: "0.85rem", fontWeight: 600, color: "#374553", textDecoration: "none" }}>
                        Masuk Dashboard
                      </Link>
                      <button onClick={handleLogout} style={{ width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 8, fontSize: "0.85rem", fontWeight: 600, color: "#EF4444", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", marginTop: 4 }}>
                        Keluar
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              // Tombol Login jika belum masuk
              <Link href="/login" className="wl-nav-login-btn">
                Masuk
              </Link>
            )}
          </div>
        </nav>

        {/* MAIN CONTENT */}
        <main className="wl-hero-container">
          <div className="dot-pattern" />

          <div className="wl-hero-content">
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const,
              color: "#08503C", marginBottom: "1.5rem",
              background: "rgba(95,212,170,0.2)", border: "1px solid rgba(95,212,170,0.4)",
              borderRadius: 999, padding: "6px 18px"
            }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#08503C", display: "inline-block" }} />
              Kota Yogyakarta
            </div>

            <h1>Sistem Pengaduan<br /><em>Sampah</em> Terpadu</h1>

            <p>
              Laporkan masalah sampah di lingkungan Anda. Setiap keluhan dipantau, diprioritaskan, dan diselesaikan secara transparan.
            </p>

            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" as const }}>
              <Link href="/form" className="wl-btn-primary">+ Buat Laporan</Link>
              <Link href="/jadwal" className="wl-btn-secondary">Lihat Jadwal Keliling</Link>
            </div>
          </div>
        </main>

        {/* WHATSAPP */}
        <a href="https://wa.me/6281234567890?text=Halo%2C%20saya%20ingin%20menanyakan%20lebih%20lanjut." target="_blank" rel="noreferrer" className="wl-cta">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
            <path d="M20.52 3.48A11.93 11.93 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.12.55 4.1 1.51 5.82L0 24l6.33-1.49A11.93 11.93 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.2-1.25-6.22-3.48-8.52zM12 22c-1.85 0-3.6-.5-5.12-1.37l-.37-.21-3.76.99 1-3.65-.24-.38A9.97 9.97 0 0 1 2 12C2 6.48 6.48 2 12 2s10 4.48 10 10-4.48 10-10 10zm5.44-7.44c-.3-.15-1.76-.87-2.03-.97-.28-.1-.48-.15-.68.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07A8.1 8.1 0 0 1 9.07 13.1c-.35-.43-.56-.93-.46-1.13.1-.2.3-.35.45-.52.1-.12.15-.22.23-.37.07-.15.03-.27-.02-.37-.05-.1-.68-1.64-.93-2.25-.25-.6-.5-.52-.68-.53h-.58c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.7.3 1.25.48 1.68.62.7.22 1.34.19 1.85.12.57-.08 1.75-.72 2-1.41.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z" />
          </svg>
          Hubungi via WhatsApp
        </a>
      </div>
    </>
  );
}
