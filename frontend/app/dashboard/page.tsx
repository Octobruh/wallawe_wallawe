"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// --- Tipe Data ---
interface UserData {
  id: number;
  username: string;
  role: string;
  accessible_kelurahans?: { kelurahan_name: string }[];
}

interface Complaint {
  id: number;
  kelurahan: string;
  status: string;
  created_at: string;
  complaint_text: string;
}

export default function DashboardPage() {
  const router = useRouter();

  // State Autentikasi
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // State Data Dasbor
  const [recentComplaints, setRecentComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState({ pending: 0, processed: 0, solved: 0, rejected: 0 });
  const [isLoadingData, setIsLoadingData] = useState(true);

  // 1. Verifikasi User & Ambil Data
  useEffect(() => {
    const initDashboard = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        // A. Tarik Data User
        const resUser = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (!resUser.ok) throw new Error("Token tidak valid");
        const userData: UserData = await resUser.json();
        setUser(userData);

        // B. Tarik Data Laporan (Admin vs Kelurahan)
        const endpoint = userData.role === "admin" ? "/complaints/" : "/complaints/assigned";
        const resComplaints = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (resComplaints.ok) {
          const complaintsData: Complaint[] = await resComplaints.json();

          // Hitung Statistik
          let p = 0, pr = 0, s = 0, r = 0;
          complaintsData.forEach(c => {
            if (c.status === "pending") p++;
            else if (c.status === "processed") pr++;
            else if (c.status === "solved") s++;
            else if (c.status === "rejected") r++;
          });
          setStats({ pending: p, processed: pr, solved: s, rejected: r });

          // Ambil 5 Laporan Terbaru untuk tabel ringkasan
          setRecentComplaints(complaintsData.slice(0, 5));
        }
      } catch (error) {
        console.error("Gagal memuat dasbor:", error);
        localStorage.removeItem("token");
        router.push("/login");
      } finally {
        setIsLoadingAuth(false);
        setIsLoadingData(false);
      }
    };

    initDashboard();
  }, [router]);

  // Handler klik di luar dropdown profil
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  // Layar Loading Awal
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F6F5]">
        <div className="flex items-center gap-3 text-[#08503C] font-bold text-xl">
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Memuat Dasbor...
        </div>
      </div>
    );
  }

  const initials = user ? user.username.substring(0, 2).toUpperCase() : "??";
  const namaKelurahanList = user?.accessible_kelurahans?.map(k => k.kelurahan_name).join(", ");

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .wl-root { font-family: 'Plus Jakarta Sans', sans-serif; background: #F4F6F5; min-height: 100vh; color: #111; display: flex; flex-direction: column; overflow: hidden; }

        /* NAVBAR GLOBAL */
        .wl-nav { position: relative; z-index: 100; height: 64px; display: flex; align-items: center; justify-content: space-between; padding: 0 2rem; background: rgba(8,80,60,0.97); border-bottom: 1px solid rgba(255,255,255,0.10); flex-shrink: 0; }
        .wl-brand { font-size: 1.35rem; font-weight: 800; color: #fff; letter-spacing: 0.12em; text-decoration: none; }
        .wl-nav-link { font-size: 0.84rem; font-weight: 600; color: rgba(255,255,255,0.75); text-decoration: none; transition: color 0.15s; }
        .wl-nav-link:hover, .wl-nav-link.active { color: #fff; }
        
        .wl-avatar-btn { width: 36px; height: 36px; border-radius: 50%; border: 1.5px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.1); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 700; color: #fff; transition: all 0.15s; }
        .wl-avatar-btn:hover, .wl-avatar-btn.active { border-color: #5FD4AA; background: rgba(95,212,170,0.15); color: #5FD4AA; }
        .wl-dropdown { position: absolute; top: calc(100% + 12px); right: 0; width: 280px; background: #fff; border: 1px solid #E8EDEB; border-radius: 16px; box-shadow: 0 16px 40px rgba(0,0,0,0.12); overflow: hidden; animation: dropIn 0.18s cubic-bezier(.22,1,.36,1); }
        @keyframes dropIn { from { opacity: 0; transform: translateY(-8px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }

        /* LAYOUT DASBOR (SIDEBAR + MAIN) */
        .wl-dashboard-container { display: flex; flex: 1; overflow: hidden; }
        
        /* SIDEBAR PUTIH */
        .wl-sidebar { width: 260px; background: #fff; border-right: 1px solid #E8EDEB; display: flex; flex-direction: column; flex-shrink: 0; overflow-y: auto; }
        .wl-sidebar-header { padding: 1.5rem; border-bottom: 1px solid #F4F6F5; }
        .wl-sidebar-role { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #08503C; margin-bottom: 4px; }
        .wl-sidebar-name { font-size: 1.05rem; font-weight: 700; color: #111; word-break: break-word; }
        
        .wl-sidebar-nav { padding: 1.5rem 1rem; display: flex; flex-direction: column; gap: 0.5rem; flex: 1; }
        .wl-sidebar-item { padding: 12px 16px; border-radius: 10px; font-size: 0.9rem; font-weight: 600; text-decoration: none; display: flex; align-items: center; gap: 12px; transition: all 0.2s; color: #374553; }
        .wl-sidebar-item:hover { background: #F4F6F5; color: #08503C; }
        .wl-sidebar-item.active { background: #E6F3EE; color: #08503C; border: 1px solid rgba(8,80,60,0.1); }
        .wl-sidebar-icon { width: 20px; height: 20px; opacity: 0.7; }
        .wl-sidebar-item.active .wl-sidebar-icon { opacity: 1; }

        /* MAIN CONTENT */
        .wl-main-content { flex: 1; padding: 2rem 3rem; overflow-y: auto; background: #F4F6F5; }
        .wl-page-title { font-size: 2rem; font-weight: 800; color: #08503C; margin-bottom: 0.25rem; letter-spacing: -0.02em; }
        .wl-page-subtitle { color: #8A9490; font-size: 0.95rem; margin-bottom: 2.5rem; }

        /* STAT CARDS */
        .wl-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem; }
        .wl-stat-card { background: #fff; padding: 1.5rem; border-radius: 16px; border: 1px solid #E8EDEB; box-shadow: 0 4px 12px rgba(0,0,0,0.02); display: flex; flex-direction: column; position: relative; overflow: hidden; }
        .wl-stat-label { font-size: 0.8rem; font-weight: 700; color: #8A9490; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
        .wl-stat-value { font-size: 2.5rem; font-weight: 800; color: #111; line-height: 1; }
        .wl-stat-line { position: absolute; bottom: 0; left: 0; right: 0; height: 4px; }
        .line-pending { background: #F59E0B; }
        .line-process { background: #3B82F6; }
        .line-solved { background: #10B981; }
        .line-reject { background: #EF4444; }

        /* TABEL RINGKASAN */
        .wl-panel { background: #fff; border-radius: 16px; border: 1px solid #E8EDEB; box-shadow: 0 4px 12px rgba(0,0,0,0.02); overflow: hidden; }
        .wl-panel-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid #F4F6F5; display: flex; justify-content: space-between; align-items: center; }
        .wl-panel-title { font-size: 1.1rem; font-weight: 800; color: #111; }
        .wl-panel-link { font-size: 0.85rem; font-weight: 700; color: #08503C; text-decoration: none; }
        .wl-panel-link:hover { text-decoration: underline; }

        .wl-table { width: 100%; border-collapse: collapse; text-align: left; }
        .wl-table th, .wl-table td { border-bottom: 1px solid #F4F6F5; padding: 1rem 1.5rem; }
        .wl-table th { font-weight: 700; color: #8A9490; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; background: #FAFBFA; }
        .wl-table td { font-size: 0.9rem; color: #374553; }
        
        /* Tambahan styling teks bertingkat untuk tabel */
        .wl-row-title { font-weight: 700; color: #111; margin-bottom: 4px; display: block; }
        .wl-row-desc { font-size: 0.85rem; color: #8A9490; display: block; }
        
        .wl-badge { display: inline-flex; padding: 4px 10px; border-radius: 999px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
        .wl-badge-pending { background: #FFFBEB; color: #D97706; border: 1px solid #FCD34D; }
        .wl-badge-process { background: #EFF6FF; color: #2563EB; border: 1px solid #BFDBFE; }
        .wl-badge-solved { background: #ECFDF5; color: #059669; border: 1px solid #A7F3D0; }
        .wl-badge-reject { background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA; }
      `}</style>

      <div className="wl-root">

        {/* NAVBAR GLOBAL ATAS */}
        <nav className="wl-nav">
          <div style={{ display: "flex", alignItems: "center", gap: "2.5rem" }}>
            <Link href="/" className="wl-brand">Wall-awe</Link>
            <div style={{ display: "flex", gap: "1.75rem" }}>
              <Link href="/form" className="wl-nav-link">Buat Laporan</Link>
              <Link href="/complaints" className="wl-nav-link">Pantau Laporan</Link>
              <Link href="/jadwal" className="wl-nav-link">Jadwal Keliling</Link>
            </div>
          </div>

          <div ref={profileRef} style={{ position: "relative" }}>
            <button className={`wl-avatar-btn${profileOpen ? " active" : ""}`} onClick={() => setProfileOpen(p => !p)}>{initials}</button>
            {profileOpen && (
              <div className="wl-dropdown">
                {/* --- BAGIAN HEADER PROFIL YANG DIPERBARUI --- */}
                <div style={{ padding: "1.25rem", borderBottom: "1px solid #E8EDEB", display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#08503C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.95rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>{initials}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#111", textTransform: "capitalize" }}>{user?.username}</div>
                    <div style={{ fontSize: "0.75rem", color: "#8A9490", marginTop: 2, textTransform: "capitalize" }}>{user?.role}</div>

                    {/* Badge Kelurahan */}
                    {user?.role !== "admin" && user?.accessible_kelurahans && user.accessible_kelurahans.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" }}>
                        {user.accessible_kelurahans.map((kel, index) => (
                          <span
                            key={index}
                            style={{
                              background: "#E6F3EE",
                              color: "#08503C",
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              padding: "4px 8px",
                              borderRadius: "6px",
                              border: "1px solid #A7F3D0",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em"
                            }}
                          >
                            {kel.kelurahan_name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ padding: "0.75rem" }}>
                  <button onClick={handleLogout} style={{ width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 8, fontSize: "0.85rem", fontWeight: 600, color: "#EF4444", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Keluar Sistem</button>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* CONTAINER BAWAH */}
        <div className="wl-dashboard-container">

          {/* SIDEBAR DASHBOARD */}
          <aside className="wl-sidebar">
            <div className="wl-sidebar-header">
              <div className="wl-sidebar-role">{user?.role === "admin" ? "Administrator" : "Petugas Kelurahan"}</div>
              <div className="wl-sidebar-name">{user?.role === "admin" ? "Dinas Lingkungan" : namaKelurahanList}</div>
            </div>

            <nav className="wl-sidebar-nav">
              <Link href="/dashboard" className="wl-sidebar-item active">
                <svg className="wl-sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                Ringkasan
              </Link>
              <Link href="/complaints" className="wl-sidebar-item">
                <svg className="wl-sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                Kelola Laporan
              </Link>
              {user?.role === "admin" && (
                <Link href="/jadwal" className="wl-sidebar-item">
                  <svg className="wl-sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  Atur Jadwal Truk
                </Link>
              )}
            </nav>
          </aside>

          {/* MAIN KONTEN */}
          <main className="wl-main-content">
            <h1 className="wl-page-title">Dasbor Utama</h1>
            <p className="wl-page-subtitle">Ringkasan aktivitas penanganan sampah {user?.role === "admin" ? "di seluruh Kota Yogyakarta" : `di wilayah ${namaKelurahanList}`}.</p>

            {isLoadingData ? (
              <div style={{ color: "#08503C", fontWeight: 600 }}>Menarik data dari database...</div>
            ) : (
              <>
                {/* 4 KARTU STATISTIK */}
                <div className="wl-stats-grid">
                  <div className="wl-stat-card">
                    <div className="wl-stat-label">Belum Ditangani</div>
                    <div className="wl-stat-value">{stats.pending}</div>
                    <div className="wl-stat-line line-pending"></div>
                  </div>
                  <div className="wl-stat-card">
                    <div className="wl-stat-label">Sedang Diproses</div>
                    <div className="wl-stat-value">{stats.processed}</div>
                    <div className="wl-stat-line line-process"></div>
                  </div>
                  <div className="wl-stat-card">
                    <div className="wl-stat-label">Selesai Dibersihkan</div>
                    <div className="wl-stat-value">{stats.solved}</div>
                    <div className="wl-stat-line line-solved"></div>
                  </div>
                  <div className="wl-stat-card">
                    <div className="wl-stat-label">Laporan Ditolak</div>
                    <div className="wl-stat-value">{stats.rejected}</div>
                    <div className="wl-stat-line line-reject"></div>
                  </div>
                </div>

                {/* TABEL LAPORAN TERBARU */}
                <div className="wl-panel">
                  <div className="wl-panel-header">
                    <h2 className="wl-panel-title">Laporan Terbaru Masuk</h2>
                    <Link href="/complaints" className="wl-panel-link">Lihat Semua →</Link>
                  </div>

                  {recentComplaints.length === 0 ? (
                    <div style={{ padding: "3rem", textAlign: "center", color: "#8A9490" }}>Belum ada laporan yang masuk.</div>
                  ) : (
                    <table className="wl-table">
                      <thead>
                        <tr>
                          <th>Waktu Laporan</th>
                          <th>Kelurahan</th>
                          <th>Keterangan Ringkas</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentComplaints.map(c => (
                          <tr key={c.id}>
                            <td>
                              <span className="wl-row-title">{new Date(c.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              <span className="wl-row-desc">{new Date(c.created_at).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })} WIB</span>
                            </td>
                            <td style={{ fontWeight: 600 }}>{c.kelurahan}</td>
                            <td>
                              <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "250px" }}>
                                {c.complaint_text}
                              </div>
                            </td>
                            <td>
                              {c.status === "pending" && <span className="wl-badge wl-badge-pending">Pending</span>}
                              {c.status === "processed" && <span className="wl-badge wl-badge-process">Diproses</span>}
                              {c.status === "solved" && <span className="wl-badge wl-badge-solved">Selesai</span>}
                              {c.status === "rejected" && <span className="wl-badge wl-badge-reject">Ditolak</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
          </main>

        </div>
      </div>
    </>
  );
}
