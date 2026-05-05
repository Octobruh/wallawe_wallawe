"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BlurFade } from "@/components/ui/blur-fade";

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
      <div className="min-h-screen bg-[#F4F6F5] flex flex-col text-gray-900">
        <BlurFade inView>

        {/* NAVBAR GLOBAL ATAS */}
        <nav className="h-16 flex items-center justify-between px-8 bg-[#08503C] text-white">
          <div className="flex items-center gap-10">
            <Link href="/" className="text-xl font-extrabold tracking-widest">Wall-awe</Link>
            <div className="flex gap-7">
              <Link href="/form" className="text-sm font-semibold text-white/70 hover:text-white transition">Buat Laporan</Link>
              <Link href="/complaints" className="text-sm font-semibold text-white/70 hover:text-white transition">Pantau Laporan</Link>
              <Link href="/jadwal" className="text-sm font-semibold text-white/70 hover:text-white transition">Jadwal Keliling</Link>
            </div>
          </div>

          <div ref={profileRef} style={{ position: "relative" }}>
            <button
              className={`w-9 h-9 rounded-full border border-white/30 bg-white/10 flex items-center justify-center text-sm font-bold hover:bg-green-100 hover:text-green-700 transition${profileOpen ? " active" : ""}`}
              onClick={() => setProfileOpen(p => !p)}
            >
              {initials}
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-3 w-72 bg-white text-black rounded-xl shadow-xl border border-gray-200">
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
          <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-6 border-b">
              <div className="text-xs font-bold uppercase text-[#08503C]">{user?.role === "admin" ? "Administrator" : "Petugas Kelurahan"}</div>
              <div className="text-base font-semibold">{user?.role === "admin" ? "Dinas Lingkungan" : namaKelurahanList}</div>
            </div>

            <nav className="p-4 flex flex-col gap-2">
              <Link href="/dashboard" className="px-4 py-2 rounded-lg bg-green-100 text-[#08503C] font-semibold flex gap-2">
                <svg className="wl-sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                Ringkasan
              </Link>
              <Link href="/complaints" className="px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 flex gap-2">
                <svg className="wl-sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                Kelola Laporan
              </Link>
              {user?.role === "admin" && (
                <Link href="/jadwal" className="px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 flex gap-2">
                  <svg className="wl-sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  Atur Jadwal Truk
                </Link>
              )}
            </nav>
          </aside>

          {/* MAIN KONTEN */}
          <main className="flex-1 p-8 overflow-y-auto">
            <h1 className="text-2xl font-extrabold text-[#08503C]">Dasbor Utama</h1>
            <p className="text-gray-500 mb-8">Ringkasan aktivitas penanganan sampah {user?.role === "admin" ? "di seluruh Kota Yogyakarta" : `di wilayah ${namaKelurahanList}`}.</p>

            {isLoadingData ? (
              <div style={{ color: "#08503C", fontWeight: 600 }}>Menarik data dari database...</div>
            ) : (
              <>
                {/* 4 KARTU STATISTIK */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-5 rounded-xl border shadow-sm">
                      <div className="text-xs font-bold text-gray-400 uppercase">Belum Ditangani</div>
                      <div className="text-3xl font-extrabold">{stats.pending}</div>
                    <div className="wl-stat-line line-pending"></div>
                  </div>
                    <div className="bg-white p-5 rounded-xl border shadow-sm">
                      <div className="text-xs font-bold text-gray-400 uppercase">Sedang Diproses</div>
                      <div className="text-3xl font-extrabold">{stats.processed}</div>
                    <div className="wl-stat-line line-process"></div>
                  </div>
                    <div className="bg-white p-5 rounded-xl border shadow-sm">
                      <div className="text-xs font-bold text-gray-400 uppercase">Selesai Dibersihkan</div>
                      <div className="text-3xl font-extrabold">{stats.solved}</div>
                    <div className="wl-stat-line line-solved"></div>
                  </div>
                    <div className="bg-white p-5 rounded-xl border shadow-sm">
                      <div className="text-xs font-bold text-gray-400 uppercase">Laporan Ditolak</div>
                      <div className="text-3xl font-extrabold">{stats.rejected}</div>
                    <div className="wl-stat-line line-reject"></div>
                  </div>
                </div>

                {/* TABEL LAPORAN TERBARU */}
                  <div className="bg-white rounded-xl border shadow-sm">
                    <div className="p-4 border-b flex justify-between">
                      <h2 className="font-bold">Laporan Terbaru Masuk</h2>
                      <Link href="/complaints" className="text-sm text-[#08503C] font-semibold">Lihat Semua →</Link>
                  </div>

                  {recentComplaints.length === 0 ? (
                    <div style={{ padding: "3rem", textAlign: "center", color: "#8A9490" }}>Belum ada laporan yang masuk.</div>
                  ) : (
                        <table className="w-full text-sm">
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
                              {c.status === "pending" && <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold">Pending</span>}
                              {c.status === "processed" && <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">Diproses</span>}
                              {c.status === "solved" && <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">Selesai</span>}
                              {c.status === "rejected" && <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">Ditolak</span>}
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
        </BlurFade>
      </div>
    </>
  );
}
