"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BlurFade } from "@/components/ui/blur-fade";

// --- Tipe Data ---
interface Complaint {
  id: number;
  kelurahan: string;
  rt: number;
  rw: number;
  jalan: string;
  description_location: string;
  complaint_text: string;
  photo_url: string;
  status: string;
  created_at: string;
  admin_photo_url?: string;
  solved_at?: string;
  priority_score?: string;
  category?: string;
}

type User = {
  username: string;
  role: string;
  accessible_kelurahans?: { kelurahan_name: string }[];
} | null;

const list_kelurahan = [
  "Baciro", "Bausasran", "Bener", "Brontokusuman", "Bumijo",
  "Cokrodiningratan", "Demangan", "Gedongkiwo", "Giwangan", "Gowongan",
  "Gunungketur", "Kadipaten", "Karangwaru", "Keparakan", "Klitren",
  "Kotabaru", "Kricak", "Mantrijeron", "Muja Muju", "Ngampilan",
  "Ngupasan", "Notoprajan", "Pakuncen", "Pandeyan", "Panembahan",
  "Patangpuluhan", "Patehan", "Prawirodirjan", "Prenggan", "Pringgokusuman",
  "Purbayan", "Purwokinanti", "Rejowinangun", "Semaki", "Sorosutan",
  "Sosromenduran", "Suryatmajan", "Suryodiningratan", "Tahunan", "Tegalpanggung",
  "Tegalrejo", "Terban", "Warungboto", "Wirobrajan", "Wirogunan"
];

export default function PantauLaporanPage() {
  const router = useRouter();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const [filterKelurahan, setFilterKelurahan] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<"processed" | "rejected" | "solved" | "">("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFile, setActionFile] = useState<File | null>(null);
  const [actionError, setActionError] = useState("");

  // State Paginasi
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchComplaints = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");

    try {
      const params = new URLSearchParams();
      if (filterKelurahan) params.append("kelurahan", filterKelurahan);
      if (filterStatus) params.append("status", filterStatus);

      const headers: HeadersInit = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/complaints/?${params.toString()}`, {
        headers
      });

      if (res.ok) {
        const data = await res.json();
        setComplaints(data);
      }
    } catch (error) {
      console.error("Gagal mengambil laporan:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initPage = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const resUser = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (resUser.ok) setUser(await resUser.json());
          else localStorage.removeItem("token");
        } catch (err) {
          console.error("Gagal memuat profil", err);
        }
      }
      fetchComplaints();
    };
    initPage();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    fetchComplaints();
  }, [filterKelurahan, filterStatus]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setProfileOpen(false);
    fetchComplaints();
  };

  const executeAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    setActionLoading(true);
    setActionError("");
    const token = localStorage.getItem("token");

    try {
      if (actionType === "processed" || actionType === "rejected") {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/complaints/assigned/${selectedComplaint.id}/status`, {
          method: "PATCH",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            status: actionType,
            is_approved: actionType === "processed"
          })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || "Gagal memperbarui status.");
        }

      } else if (actionType === "solved") {
        if (!actionFile) throw new Error("Foto bukti wajib dilampirkan.");

        const formData = new FormData();
        formData.append("admin_photo", actionFile);

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/complaints/${selectedComplaint.id}/solve`, {
          method: "PATCH",
          headers: { "Authorization": `Bearer ${token}` },
          body: formData
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || "Gagal menyelesaikan laporan.");
        }
      }

      await fetchComplaints();
      setIsActionModalOpen(false);
      setIsDetailModalOpen(false);
      setActionFile(null);

    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <span className="inline-flex px-3 py-1 rounded-full text-[0.75rem] font-bold uppercase tracking-wider bg-yellow-100 text-yellow-700 border border-yellow-300">Pending</span>;
      case "processed": return <span className="inline-flex px-3 py-1 rounded-full text-[0.75rem] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 border border-blue-300">Diproses</span>;
      case "solved": return <span className="inline-flex px-3 py-1 rounded-full text-[0.75rem] font-bold uppercase tracking-wider bg-green-100 text-green-700 border border-green-300">Selesai</span>;
      case "rejected": return <span className="inline-flex px-3 py-1 rounded-full text-[0.75rem] font-bold uppercase tracking-wider bg-red-100 text-red-700 border border-red-300">Ditolak</span>;
      default: return <span className="inline-flex px-3 py-1 rounded-full text-[0.75rem] font-bold uppercase tracking-wider bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  const getPriorityBadge = (score?: string) => {
    if (!score || score === "Unknown") return <span className="text-gray-500 font-semibold">-</span>;
    if (score === "Tinggi") return <span className="text-red-600 font-extrabold">Tinggi</span>;
    if (score === "Sedang") return <span className="text-amber-600 font-bold">Sedang</span>;
    return <span className="text-emerald-600 font-semibold">Rendah</span>;
  };

  const isKelurahanAuthorized = (kelurahanTarget: string) => {
    if (user?.role !== "kelurahan") return false;
    if (!user.accessible_kelurahans) return false;
    return user.accessible_kelurahans.some((k) => k.kelurahan_name === kelurahanTarget);
  };

  // Logika Paginasi
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentComplaints = complaints.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(complaints.length / itemsPerPage);

  return (
    <>
      <div className="flex-1 w-full flex flex-col text-gray-900 px-4 py-6 bg-[#F4F6F5] min-h-[calc(100vh-64px)] font-[Plus Jakarta Sans]">
        <BlurFade inView>
          <div className="max-w-6xl mx-auto w-full">

            <header className="w-full pt-6 pb-6">
              <h1 className="text-3xl font-extrabold text-[#08503C] mb-2">Pantau Laporan Sampah</h1>
              <p className="text-gray-600">Lihat progres penanganan sampah di Kota Yogyakarta secara transparan.</p>
            </header>

            <div className="mb-8 py-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="px-6 flex gap-6 items-end flex-wrap">
                <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
                  <label className="text-xs font-bold text-[#08503C] uppercase tracking-wide">Filter Kelurahan</label>
                  <select className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#08503C] focus:ring-2 focus:ring-[#08503C]/20 cursor-pointer" value={filterKelurahan} onChange={(e) => setFilterKelurahan(e.target.value)}>
                    <option value="">Semua Kelurahan</option>
                    {list_kelurahan.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
                  <label className="text-xs font-bold text-[#08503C] uppercase tracking-wide">Filter Status</label>
                  <select className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#08503C] focus:ring-2 focus:ring-[#08503C]/20 cursor-pointer" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="">Semua Status</option>
                    <option value="pending">Pending</option>
                    <option value="processed">Diproses</option>
                    <option value="solved">Selesai</option>
                    <option value="rejected">Ditolak</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">
              {isLoading ? (
                <div className="p-16 text-center text-[#08503C] font-bold">Memuat daftar laporan...</div>
              ) : complaints.length === 0 ? (
                <div className="p-16 text-center text-gray-400">Tidak ada laporan yang ditemukan dengan filter saat ini.</div>
              ) : (
                <div className="flex flex-col">

                  {/* ======================================= */}
                  {/* 1. TAMPILAN DESKTOP (TABEL) */}
                  {/* ======================================= */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full border-collapse text-left min-w-[800px]">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="px-6 py-4 font-semibold text-gray-700 text-sm">Waktu Laporan</th>
                          <th className="px-6 py-4 font-semibold text-gray-700 text-sm">Lokasi Utama</th>
                          <th className="px-6 py-4 font-semibold text-gray-700 text-sm">Status</th>
                          {user?.role === "admin" && <th className="px-6 py-4 font-semibold text-gray-700 text-sm">Prioritas</th>}
                          {user?.role === "admin" && <th className="px-6 py-4 font-semibold text-gray-700 text-sm">Kategori AI</th>}
                          <th className="px-6 py-4 font-semibold text-gray-700 text-sm text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentComplaints.map((c) => (
                          <tr key={c.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                            <td className="px-6 py-4">
                              <span className="block font-bold text-gray-900 mb-1">{new Date(c.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              <span className="block text-xs text-gray-500">{new Date(c.created_at).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })} WIB</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="block font-bold text-gray-900 mb-1 truncate max-w-[250px]">{c.jalan}</span>
                              <span className="block text-xs text-gray-500">{c.kelurahan} (RT {c.rt}/RW {c.rw})</span>
                            </td>
                            <td className="px-6 py-4">{getStatusBadge(c.status)}</td>
                            {user?.role === "admin" && <td className="px-6 py-4">{getPriorityBadge(c.priority_score)}</td>}
                            {user?.role === "admin" && <td className="px-6 py-4"><span className="text-[0.85rem] font-semibold bg-gray-100 px-2 py-1 rounded-md text-gray-700 border border-gray-200">{c.category || "-"}</span></td>}
                            <td className="px-6 py-4 text-right">
                              <button
                                className="px-4 py-2 bg-[#08503C] text-white rounded-md text-sm font-semibold hover:bg-[#063B2C] transition whitespace-nowrap"
                                onClick={() => {
                                  setSelectedComplaint(c);
                                  setIsDetailModalOpen(true);
                                }}
                              >
                                Lihat Detail
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* ======================================= */}
                  {/* 2. TAMPILAN MOBILE (KARTU LIST) */}
                  {/* ======================================= */}
                  <div className="grid grid-cols-1 md:hidden divide-y divide-gray-200">
                    {currentComplaints.map((c) => (
                      <div key={c.id} className="flex flex-col p-5 gap-3 hover:bg-gray-50 transition">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="block font-bold text-gray-900 text-[0.95rem]">{new Date(c.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            <span className="block text-xs text-gray-500">{new Date(c.created_at).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })} WIB</span>
                          </div>
                          <div>{getStatusBadge(c.status)}</div>
                        </div>

                        <div className="mt-1">
                          <span className="block font-bold text-gray-900 text-[0.95rem] leading-tight">{c.jalan}</span>
                          <span className="block text-xs text-gray-500 mt-0.5">{c.kelurahan} (RT {c.rt}/RW {c.rw})</span>
                        </div>

                        {user?.role === "admin" && (
                          <div className="flex gap-6 border-t border-gray-100 pt-3 mt-1">
                            <div className="text-xs">
                              <span className="text-gray-500 block mb-1">Prioritas:</span>
                              {getPriorityBadge(c.priority_score)}
                            </div>
                            <div className="text-xs">
                              <span className="text-gray-500 block mb-1">Kategori:</span>
                              <span className="font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 inline-block">{c.category || "-"}</span>
                            </div>
                          </div>
                        )}

                        <button
                          className="w-full mt-3 px-4 py-2.5 bg-[#08503C] text-white rounded-md text-sm font-bold hover:bg-[#063B2C] transition flex items-center justify-center gap-2 shadow-sm"
                          onClick={() => {
                            setSelectedComplaint(c);
                            setIsDetailModalOpen(true);
                          }}
                        >
                          Lihat Detail Laporan
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* ======================================= */}
                  {/* KONTROL PAGINASI */}
                  {/* ======================================= */}
                  {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between flex-wrap gap-4">
                      <span className="text-sm text-gray-600">
                        Menampilkan <span className="font-bold text-gray-900">{indexOfFirstItem + 1}</span> hingga <span className="font-bold text-gray-900">{Math.min(indexOfLastItem, complaints.length)}</span> dari <span className="font-bold text-gray-900">{complaints.length}</span> laporan
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white font-semibold text-gray-700 transition"
                        >
                          Sebelumnya
                        </button>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white font-semibold text-gray-700 transition"
                        >
                          Selanjutnya
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>

          </div>
        </BlurFade>

        {/* MODAL 1: DETAIL LAPORAN */}
        {isDetailModalOpen && selectedComplaint && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) setIsDetailModalOpen(false) }}>
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">

              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 flex-shrink-0">
                <h2 className="font-extrabold text-lg text-gray-900">Detail Laporan #{selectedComplaint.id}</h2>
                <button className="text-gray-400 hover:text-red-500 font-bold text-xl p-1" onClick={() => setIsDetailModalOpen(false)}>✕</button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                  {/* Kolom Gambar */}
                  <div className="flex flex-col gap-6">
                    <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-sm">
                      <div className="p-2 text-center text-[0.75rem] font-bold bg-[#08503C] text-white uppercase tracking-wider">Foto Saat Dilaporkan</div>
                      <img className="w-full h-[250px] object-cover block" src={selectedComplaint.photo_url.startsWith('http') ? selectedComplaint.photo_url : `${process.env.NEXT_PUBLIC_API_URL}${selectedComplaint.photo_url}`} alt="Bukti Pelapor" />
                    </div>

                    {selectedComplaint.status === "solved" && selectedComplaint.admin_photo_url && (
                      <div className="rounded-xl overflow-hidden border-2 border-green-200 bg-green-50 shadow-sm">
                        <div className="p-2 text-center text-[0.75rem] font-bold bg-green-600 text-white uppercase tracking-wider">Foto Penyelesaian</div>
                        <img className="w-full h-[250px] object-cover block" src={selectedComplaint.admin_photo_url.startsWith('http') ? selectedComplaint.admin_photo_url : `${process.env.NEXT_PUBLIC_API_URL}${selectedComplaint.admin_photo_url}`} alt="Bukti Selesai" />
                      </div>
                    )}
                  </div>

                  {/* Kolom Info */}
                  <div>
                    <div className="flex flex-wrap gap-2 mb-6 items-center">
                      {getStatusBadge(selectedComplaint.status)}
                      {user?.role === "admin" && (
                        <span className="inline-flex px-3 py-1 rounded-full text-[0.75rem] font-bold tracking-wider bg-gray-100 text-gray-700 border border-gray-300">
                          Kategori: {selectedComplaint.category || "Umum"}
                        </span>
                      )}
                    </div>

                    <div className="mb-5">
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Lokasi Lengkap</div>
                      <div className="text-[0.95rem] text-gray-900 font-medium leading-relaxed">
                        <strong>{selectedComplaint.jalan}</strong>, Kelurahan {selectedComplaint.kelurahan}, RT {selectedComplaint.rt}/RW {selectedComplaint.rw}<br />
                        <span className="text-gray-500 text-sm mt-1 inline-block">
                          Patokan: {selectedComplaint.description_location}
                        </span>
                      </div>
                    </div>

                    <div className="mb-5">
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Deskripsi Laporan</div>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-gray-800 leading-relaxed text-sm shadow-inner">
                        {selectedComplaint.complaint_text}
                      </div>
                    </div>

                    <div className="mb-5">
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Waktu Laporan Masuk</div>
                      <div className="text-[0.95rem] text-gray-900 font-semibold">{new Date(selectedComplaint.created_at).toLocaleString("id-ID")}</div>
                    </div>

                    {selectedComplaint.solved_at && (
                      <div className="mb-5">
                        <div className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">Waktu Diselesaikan</div>
                        <div className="text-[0.95rem] text-gray-900 font-semibold">{new Date(selectedComplaint.solved_at).toLocaleString("id-ID")}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50 flex-shrink-0">
                {user?.role === "kelurahan" && selectedComplaint.status === "pending" && isKelurahanAuthorized(selectedComplaint.kelurahan) && (
                  <>
                    <button className="px-4 py-2 bg-red-100 text-red-600 rounded-md font-semibold hover:bg-red-200 transition" onClick={() => { setActionType("rejected"); setIsActionModalOpen(true); }}>
                      Tolak Laporan
                    </button>
                    <button className="px-4 py-2 bg-[#08503C] text-white rounded-md font-semibold hover:bg-[#063B2C] transition" onClick={() => { setActionType("processed"); setIsActionModalOpen(true); }}>
                      Proses Penanganan
                    </button>
                  </>
                )}

                {user?.role === "admin" && selectedComplaint.status !== "solved" && (
                  <button className="px-4 py-2 bg-[#08503C] text-white rounded-md font-semibold hover:bg-[#063B2C] transition" onClick={() => { setActionType("solved"); setIsActionModalOpen(true); }}>
                    Tandai Selesai & Unggah Bukti
                  </button>
                )}

                <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md font-semibold hover:bg-gray-100 transition" onClick={() => setIsDetailModalOpen(false)}>Tutup</button>
              </div>

            </div>
          </div>
        )}

        {/* MODAL 2: KONFIRMASI AKSI */}
        {isActionModalOpen && selectedComplaint && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4" onClick={(e) => { if (e.target === e.currentTarget) { setIsActionModalOpen(false); setActionError(""); } }}>
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 flex-shrink-0">
                <h2 className="font-extrabold text-lg text-gray-900">
                  {actionType === "processed" ? "Konfirmasi Proses" :
                    actionType === "rejected" ? "Konfirmasi Penolakan" :
                      "Penyelesaian Laporan"}
                </h2>
                <button className="text-gray-400 hover:text-red-500 font-bold text-xl p-1" onClick={() => { setIsActionModalOpen(false); setActionError(""); }}>✕</button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                {actionError && <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded text-red-700 text-sm font-semibold">{actionError}</div>}

                {actionType === "processed" && <p className="text-gray-700 leading-relaxed">Anda akan mengubah status laporan ini menjadi <strong className="text-[#08503C]">Diproses</strong>. Pastikan petugas sudah diarahkan ke lokasi.</p>}
                {actionType === "rejected" && <p className="text-gray-700 leading-relaxed">Apakah Anda yakin menolak laporan ini? (Misal: karena laporan palsu atau tumpukan sudah bersih sebelumnya).</p>}

                {actionType === "solved" && (
                  <form id="solveForm" onSubmit={executeAction} className="flex flex-col gap-4">
                    <p className="text-gray-700 text-[0.95rem] leading-relaxed">Unggah foto bukti bahwa tumpukan sampah di lokasi tersebut telah dibersihkan.</p>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Foto Bukti (Wajib)</label>
                      <input
                        type="file"
                        accept="image/*"
                        required
                        onChange={(e) => setActionFile(e.target.files ? e.target.files[0] : null)}
                        className="w-full p-3 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 cursor-pointer focus:outline-none focus:border-[#08503C] hover:bg-gray-100 transition text-sm"
                      />
                    </div>
                  </form>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
                <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md font-semibold hover:bg-gray-100 transition" onClick={() => { setIsActionModalOpen(false); setActionError(""); }} disabled={actionLoading}>Batal</button>

                {actionType === "solved" ? (
                  <button type="submit" form="solveForm" className="px-4 py-2 bg-[#08503C] text-white rounded-md font-semibold hover:bg-[#063B2C] transition disabled:opacity-70 disabled:cursor-not-allowed" disabled={actionLoading || !actionFile}>
                    {actionLoading ? "Menyimpan..." : "Simpan Selesai"}
                  </button>
                ) : (
                  <button className={`px-4 py-2 rounded-md font-semibold transition disabled:opacity-70 disabled:cursor-not-allowed ${actionType === "rejected" ? "bg-red-100 text-red-600 hover:bg-red-200" : "bg-[#08503C] text-white hover:bg-[#063B2C]"}`} onClick={executeAction} disabled={actionLoading}>
                    {actionLoading ? "Memproses..." : "Ya, Lanjutkan"}
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </>
  );
}
