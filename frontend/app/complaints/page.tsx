"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .wl-root { font-family: 'Plus Jakarta Sans', sans-serif; background: #F4F6F5; min-height: 100vh; color: #111; display: flex; flex-direction: column; }

        /* NAVBAR */
        .wl-nav { position: sticky; top: 0; z-index: 100; height: 64px; display: flex; align-items: center; justify-content: space-between; padding: 0 2rem; background: rgba(8,80,60,0.97); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255,255,255,0.10); }
        .wl-brand { font-size: 1.35rem; font-weight: 800; color: #fff; letter-spacing: 0.12em; text-decoration: none; }
        .wl-nav-link { font-size: 0.84rem; font-weight: 600; color: rgba(255,255,255,0.75); text-decoration: none; transition: color 0.15s; }
        .wl-nav-link:hover, .wl-nav-link.active { color: #fff; }
        .wl-nav-login-btn { padding: 8px 20px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); border-radius: 999px; color: #fff; font-weight: 700; font-size: 0.85rem; text-decoration: none; transition: all 0.2s; }
        .wl-nav-login-btn:hover { background: #fff; color: #08503C; }
        .wl-nav-link.active { color: #fff; font-weight: 800; position: relative; }
        .wl-nav-link.active::after { content: ''; position: absolute; bottom: -6px; left: 0; width: 100%; height: 2px; background: #5FD4AA; border-radius: 2px; }

        /* PROFIL AVATAR */
        .wl-avatar-btn { width: 36px; height: 36px; border-radius: 50%; border: 1.5px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.1); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 700; color: #fff; transition: all 0.15s; }
        .wl-avatar-btn:hover, .wl-avatar-btn.active { border-color: #5FD4AA; background: rgba(95,212,170,0.15); color: #5FD4AA; }
        .wl-dropdown { position: absolute; top: calc(100% + 12px); right: 0; width: 280px; background: #fff; border: 1px solid #E8EDEB; border-radius: 16px; box-shadow: 0 16px 40px rgba(0,0,0,0.12); overflow: hidden; animation: dropIn 0.18s cubic-bezier(.22,1,.36,1); }
        @keyframes dropIn { from { opacity: 0; transform: translateY(-8px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }

        /* HEADER & FILTER */
        .wl-page-header { padding: 3rem 2rem 1.5rem; max-width: 1200px; margin: 0 auto; width: 100%; }
        .wl-page-title { font-size: 2.25rem; font-weight: 800; color: #08503C; margin-bottom: 0.5rem; letter-spacing: -0.02em; }
        .wl-page-subtitle { color: #374553; font-size: 1.05rem; }

        .wl-filter-bar { max-width: 1200px; margin: 0 auto 2rem; width: 100%; padding: 1.5rem 2rem; background: #fff; border-radius: 16px; border: 1px solid #E8EDEB; box-shadow: 0 4px 12px rgba(0,0,0,0.02); display: flex; gap: 1.5rem; align-items: flex-end; flex-wrap: wrap; }
        .wl-filter-group { display: flex; flex-direction: column; gap: 0.5rem; flex: 1; min-width: 200px; }
        .wl-filter-label { font-size: 0.8rem; font-weight: 700; color: #08503C; text-transform: uppercase; letter-spacing: 0.05em; }
        .wl-select { width: 100%; padding: 12px 16px; background: #FAFBFA; border: 1.5px solid #E0E7E4; border-radius: 10px; font-family: inherit; font-size: 0.95rem; color: #111; cursor: pointer; transition: border-color 0.2s; }
        .wl-select:focus { outline: none; border-color: #08503C; }

        /* TABEL DATA LENGKAP */
        .wl-table-container { max-width: 1200px; margin: 0 auto 4rem; width: 100%; background: #fff; border-radius: 16px; border: 1px solid #E8EDEB; box-shadow: 0 8px 24px rgba(0,0,0,0.04); overflow: hidden; }
        .wl-table { width: 100%; border-collapse: collapse; text-align: left; }
        .wl-table th, .wl-table td { border-bottom: 1px solid #E8EDEB; padding: 1rem 1.5rem; vertical-align: middle; }
        .wl-table th { background: #FAFBFA; font-weight: 700; color: #08503C; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .wl-table td { font-size: 0.95rem; color: #374553; }
        .wl-table tr:hover td { background: #FAFBFA; }
        
        .wl-row-title { font-weight: 700; color: #111; margin-bottom: 4px; display: block; }
        .wl-row-desc { font-size: 0.85rem; color: #8A9490; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 250px; display: block; }

        /* BADGES */
        .wl-badge { display: inline-flex; padding: 4px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
        .wl-badge-pending { background: #FFFBEB; color: #D97706; border: 1px solid #FCD34D; }
        .wl-badge-process { background: #EFF6FF; color: #2563EB; border: 1px solid #BFDBFE; }
        .wl-badge-solved { background: #ECFDF5; color: #059669; border: 1px solid #A7F3D0; }
        .wl-badge-reject { background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA; }

        /* TOMBOL AKSI */
        .wl-btn-detail { padding: 8px 16px; background: #08503C; color: #fff; border-radius: 8px; font-size: 0.85rem; font-weight: 700; cursor: pointer; border: none; transition: all 0.2s; white-space: nowrap; }
        .wl-btn-detail:hover { background: #063B2C; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(8,80,60,0.2); }

        /* MODAL KHUSUS */
        .wl-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); z-index: 999; display: flex; align-items: center; justify-content: center; padding: 2rem; }
        .wl-modal-content { background: #fff; width: 100%; max-width: 800px; max-height: 90vh; border-radius: 24px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 24px 48px rgba(0,0,0,0.3); animation: dropIn 0.2s ease-out; }
        .wl-modal-content.small { max-width: 450px; }
        
        .wl-modal-header { padding: 1.5rem 2rem; border-bottom: 1px solid #E8EDEB; display: flex; justify-content: space-between; align-items: center; background: #FAFBFA; }
        .wl-modal-header h2 { font-size: 1.25rem; font-weight: 800; color: #08503C; }
        .wl-modal-close { background: none; border: none; font-size: 1.5rem; color: #A0ABA6; cursor: pointer; transition: color 0.2s; }
        .wl-modal-close:hover { color: #DC2626; }
        
        .wl-modal-body { padding: 2rem; overflow-y: auto; display: flex; flex-direction: column; gap: 2rem; }
        .wl-modal-footer { padding: 1.5rem 2rem; border-top: 1px solid #E8EDEB; background: #FAFBFA; display: flex; justify-content: flex-end; gap: 1rem; }

        .wl-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
        @media (max-width: 768px) { .wl-detail-grid { grid-template-columns: 1fr; } }
        
        .wl-image-box { border-radius: 12px; overflow: hidden; border: 1px solid #E0E7E4; background: #FAFBFA; }
        .wl-image-box img { width: 100%; height: 250px; object-fit: cover; display: block; }
        .wl-image-label { padding: 8px; text-align: center; font-size: 0.8rem; font-weight: 700; background: #08503C; color: #fff; text-transform: uppercase; letter-spacing: 0.05em; }

        .wl-info-block { margin-bottom: 1.25rem; }
        .wl-info-label { font-size: 0.75rem; font-weight: 700; color: #8A9490; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
        .wl-info-value { font-size: 1rem; color: #111; font-weight: 500; line-height: 1.5; }

        .wl-btn { padding: 12px 24px; border-radius: 10px; font-weight: 700; font-size: 0.95rem; cursor: pointer; border: none; transition: opacity 0.15s; font-family: inherit; }
        .wl-btn-secondary { background: #E6F3EE; color: #08503C; }
        .wl-btn-primary { background: #08503C; color: #fff; }
        .wl-btn-danger { background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA; }
        .wl-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      <div className="wl-root">
        {/* NAVBAR */}
        <nav className="wl-nav">
          <div style={{ display: "flex", alignItems: "center", gap: "2.5rem" }}>
            <Link href="/" className="wl-brand">Wall-awe</Link>
            <div style={{ display: "flex", gap: "1.75rem" }}>
              <Link href="/form" className="wl-nav-link">Buat Laporan</Link>
              <Link href="/complaints" className="wl-nav-link active">Pantau Laporan</Link>
              <Link href="/jadwal" className="wl-nav-link">Jadwal Keliling</Link>
            </div>
          </div>

          <div ref={profileRef} style={{ position: "relative" }}>
            {user ? (
              <>
                <button className={`wl-avatar-btn${profileOpen ? " active" : ""}`} onClick={() => setProfileOpen(p => !p)}>{initials}</button>
                {profileOpen && (
                  <div className="wl-dropdown">

                    {/* --- BAGIAN HEADER PROFIL --- */}
                    <div style={{ padding: "1.25rem", borderBottom: "1px solid #E8EDEB", display: "flex", gap: 12, alignItems: "flex-start" }}>

                      <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#08503C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.95rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                        {initials}
                      </div>

                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#111", textTransform: "capitalize" }}>{user.username}</div>
                        <div style={{ fontSize: "0.75rem", color: "#8A9490", marginTop: 2, textTransform: "capitalize" }}>{user.role}</div>

                        {/* --- LIST KELURAHAN --- */}
                        {user.role !== "admin" && user.accessible_kelurahans && user.accessible_kelurahans.length > 0 && (
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
                        {/* ------------------------------- */}

                      </div>
                    </div>

                    {/* --- BAGIAN MENU BAWAH --- */}
                    <div style={{ padding: "0.75rem" }}>
                      <Link href="/dashboard" style={{ display: "block", padding: "10px 12px", borderRadius: 8, fontSize: "0.85rem", fontWeight: 600, color: "#374553", textDecoration: "none" }}>Masuk Dashboard</Link>
                      <button onClick={handleLogout} style={{ width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 8, fontSize: "0.85rem", fontWeight: 600, color: "#EF4444", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", marginTop: 4 }}>Keluar</button>
                    </div>

                  </div>
                )}
              </>
            ) : (
              <Link href="/login" className="wl-nav-login-btn">Masuk</Link>
            )}
          </div>
        </nav>

        {/* HEADER */}
        <header className="wl-page-header">
          <h1 className="wl-page-title">Pantau Laporan Sampah</h1>
          <p className="wl-page-subtitle">Lihat progres penanganan sampah di Kota Yogyakarta secara transparan.</p>
        </header>

        {/* FILTER BAR */}
        <div className="wl-filter-bar">
          <div className="wl-filter-group">
            <label className="wl-filter-label">Filter Kelurahan</label>
            <select className="wl-select" value={filterKelurahan} onChange={(e) => setFilterKelurahan(e.target.value)}>
              <option value="">Semua Kelurahan</option>
              {list_kelurahan.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <div className="wl-filter-group">
            <label className="wl-filter-label">Filter Status</label>
            <select className="wl-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="processed">Diproses</option>
              <option value="solved">Selesai</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>
        </div>

        {/* TABEL DATA */}
        <div className="wl-table-container">
          {isLoading ? (
            <div style={{ padding: "4rem", textAlign: "center", color: "#08503C", fontWeight: 700 }}>Memuat daftar laporan...</div>
          ) : complaints.length === 0 ? (
            <div style={{ padding: "4rem", textAlign: "center", color: "#8A9490" }}>Tidak ada laporan yang ditemukan dengan filter saat ini.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="wl-table">
                <thead>
                  <tr>
                    <th>Waktu Laporan</th>
                    <th>Lokasi Utama</th>
                    <th>Status</th>
                    {user?.role === "admin" && <th>Prioritas</th>}
                    {user?.role === "admin" && <th>Kategori AI</th>}
                    <th style={{ textAlign: "right" }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <span className="wl-row-title">{new Date(c.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span className="wl-row-desc">{new Date(c.created_at).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })} WIB</span>
                      </td>
                      <td>
                        <span className="wl-row-title">{c.kelurahan}</span>
                        <span className="wl-row-desc">{c.jalan} (RT {c.rt}/RW {c.rw})</span>
                      </td>
                      <td>{getStatusBadge(c.status)}</td>
                      {user?.role === "admin" && <td>{getPriorityBadge(c.priority_score)}</td>}
                      {user?.role === "admin" && <td><span style={{ fontSize: "0.85rem", fontWeight: 600, background: "#F4F6F5", padding: "4px 8px", borderRadius: 6 }}>{c.category || "-"}</span></td>}
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="wl-btn-detail"
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

        {/* MODAL 1: DETAIL LAPORAN */}
        {isDetailModalOpen && selectedComplaint && (
          <div className="wl-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsDetailModalOpen(false) }}>
            <div className="wl-modal-content">

              <div className="wl-modal-header">
                <h2>Detail Laporan #{selectedComplaint.id}</h2>
                <button className="wl-modal-close" onClick={() => setIsDetailModalOpen(false)}>×</button>
              </div>

              <div className="wl-modal-body">
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
                        {selectedComplaint.jalan}, RT {selectedComplaint.rt}/RW {selectedComplaint.rw}, Kel. {selectedComplaint.kelurahan}<br />
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

              <div className="wl-modal-footer">
                {user?.role === "kelurahan" && selectedComplaint.status === "pending" && isKelurahanAuthorized(selectedComplaint.kelurahan) && (
                  <>
                    <button className="wl-btn wl-btn-danger" onClick={() => { setActionType("rejected"); setIsActionModalOpen(true); }}>
                      Tolak Laporan
                    </button>
                    <button className="wl-btn wl-btn-primary" onClick={() => { setActionType("processed"); setIsActionModalOpen(true); }}>
                      Proses Penanganan
                    </button>
                  </>
                )}

                {/* --- PERBAIKAN: Admin bisa menyelesaikan laporan jika statusnya belum solved --- */}
                {user?.role === "admin" && selectedComplaint.status !== "solved" && (
                  <button className="wl-btn wl-btn-primary" onClick={() => { setActionType("solved"); setIsActionModalOpen(true); }}>
                    Tandai Selesai & Unggah Bukti
                  </button>
                )}

                <button className="wl-btn wl-btn-secondary" onClick={() => setIsDetailModalOpen(false)}>Tutup</button>
              </div>

            </div>
          </div>
        )}

        {/* MODAL 2: KONFIRMASI AKSI */}
        {isActionModalOpen && selectedComplaint && (
          <div className="wl-modal-overlay" style={{ zIndex: 1000 }}>
            <div className="wl-modal-content small">
              <div className="wl-modal-header">
                <h2>
                  {actionType === "processed" ? "Konfirmasi Proses" :
                    actionType === "rejected" ? "Konfirmasi Penolakan" :
                      "Penyelesaian Laporan"}
                </h2>
              </div>

              <div className="wl-modal-body" style={{ padding: "1.5rem 2rem" }}>
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

              <div className="wl-modal-footer">
                <button className="wl-btn wl-btn-secondary" onClick={() => { setIsActionModalOpen(false); setActionError(""); }} disabled={actionLoading}>Batal</button>

                {actionType === "solved" ? (
                  <button type="submit" form="solveForm" className="wl-btn wl-btn-primary" disabled={actionLoading || !actionFile}>
                    {actionLoading ? "Menyimpan..." : "Simpan Selesai"}
                  </button>
                ) : (
                  <button className={`wl-btn ${actionType === "rejected" ? "wl-btn-danger" : "wl-btn-primary"}`} onClick={executeAction} disabled={actionLoading}>
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
