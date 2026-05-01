"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });

      if (!response.ok) throw new Error("Username atau password salah!");

      const data = await response.json();
      localStorage.setItem("token", data.access_token);
      router.push("/dashboard");
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Google Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }

        /* Pola dot halus di panel kiri */
        .dot-pattern {
          background-image: radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px);
          background-size: 24px 24px;
        }

        /* Lingkaran dekoratif */
        .deco-circle-1 {
          position: absolute;
          width: 380px; height: 380px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.07);
          bottom: -100px; left: -100px;
        }
        .deco-circle-2 {
          position: absolute;
          width: 220px; height: 220px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.07);
          top: 60px; right: -60px;
        }
        .deco-circle-3 {
          position: absolute;
          width: 500px; height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%);
          top: -200px; right: -150px;
          pointer-events: none;
        }

        /* Animasi fade-in naik */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.55s cubic-bezier(.22,1,.36,1) both; }
        .fade-up-2 { animation: fadeUp 0.55s 0.1s cubic-bezier(.22,1,.36,1) both; }
        .fade-up-3 { animation: fadeUp 0.55s 0.2s cubic-bezier(.22,1,.36,1) both; }

        /* Input focus ring */
        .input-field:focus {
          outline: none;
          border-color: #08503C;
          box-shadow: 0 0 0 3px rgba(8,80,60,0.12);
          background: #fff;
        }

        /* Tombol hover */
        .btn-primary { transition: background 0.2s, transform 0.15s, box-shadow 0.2s; }
        .btn-primary:hover:not(:disabled) {
          background: #063B2C;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(8,80,60,0.35);
        }
        .btn-primary:active:not(:disabled) { transform: translateY(0); }
      `}</style>

      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#F4F6F5" }}>

        {/* ── NAVBAR ──────────────────────────────────────────────────── */}
        <header style={{
          position: "fixed",
          top: 0, left: 0, right: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 2rem",
          height: "64px",
          background: "rgba(8,80,60,0.97)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.10)",
        }}>
          {/* Kiri: Brand + Nav links */}
          <div style={{ display: "flex", alignItems: "center", gap: "2.5rem" }}>
            <span style={{
              fontSize: "1.35rem",
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "0.12em",
            }}>
              Wall-awe
            </span>
            <nav style={{ display: "flex", gap: "1.75rem" }}>
              {[
                { href: "/", label: "Beranda" },
                { href: "/form", label: "Buat Laporan" },
                { href: "/complaints", label: "Pantau Laporan" },
                { href: "/jadwal", label: "Jadwal Keliling" },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  style={{
                    fontSize: "0.84rem",
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.75)",
                    textDecoration: "none",
                    letterSpacing: "0.02em",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.75)")}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        {/* ── KONTEN DUA PANEL ──────────────────────────────────────── */}
        <div style={{ display: "flex", flex: 1, paddingTop: "64px", minHeight: "100vh" }}>

          {/* PANEL KIRI ─ Hijau solid */}
          <div
            className="dot-pattern"
            style={{
              position: "relative",
              width: "45%",
              background: "#08503C",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "4rem 4rem 4rem 5rem",
              overflow: "hidden",
            }}
          >
            {/* Elemen dekoratif */}
            <div className="deco-circle-1" />
            <div className="deco-circle-2" />
            <div className="deco-circle-3" />

            {/* Tulisan Wall-awe super besar */}
            <div
              className="fade-up"
              style={{
                fontSize: "clamp(3.5rem, 6vw, 5.5rem)",
                fontWeight: 800,
                color: "#fff",
                lineHeight: 1,
                marginBottom: "0.5rem",
                position: "relative", zIndex: 1,
                letterSpacing: "-0.04em",
              }}
            >
              Wall-awe
            </div>

            {/* Judul yang diperbesar */}
            <h1
              className="fade-up-2"
              style={{
                fontSize: "clamp(2.5rem, 4vw, 3.5rem)",
                fontWeight: 700,
                color: "#fff",
                lineHeight: 1.15,
                marginBottom: "1.5rem",
                position: "relative", zIndex: 1,
                letterSpacing: "-0.02em",
              }}
            >
              Sistem Keluhan<br />
              <span style={{ color: "#5FD4AA" }}>Sampah</span> Terpadu
            </h1>

            {/* Deskripsi yang diperbesar */}
            <p
              className="fade-up-3"
              style={{
                fontSize: "1.1rem",
                color: "rgba(255,255,255,0.75)",
                lineHeight: 1.75,
                maxWidth: "420px",
                position: "relative", zIndex: 1,
              }}
            >
              Masuk ke portal dasbor untuk mengelola, memantau, dan menyelesaikan pengaduan masyarakat di lingkungan Anda.
            </p>
          </div>

          {/* PANEL KANAN ─ Off-white */}
          <div style={{
            flex: 1,
            background: "#F4F6F5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "3rem 2rem",
          }}>
            <div style={{
              width: "100%",
              maxWidth: "420px",
              background: "#fff",
              borderRadius: "20px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.04), 0 16px 40px rgba(0,0,0,0.08)",
              padding: "2.75rem",
              border: "1px solid #E8EDEB",
            }}>

              {/* Header form */}
              <div style={{ marginBottom: "2rem" }}>
                <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#111", margin: 0, letterSpacing: "-0.02em" }}>
                  Selamat Datang
                </h2>
                <p style={{ color: "#8A9490", fontSize: "0.88rem", marginTop: "6px" }}>
                  Silakan login untuk melanjutkan
                </p>
              </div>

              {/* Error alert */}
              {errorMsg && (
                <div style={{
                  marginBottom: "1.25rem",
                  padding: "12px 16px",
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderLeft: "3px solid #EF4444",
                  borderRadius: "8px",
                  color: "#B91C1C",
                  fontSize: "0.84rem",
                  fontWeight: 500,
                }}>
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {/* Username */}
                <div>
                  <label style={{
                    display: "block",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    color: "#374553",
                    marginBottom: "7px",
                    letterSpacing: "0.02em",
                  }}>
                    Username
                  </label>
                  <input
                    className="input-field"
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                    placeholder="Masukkan username Anda"
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      borderRadius: "10px",
                      border: "1.5px solid #E0E7E4",
                      background: "#FAFBFA",
                      fontSize: "0.93rem",
                      color: "#111",
                      transition: "all 0.2s",
                    }}
                  />
                </div>

                {/* Password */}
                <div>
                  <label style={{
                    display: "block",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    color: "#374553",
                    marginBottom: "7px",
                    letterSpacing: "0.02em",
                  }}>
                    Password
                  </label>
                  <input
                    className="input-field"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      borderRadius: "10px",
                      border: "1.5px solid #E0E7E4",
                      background: "#FAFBFA",
                      fontSize: "0.93rem",
                      color: "#111",
                      transition: "all 0.2s",
                    }}
                  />
                </div>

                {/* Tombol */}
                <button
                  className="btn-primary"
                  type="submit"
                  disabled={isLoading}
                  style={{
                    marginTop: "0.5rem",
                    width: "100%",
                    padding: "13px",
                    background: "#08503C",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    border: "none",
                    borderRadius: "10px",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    opacity: isLoading ? 0.7 : 1,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "8px",
                    letterSpacing: "0.02em",
                    boxShadow: "0 4px 16px rgba(8,80,60,0.25)",
                  }}
                >
                  {isLoading ? (
                    <>
                      <svg style={{ animation: "spin 1s linear infinite", width: 18, height: 18 }}
                        viewBox="0 0 24 24" fill="none">
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                        <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      Memproses...
                    </>
                  ) : (
                    "Masuk ke Dasbor →"
                  )}
                </button>
              </form>

              {/* Footer info */}
              <p style={{
                marginTop: "1.75rem",
                textAlign: "center",
                fontSize: "0.78rem",
                color: "#A0AEAD",
                lineHeight: 1.6,
              }}>
                Ada pertanyaan? Hubungi{" "}
                <a href="#" style={{ color: "#08503C", fontWeight: 600, textDecoration: "none" }}>
                  tim teknis
                </a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
