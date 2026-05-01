"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// --- Tipe Data ---
interface Schedule {
  id: number;
  day: string;
  time: string;
  kelurahan_target: string;
}

type User = {
  username: string;
  role: string;
} | null;

// --- Konstanta ---
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

const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const timeSlots = [
  "07:00-08:00", "08:00-09:00", "09:00-10:00",
  "10:00-11:00", "11:00-12:00", "12:00-13:00",
  "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00"
];

export default function JadwalPage() {
  const router = useRouter();

  // State Jadwal & Filter
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(true);
  const [filterDay, setFilterDay] = useState("");
  const [filterKelurahan, setFilterKelurahan] = useState("");

  // State Profil & Unscheduled
  const [user, setUser] = useState<User>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unscheduled, setUnscheduled] = useState<string[]>([]);
  const profileRef = useRef<HTMLDivElement>(null);

  // State Modals (Tambah & Hapus)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addSlotData, setAddSlotData] = useState({ day: "", time: "" });
  const [newKelurahan, setNewKelurahan] = useState("");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  // --- Fungsi Tarik Data ---
  const fetchSchedules = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schedules/`);
      if (res.ok) {
        const data = await res.json();
        setSchedules(data);
      }
    } catch (error) {
      console.error("Gagal mengambil jadwal:", error);
    } finally {
      setIsLoadingSchedules(false);
    }
  };

  const fetchUnscheduled = async (token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schedules/unscheduled`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data: string[] = await res.json();
        setUnscheduled(data.sort((a, b) => a.localeCompare(b)));
      }
    } catch (err) {
      console.error("Gagal mengambil status jadwal", err);
    }
  };

  // --- Hooks ---
  useEffect(() => {
    fetchSchedules();
  }, []);

  useEffect(() => {
    const initAdmin = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const resUser = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (resUser.ok) {
          const userData = await resUser.json();
          setUser(userData);
          if (userData.role === "admin") {
            fetchUnscheduled(token);
          }
        } else {
          localStorage.removeItem("token");
        }
      } catch (err) {
        console.error("Gagal memuat profil", err);
      }
    };
    initAdmin();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // --- Handler Autentikasi ---
  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setProfileOpen(false);
    router.refresh();
  };

  // --- Handler Interaksi Jadwal ---
  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schedules/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          day: addSlotData.day,
          time: addSlotData.time,
          kelurahan_target: newKelurahan
        })
      });

      if (!res.ok) throw new Error("Gagal menambah jadwal. Pastikan Anda memiliki akses.");

      // Jika sukses, refresh data tabel & list unscheduled
      await fetchSchedules();
      if (token) fetchUnscheduled(token);

      // Tutup Modal
      setIsAddModalOpen(false);
      setNewKelurahan("");
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    setActionError("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schedules/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Gagal menghapus jadwal.");

      await fetchSchedules();
      if (token) fetchUnscheduled(token);
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // --- Pembantu UI ---
  const initials = user ? user.username.substring(0, 2).toUpperCase() : null;
  const visibleDays = filterDay ? [filterDay] : days;

  const getSchedulesForSlot = (day: string, time: string) => {
    return schedules.filter(sch => {
      const matchSlot = sch.day === day && sch.time === time;
      const matchKelurahan = filterKelurahan ? sch.kelurahan_target.toLowerCase() === filterKelurahan.toLowerCase() : true;
      return matchSlot && matchKelurahan;
    });
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
        .wl-nav-link:hover { color: #fff; }
        .wl-nav-login-btn { padding: 8px 20px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); border-radius: 999px; color: #fff; font-weight: 700; font-size: 0.85rem; text-decoration: none; transition: all 0.2s; }
        .wl-nav-login-btn:hover { background: #fff; color: #08503C; }
        .wl-nav-link.active { 
          color: #fff; 
          font-weight: 800; 
          position: relative; 
        }
        .wl-nav-link.active::after {
          content: '';
          position: absolute;
          bottom: -6px;
          left: 0;
          width: 100%;
          height: 2px;
          background: #5FD4AA;
          border-radius: 2px;
        }

        /* PROFIL AVATAR & DROPDOWN */
        .wl-avatar-btn { width: 36px; height: 36px; border-radius: 50%; border: 1.5px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.1); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 700; color: #fff; transition: all 0.15s; font-family: inherit; }
        .wl-avatar-btn:hover, .wl-avatar-btn.active { border-color: #5FD4AA; background: rgba(95,212,170,0.15); color: #5FD4AA; }
        .wl-dropdown { position: absolute; top: calc(100% + 12px); right: 0; width: 280px; background: #fff; border: 1px solid #E8EDEB; border-radius: 16px; box-shadow: 0 16px 40px rgba(0,0,0,0.12); overflow: hidden; animation: dropIn 0.18s cubic-bezier(.22,1,.36,1); }
        @keyframes dropIn { from { opacity: 0; transform: translateY(-8px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }

        /* HEADER & FILTER */
        .wl-page-header { padding: 3rem 2rem 1.5rem; max-width: 1200px; margin: 0 auto; width: 100%; }
        .wl-page-title { font-size: 2.25rem; font-weight: 800; color: #08503C; margin-bottom: 0.5rem; letter-spacing: -0.02em; }
        .wl-page-subtitle { color: #374553; font-size: 1.05rem; }

        .wl-filter-bar { max-width: 1200px; margin: 0 auto 2rem; width: 100%; padding: 1.5rem 2rem; background: #fff; border-radius: 16px; border: 1px solid #E8EDEB; box-shadow: 0 4px 12px rgba(0,0,0,0.02); display: flex; gap: 1.5rem; align-items: flex-end; }
        .wl-filter-group { display: flex; flex-direction: column; gap: 0.5rem; flex: 1; }
        .wl-filter-label { font-size: 0.8rem; font-weight: 700; color: #08503C; text-transform: uppercase; letter-spacing: 0.05em; }
        .wl-select { width: 100%; padding: 12px 16px; background: #FAFBFA; border: 1.5px solid #E0E7E4; border-radius: 10px; font-family: inherit; font-size: 0.95rem; color: #111; cursor: pointer; transition: border-color 0.2s; }
        .wl-select:focus { outline: none; border-color: #08503C; }

        /* TABEL MATRIX */
        .wl-table-container { max-width: 1200px; margin: 0 auto 3rem; width: 100%; background: #fff; border-radius: 16px; border: 1px solid #E8EDEB; box-shadow: 0 8px 24px rgba(0,0,0,0.04); overflow: hidden; }
        .wl-table { width: 100%; border-collapse: collapse; text-align: left; }
        .wl-table th, .wl-table td { border: 1px solid #E8EDEB; padding: 1rem; vertical-align: top; }
        .wl-table th { background: #FAFBFA; font-weight: 700; color: #08503C; font-size: 0.9rem; text-align: center; }
        .wl-time-col { width: 120px; background: #FAFBFA; font-weight: 700; color: #374553; font-size: 0.85rem; text-align: center; vertical-align: middle !important; }
        .wl-table td { min-width: 140px; height: 80px; position: relative; }
        
        /* INTERAKSI SEL ADMIN */
        .wl-cell-admin { cursor: pointer; transition: background 0.15s; }
        .wl-cell-admin:hover { background: #E6F3EE; }
        .wl-cell-admin:hover .wl-empty-cell { color: #08503C; font-weight: 700; }

        .wl-jadwal-card { display: inline-flex; align-items: center; justify-content: space-between; background: rgba(95,212,170,0.15); border: 1px solid rgba(95,212,170,0.4); color: #08503C; padding: 6px 12px; border-radius: 8px; font-size: 0.8rem; font-weight: 700; margin: 3px; box-shadow: 0 2px 4px rgba(8,80,60,0.05); transition: all 0.15s; width: calc(100% - 6px); }
        .wl-jadwal-card-admin { cursor: pointer; }
        .wl-jadwal-card-admin:hover { background: #FEE2E2; border-color: #FCA5A5; color: #B91C1C; text-decoration: line-through; }
        
        .wl-empty-cell { color: #A0ABA6; font-size: 0.8rem; text-align: center; display: flex; height: 100%; align-items: center; justify-content: center; }

        /* AREA ADMIN: KELURAHAN BELUM TERJADWAL */
        .wl-admin-section { max-width: 1200px; margin: 0 auto 4rem; width: 100%; background: #FFF4F4; border: 1px solid #FCA5A5; border-radius: 16px; padding: 2rem; box-shadow: 0 8px 24px rgba(239, 68, 68, 0.05); }
        .wl-admin-title { font-size: 1.25rem; font-weight: 800; color: #B91C1C; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 8px; }
        .wl-admin-desc { font-size: 0.9rem; color: #991B1B; margin-bottom: 1.5rem; }
        .wl-unscheduled-grid { display: flex; flex-wrap: wrap; gap: 10px; }
        .wl-unscheduled-chip { background: #FEF2F2; border: 1px solid #FECACA; color: #991B1B; font-weight: 600; font-size: 0.85rem; padding: 6px 14px; border-radius: 999px; }

        /* MODAL */
        .wl-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 999; display: flex; align-items: center; justify-content: center; }
        .wl-modal-content { background: #fff; width: 90%; max-width: 420px; border-radius: 20px; padding: 2rem; box-shadow: 0 24px 48px rgba(0,0,0,0.2); animation: dropIn 0.2s ease-out; }
        .wl-modal-title { font-size: 1.35rem; font-weight: 800; color: #08503C; margin-bottom: 1.5rem; }
        .wl-modal-actions { display: flex; gap: 1rem; margin-top: 2rem; }
        .wl-btn { flex: 1; padding: 12px; border-radius: 10px; font-weight: 700; font-size: 0.95rem; cursor: pointer; border: none; transition: opacity 0.15s; font-family: inherit; }
        .wl-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .wl-btn-cancel { background: #F4F6F5; color: #374553; }
        .wl-btn-cancel:hover { background: #E8EDEB; }
        .wl-btn-submit { background: #08503C; color: #fff; }
        .wl-btn-submit:hover { background: #063B2C; }
        .wl-btn-danger { background: #DC2626; color: #fff; }
        .wl-btn-danger:hover { background: #B91C1C; }
      `}</style>

      <div className="wl-root">

        {/* NAVBAR */}
        <nav className="wl-nav">
          <div style={{ display: "flex", alignItems: "center", gap: "2.5rem" }}>
            <Link href="/" className="wl-brand">Wall-awe</Link>
            <div style={{ display: "flex", gap: "1.75rem" }}>
              <Link href="/form" className="wl-nav-link">Buat Laporan</Link>
              <Link href="/complaints" className="wl-nav-link">Pantau Laporan</Link>
              <Link href="/jadwal" className="wl-nav-link active">Jadwal Keliling</Link>
            </div>
          </div>

          <div ref={profileRef} style={{ position: "relative" }}>
            {user ? (
              <>
                <button className={`wl-avatar-btn${profileOpen ? " active" : ""}`} onClick={() => setProfileOpen(p => !p)}>
                  {initials}
                </button>
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

                        {/* --- KODE BARU: LIST KELURAHAN --- */}
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

        {/* HEADER & FILTER */}
        <header className="wl-page-header">
          <h1 className="wl-page-title">Jadwal Truk Keliling</h1>
          <p className="wl-page-subtitle">Pantau jadwal pengambilan sampah. {user?.role === "admin" && <strong>Klik area kosong pada tabel untuk menambah jadwal.</strong>}</p>
        </header>

        <div className="wl-filter-bar">
          <div className="wl-filter-group">
            <label className="wl-filter-label">Pilih Hari</label>
            <select className="wl-select" value={filterDay} onChange={(e) => setFilterDay(e.target.value)}>
              <option value="">Semua Hari</option>
              {days.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="wl-filter-group">
            <label className="wl-filter-label">Pilih Kelurahan</label>
            <select className="wl-select" value={filterKelurahan} onChange={(e) => setFilterKelurahan(e.target.value)}>
              <option value="">Semua Kelurahan</option>
              {list_kelurahan.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
        </div>

        {/* TABEL MATRIX */}
        <div className="wl-table-container">
          {isLoadingSchedules ? (
            <div style={{ padding: "4rem", textAlign: "center", color: "#08503C", fontWeight: 700 }}>Memuat data jadwal...</div>
          ) : (
            <table className="wl-table">
              <thead>
                <tr>
                  <th style={{ width: "120px" }}>Jam Operasional</th>
                  {visibleDays.map(day => <th key={day}>{day}</th>)}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map(time => (
                  <tr key={time}>
                    <td className="wl-time-col">{time}</td>
                    {visibleDays.map(day => {
                      const matchedSchedules = getSchedulesForSlot(day, time);
                      return (
                        <td
                          key={`${day}-${time}`}
                          className={user?.role === "admin" ? "wl-cell-admin" : ""}
                          onClick={() => {
                            // Cek jika dia admin, buka modal tambah
                            if (user?.role === "admin") {
                              setAddSlotData({ day, time });
                              setIsAddModalOpen(true);
                            }
                          }}
                        >
                          {matchedSchedules.length > 0 ? (
                            matchedSchedules.map(sch => (
                              <div
                                key={sch.id}
                                className={`wl-jadwal-card ${user?.role === "admin" ? "wl-jadwal-card-admin" : ""}`}
                                onClick={(e) => {
                                  // Hentikan klik agar tidak memicu onClick sel tabel di belakangnya!
                                  e.stopPropagation();
                                  if (user?.role === "admin") {
                                    setDeleteTarget(sch);
                                    setIsDeleteModalOpen(true);
                                  }
                                }}
                                title={user?.role === "admin" ? "Klik untuk menghapus" : ""}
                              >
                                {sch.kelurahan_target}
                              </div>
                            ))
                          ) : (
                            <div className="wl-empty-cell">{user?.role === "admin" ? "+ Tambah" : "-"}</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* AREA ADMIN: KELURAHAN BELUM TERJADWAL */}
        {user?.role === "admin" && (
          <div className="wl-admin-section">
            <h2 className="wl-admin-title">Perhatian Admin</h2>
            <p className="wl-admin-desc">Daftar kelurahan di bawah ini belum dimasukkan ke dalam jadwal operasional.</p>
            {unscheduled.length > 0 ? (
              <div className="wl-unscheduled-grid">
                {unscheduled.map(kel => <span key={kel} className="wl-unscheduled-chip">{kel}</span>)}
              </div>
            ) : (
              <div style={{ color: "#059669", fontWeight: 600 }}>Semua kelurahan telah memiliki jadwal operasional!</div>
            )}
          </div>
        )}

        {/* ======================= */}
        {/* MODAL TAMBAH JADWAL */}
        {/* ======================= */}
        {isAddModalOpen && (
          <div className="wl-modal-overlay">
            <div className="wl-modal-content">
              <h3 className="wl-modal-title">Tambah Jadwal Baru</h3>

              <div style={{ marginBottom: "1rem", fontSize: "0.9rem", color: "#374553" }}>
                <strong>Hari:</strong> {addSlotData.day} <br />
                <strong>Jam:</strong> {addSlotData.time}
              </div>

              {actionError && <div style={{ marginBottom: "1rem", color: "#DC2626", fontSize: "0.85rem", fontWeight: 600 }}>{actionError}</div>}

              <form onSubmit={handleAddSchedule}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: 700, color: "#08503C" }}>Pilih Kelurahan Target</label>
                <select
                  className="wl-select"
                  required
                  value={newKelurahan}
                  onChange={(e) => setNewKelurahan(e.target.value)}
                >
                  <option value="" disabled>-- Pilih Kelurahan --</option>
                  {list_kelurahan.map(k => <option key={k} value={k}>{k}</option>)}
                </select>

                <div className="wl-modal-actions">
                  <button type="button" className="wl-btn wl-btn-cancel" onClick={() => setIsAddModalOpen(false)}>Batal</button>
                  <button type="submit" className="wl-btn wl-btn-submit" disabled={actionLoading || !newKelurahan}>
                    {actionLoading ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================= */}
        {/* MODAL HAPUS JADWAL */}
        {/* ======================= */}
        {isDeleteModalOpen && deleteTarget && (
          <div className="wl-modal-overlay">
            <div className="wl-modal-content">
              <h3 className="wl-modal-title" style={{ color: "#DC2626" }}>Hapus Jadwal?</h3>

              <p style={{ fontSize: "0.95rem", color: "#374553", lineHeight: 1.5 }}>
                Apakah Anda yakin ingin menghapus jadwal truk keliling untuk kelurahan <strong>{deleteTarget.kelurahan_target}</strong> pada hari <strong>{deleteTarget.day}</strong> pukul <strong>{deleteTarget.time}</strong>?
              </p>

              {actionError && <div style={{ marginTop: "1rem", color: "#DC2626", fontSize: "0.85rem", fontWeight: 600 }}>{actionError}</div>}

              <div className="wl-modal-actions">
                <button type="button" className="wl-btn wl-btn-cancel" onClick={() => setIsDeleteModalOpen(false)}>Batal</button>
                <button type="button" className="wl-btn wl-btn-danger" onClick={handleDeleteSchedule} disabled={actionLoading}>
                  {actionLoading ? "Menghapus..." : "Ya, Hapus"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
