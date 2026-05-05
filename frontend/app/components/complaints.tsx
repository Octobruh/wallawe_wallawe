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

  // Eksklusif Admin
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

  // State Data & Profil
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // State Filter
  const [filterKelurahan, setFilterKelurahan] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // State Modal Detail Utama
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Tipe Aksi disamakan menjadi huruf kecil semua sesuai Enum Backend
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<"processed" | "rejected" | "solved" | "">("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFile, setActionFile] = useState<File | null>(null);
  const [actionError, setActionError] = useState("");

  // --- Ambil Data Laporan ---
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

  // --- Eksekusi Aksi ---
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

  const initials = user ? user.username.substring(0, 2).toUpperCase() : null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <span className="wl-badge wl-badge-pending">Pending</span>;
      case "processed": return <span className="wl-badge wl-badge-process">Diproses</span>;
      case "solved": return <span className="wl-badge wl-badge-solved">Selesai</span>;
      case "rejected": return <span className="wl-badge wl-badge-reject">Ditolak</span>;
      default: return <span className="wl-badge">{status}</span>;
    }
  };

  const getPriorityBadge = (score?: string) => {
    if (!score || score === "Unknown") return <span style={{ color: "#6B7280", fontWeight: 600 }}>-</span>;
    if (score === "Tinggi") return <span style={{ color: "#DC2626", fontWeight: 800 }}>Tinggi</span>;
    if (score === "Sedang") return <span style={{ color: "#D97706", fontWeight: 700 }}>Sedang</span>;
    return <span style={{ color: "#059669", fontWeight: 600 }}>Rendah</span>;
  };

  const isKelurahanAuthorized = (kelurahanTarget: string) => {
    if (user?.role !== "kelurahan") return false;
    if (!user.accessible_kelurahans) return false;

    return user.accessible_kelurahans.some((k) => k.kelurahan_name === kelurahanTarget);
  };

  return (
    <>


      <div className="min-h-screen bg-[#F4F6F5] flex flex-col text-gray-900 px-4 py-6">
        <BlurFade inView>

        {/* HEADER */}
          <div className="max-w-6xl mx-auto w-full">
            <header className="w-full pt-6 pb-6">
              <h1 className="text-3xl font-extrabold text-[#08503C] mb-2">Pantau Laporan Sampah</h1>
              <p className="text-gray-600">Lihat progres penanganan sampah di Kota Yogyakarta secara transparan.</p>
            </header>

            {/* FILTER BAR */}
            <div className="mb-8 py-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="px-6 flex gap-6 items-end flex-wrap">
                <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
                  <label className="text-xs font-bold text-[#08503C] uppercase tracking-wide">Filter Kelurahan</label>
                  <select className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#08503C] focus:ring-2 focus:ring-[#08503C]/20" value={filterKelurahan} onChange={(e) => setFilterKelurahan(e.target.value)}>
                    <option value="">Semua Kelurahan</option>
                    {list_kelurahan.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
                  <label className="text-xs font-bold text-[#08503C] uppercase tracking-wide">Filter Status</label>
                  <select className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#08503C] focus:ring-2 focus:ring-[#08503C]/20" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="">Semua Status</option>
                    <option value="pending">Pending</option>
                    <option value="processed">Diproses</option>
                    <option value="solved">Selesai</option>
                    <option value="rejected">Ditolak</option>
                  </select>
                </div>
              </div>
            </div>

            {/* TABEL DATA */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">
              {isLoading ? (
                <div style={{ padding: "4rem", textAlign: "center", color: "#08503C", fontWeight: 700 }}>Memuat daftar laporan...</div>
              ) : complaints.length === 0 ? (
                <div style={{ padding: "4rem", textAlign: "center", color: "#8A9490" }}>Tidak ada laporan yang ditemukan dengan filter saat ini.</div>
              ) : (
            <div style={{ overflowX: "auto" }}>
                  <table className="w-full border-collapse text-left">
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
                  {complaints.map((c) => (
                    <tr key={c.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <span className="wl-row-title">{new Date(c.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span className="wl-row-desc">{new Date(c.created_at).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })} WIB</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="wl-row-title">{c.jalan}</span>
                        <span className="wl-row-desc">{c.kelurahan} (RT {c.rt}/RW {c.rw})</span>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(c.status)}</td>
                      {user?.role === "admin" && <td className="px-6 py-4">{getPriorityBadge(c.priority_score)}</td>}
                      {user?.role === "admin" && <td className="px-6 py-4"><span style={{ fontSize: "0.85rem", fontWeight: 600, background: "#F4F6F5", padding: "4px 8px", borderRadius: 6 }}>{c.category || "-"}</span></td>}
                      <td className="px-6 py-4 text-right">
                        <button
                          className="px-4 py-2 bg-[#08503C] text-white rounded-md text-sm font-semibold hover:bg-[#063B2C] transition"
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
          )}
        </div>
          </div>

        {/* MODAL 1: DETAIL LAPORAN */}
        {isDetailModalOpen && selectedComplaint && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) setIsDetailModalOpen(false) }}>
              <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">

                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 flex-shrink-0">
                  <h2 className="font-bold text-gray-900">Detail Laporan #{selectedComplaint.id}</h2>
                <button className="wl-modal-close" onClick={() => setIsDetailModalOpen(false)}>×</button>
              </div>

                <div className="p-6 flex flex-col gap-6 overflow-y-auto flex-1">
                <div className="wl-detail-grid">
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div className="wl-image-box">
                      <div className="wl-image-label">Foto Saat Dilaporkan</div>
                      <img src={`${process.env.NEXT_PUBLIC_API_URL}${selectedComplaint.photo_url}`} alt="Bukti Pelapor" />
                    </div>

                    {selectedComplaint.status === "solved" && selectedComplaint.admin_photo_url && (
                      <div className="wl-image-box" style={{ borderColor: "#A7F3D0" }}>
                        <div className="wl-image-label" style={{ background: "#059669" }}>Foto Penyelesaian</div>
                        <img src={`${process.env.NEXT_PUBLIC_API_URL}${selectedComplaint.admin_photo_url}`} alt="Bukti Selesai" />
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ display: "flex", gap: "10px", marginBottom: "1.5rem" }}>
                      {getStatusBadge(selectedComplaint.status)}
                      {user?.role === "admin" && (
                        <span className="wl-badge" style={{ background: "#F3F4F6", border: "1px solid #D1D5DB", color: "#374151" }}>
                          Kategori: {selectedComplaint.category}
                        </span>
                      )}
                    </div>

                    <div className="wl-info-block">
                      <div className="wl-info-label">Lokasi Lengkap</div>
                      <div className="wl-info-value">
                          <strong>{selectedComplaint.jalan}</strong>, Kelurahan {selectedComplaint.kelurahan}, RT {selectedComplaint.rt}/RW {selectedComplaint.rw}<br />
                        <span style={{ color: "#8A9490", fontSize: "0.9rem", marginTop: 4, display: "inline-block" }}>
                          Patokan: {selectedComplaint.description_location}
                        </span>
                      </div>
                    </div>

                    <div className="wl-info-block">
                      <div className="wl-info-label">Deskripsi Laporan</div>
                      <div className="wl-info-value" style={{ background: "#FAFBFA", padding: "12px", borderRadius: "8px", border: "1px solid #E0E7E4" }}>
                        {selectedComplaint.complaint_text}
                      </div>
                    </div>

                    <div className="wl-info-block">
                      <div className="wl-info-label">Waktu Masuk</div>
                      <div className="wl-info-value">{new Date(selectedComplaint.created_at).toLocaleString("id-ID")}</div>
                    </div>

                    {selectedComplaint.solved_at && (
                      <div className="wl-info-block">
                        <div className="wl-info-label" style={{ color: "#059669" }}>Waktu Diselesaikan</div>
                        <div className="wl-info-value">{new Date(selectedComplaint.solved_at).toLocaleString("id-ID")}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
                {user?.role === "kelurahan" && selectedComplaint.status === "pending" && isKelurahanAuthorized(selectedComplaint.kelurahan) && (
                  <>
                    <button className="px-4 py-2 bg-red-100 text-red-600 rounded-md font-semibold hover:bg-red-200" onClick={() => { setActionType("rejected"); setIsActionModalOpen(true); }}>
                      Tolak Laporan
                    </button>
                    <button className="px-4 py-2 bg-[#08503C] text-white rounded-md font-semibold hover:bg-[#063B2C]" onClick={() => { setActionType("processed"); setIsActionModalOpen(true); }}>
                      Proses Penanganan
                    </button>
                  </>
                )}

                {/* --- PERBAIKAN: Admin bisa menyelesaikan laporan jika statusnya belum solved --- */}
                {user?.role === "admin" && selectedComplaint.status !== "solved" && (
                  <button className="px-4 py-2 bg-[#08503C] text-white rounded-md font-semibold hover:bg-[#063B2C]" onClick={() => { setActionType("solved"); setIsActionModalOpen(true); }}>
                    Tandai Selesai & Unggah Bukti
                  </button>
                )}

                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md font-semibold hover:bg-gray-200" onClick={() => setIsDetailModalOpen(false)}>Tutup</button>
              </div>

            </div>
          </div>
        )}

        {/* MODAL 2: KONFIRMASI AKSI */}
        {isActionModalOpen && selectedComplaint && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" style={{ zIndex: 1000 }}>
              <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 flex-shrink-0">
                  <h2 className="font-bold text-gray-900">
                  {actionType === "processed" ? "Konfirmasi Proses" :
                    actionType === "rejected" ? "Konfirmasi Penolakan" :
                      "Penyelesaian Laporan"}
                </h2>
                  <button className="wl-modal-close" onClick={() => { setIsActionModalOpen(false); setActionError(""); }}>×</button>
              </div>

                <div className="p-6 flex flex-col gap-6 overflow-y-auto flex-1">
                {actionError && <div style={{ color: "#DC2626", fontSize: "0.85rem", fontWeight: 700, marginBottom: "1rem" }}>{actionError}</div>}

                {actionType === "processed" && <p>Anda akan mengubah status laporan ini menjadi <strong>Diproses</strong>. Pastikan petugas sudah diarahkan ke lokasi.</p>}
                {actionType === "rejected" && <p>Apakah Anda yakin menolak laporan ini? (Misal: karena laporan palsu atau sudah bersih).</p>}

                {actionType === "solved" && (
                  <form id="solveForm" onSubmit={executeAction} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <p style={{ fontSize: "0.95rem" }}>Unggah foto bukti bahwa tumpukan sampah telah dibersihkan.</p>
                    <div>
                      <label style={{ fontSize: "0.85rem", fontWeight: 700, display: "block", marginBottom: 8 }}>Foto Bukti (Wajib)</label>
                      <input
                        type="file"
                        accept="image/*"
                        required
                        onChange={(e) => setActionFile(e.target.files ? e.target.files[0] : null)}
                        style={{ width: "100%", padding: "10px", border: "2px dashed #C5D1CD", borderRadius: "8px", background: "#FAFBFA", cursor: "pointer" }}
                      />
                    </div>
                  </form>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md font-semibold hover:bg-gray-200" onClick={() => { setIsActionModalOpen(false); setActionError(""); }} disabled={actionLoading}>Batal</button>

                {actionType === "solved" ? (
                  <button type="submit" form="solveForm" className="px-4 py-2 bg-[#08503C] text-white rounded-md font-semibold hover:bg-[#063B2C]" disabled={actionLoading || !actionFile}>
                    {actionLoading ? "Menyimpan..." : "Simpan Selesai"}
                  </button>
                ) : (
                    <button className={`px-4 py-2 ${actionType === "rejected" ? "bg-red-100 text-red-600 rounded-md font-semibold hover:bg-red-200" : "bg-[#08503C] text-white rounded-md font-semibold hover:bg-[#063B2C]"}`} onClick={executeAction} disabled={actionLoading}>
                    {actionLoading ? "Memproses..." : "Ya, Lanjutkan"}
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

        </BlurFade>
      </div>
    </>
  );
}
