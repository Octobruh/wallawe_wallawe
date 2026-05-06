"use client";

import { useEffect, useState } from "react";
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  // Layar Loading Awal
  if (isLoadingAuth) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F4F6F5] w-full min-h-[calc(100vh-64px)]">
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
      <div className="flex-1 flex w-full h-[calc(100vh-64px)] overflow-hidden text-gray-900 bg-[#F4F6F5] font-[Plus Jakarta Sans]">

        {/* SIDEBAR DASHBOARD (Disembunyikan di Mobile 'hidden md:flex') */}
        <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col flex-shrink-0 h-full overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b">
            <div className="text-xs font-bold uppercase text-[#08503C] tracking-wide">{user?.role === "admin" ? "Administrator" : "Petugas Kelurahan"}</div>
            <div className="text-base font-extrabold text-gray-800 mt-1">{user?.role === "admin" ? "Dinas Lingkungan" : namaKelurahanList}</div>
          </div>

          {/* User Profile Card */}
          <div className="p-4 mx-3 mt-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#08503C] flex items-center justify-center text-[0.8rem] font-bold text-white flex-shrink-0">{initials}</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[0.85rem] text-[#111] capitalize truncate">{user?.username}</div>
                <div className="text-[0.7rem] text-[#8A9490] mt-0.5 capitalize truncate">{user?.role === "admin" ? "Admin" : "Kelurahan"}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full mt-3 px-2.5 py-1.5 rounded-md text-[0.75rem] font-semibold text-[#DC2626] bg-[#FEE2E2] hover:bg-red-200 transition-colors border-none cursor-pointer"
            >
              Keluar
            </button>
          </div>

          {/* Navigation */}
          <nav className="p-4 flex flex-col gap-2 flex-1">
            <Link href="/dashboard" className="px-4 py-3 rounded-lg bg-green-100 text-[#08503C] font-semibold flex gap-3 items-center hover:bg-green-200 transition">
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              <span>Ringkasan</span>
            </Link>
            <Link href="/complaints" className="px-4 py-3 rounded-lg text-gray-700 font-semibold flex gap-3 items-center hover:bg-gray-100 transition">
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              <span>Kelola Laporan</span>
            </Link>
            {user?.role === "admin" && (
              <Link href="/jadwal" className="px-4 py-3 rounded-lg text-gray-700 font-semibold flex gap-3 items-center hover:bg-gray-100 transition">
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <span>Atur Jadwal</span>
              </Link>
            )}
          </nav>
        </aside>

        {/* MAIN KONTEN (Memiliki scroll y mandiri) */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          <BlurFade inView>
            <div className="max-w-6xl mx-auto">
              <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#08503C]">Dasbor Utama</h1>
                <p className="text-gray-500 text-xs sm:text-sm mt-1.5 sm:mt-2">Ringkasan aktivitas penanganan sampah {user?.role === "admin" ? "di seluruh Kota Yogyakarta" : `di wilayah ${namaKelurahanList}`}.</p>
              </div>

              {isLoadingData ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 sm:p-12 text-center shadow-sm">
                  <div className="text-[#08503C] font-semibold flex items-center justify-center gap-3 text-sm sm:text-base">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Menarik data dari server...
                  </div>
                </div>
              ) : (
                <>
                  {/* 4 KARTU STATISTIK */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-8">
                    <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
                      <div className="text-[0.65rem] sm:text-xs font-bold text-gray-400 uppercase tracking-wide">Belum Ditangani</div>
                      <div className="text-2xl sm:text-4xl font-extrabold text-gray-900 mt-2 sm:mt-3">{stats.pending}</div>
                      <div className="h-1 bg-yellow-300 rounded-full mt-2 sm:mt-3"></div>
                    </div>
                    <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
                      <div className="text-[0.65rem] sm:text-xs font-bold text-gray-400 uppercase tracking-wide">Sedang Diproses</div>
                      <div className="text-2xl sm:text-4xl font-extrabold text-gray-900 mt-2 sm:mt-3">{stats.processed}</div>
                      <div className="h-1 bg-blue-400 rounded-full mt-2 sm:mt-3"></div>
                    </div>
                    <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
                      <div className="text-[0.65rem] sm:text-xs font-bold text-gray-400 uppercase tracking-wide">Selesai</div>
                      <div className="text-2xl sm:text-4xl font-extrabold text-gray-900 mt-2 sm:mt-3">{stats.solved}</div>
                      <div className="h-1 bg-green-400 rounded-full mt-2 sm:mt-3"></div>
                    </div>
                    <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
                      <div className="text-[0.65rem] sm:text-xs font-bold text-gray-400 uppercase tracking-wide">Ditolak</div>
                      <div className="text-2xl sm:text-4xl font-extrabold text-gray-900 mt-2 sm:mt-3">{stats.rejected}</div>
                      <div className="h-1 bg-red-400 rounded-full mt-2 sm:mt-3"></div>
                    </div>
                  </div>

                  {/* DAFTAR LAPORAN TERBARU */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
                    <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                      <h2 className="font-extrabold text-base sm:text-lg text-gray-900">Laporan Terbaru</h2>
                      <Link href="/complaints" className="text-xs sm:text-sm text-[#08503C] font-semibold hover:text-[#063B2C] transition">Lihat Semua →</Link>
                    </div>

                    {recentComplaints.length === 0 ? (
                      <div className="p-8 sm:p-12 text-center text-gray-400 text-sm sm:text-base">Belum ada laporan yang masuk.</div>
                    ) : (
                      <>
                        {/* TAMPILAN DESKTOP (TABEL) */}
                        <div className="hidden md:block overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="px-6 py-3 text-left font-semibold text-gray-700">Waktu Laporan</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-700">Kelurahan</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-700">Keterangan</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-700">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {recentComplaints.map(c => (
                                <tr key={c.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                                  <td className="px-6 py-4">
                                    <span className="block font-semibold text-gray-900">{new Date(c.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                    <span className="block text-xs text-gray-500 mt-1">{new Date(c.created_at).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })} WIB</span>
                                  </td>
                                  <td className="px-6 py-4 font-semibold text-gray-800">{c.kelurahan}</td>
                                  <td className="px-6 py-4">
                                    <div className="max-w-[300px] truncate text-gray-500">
                                      {c.complaint_text}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    {c.status === "pending" && <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">⏳ Pending</span>}
                                    {c.status === "processed" && <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">⚙️ Diproses</span>}
                                    {c.status === "solved" && <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">✓ Selesai</span>}
                                    {c.status === "rejected" && <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">✕ Ditolak</span>}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* TAMPILAN MOBILE (KARTU) */}
                        <div className="grid grid-cols-1 md:hidden divide-y divide-gray-200">
                          {recentComplaints.map(c => (
                            <div key={c.id} className="p-4 flex flex-col gap-2 hover:bg-gray-50 transition">
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <span className="block font-semibold text-gray-900 text-[0.85rem]">{new Date(c.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                  <span className="block text-xs text-gray-500 mt-0.5">{new Date(c.created_at).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })} WIB</span>
                                </div>
                                <div>
                                  {c.status === "pending" && <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 text-[0.7rem] font-bold">⏳ Pending</span>}
                                  {c.status === "processed" && <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-[0.7rem] font-bold">⚙️ Diproses</span>}
                                  {c.status === "solved" && <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-[0.7rem] font-bold">✓ Selesai</span>}
                                  {c.status === "rejected" && <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-[0.7rem] font-bold">✕ Ditolak</span>}
                                </div>
                              </div>
                              <div className="mt-1">
                                <div className="font-bold text-gray-800 text-[0.9rem]">{c.kelurahan}</div>
                                <div className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">{c.complaint_text}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </BlurFade>
        </main>

      </div>
    </>
  );
}
