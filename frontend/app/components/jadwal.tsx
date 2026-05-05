"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BlurFade } from "@/components/ui/blur-fade";

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
  accessible_kelurahans?: {
    kelurahan_name: string;
  }[];
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
      <div className="min-h-screen bg-[#F4F6F5] flex flex-col text-gray-900 px-4 py-6">
        <BlurFade inView>

        {/* HEADER & FILTER */}
          <div className="max-w-6xl mx-auto w-full">
            <header className="w-full pt-6 pb-6">
              <h1 className="text-3xl font-extrabold text-[#08503C] mb-2">Jadwal Truk Keliling</h1>
              <p className="text-gray-600">Pantau jadwal pengambilan sampah. {user?.role === "admin" && <strong>Klik area kosong pada tabel untuk menambah jadwal.</strong>}</p>
            </header>

            <div className="mb-8 py-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="px-6 flex gap-6 items-end flex-wrap">
                <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
                  <label className="text-xs font-bold text-[#08503C] uppercase tracking-wide">Pilih Hari</label>
                  <select className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#08503C] focus:ring-2 focus:ring-[#08503C]/20" value={filterDay} onChange={(e) => setFilterDay(e.target.value)}>
                    <option value="">Semua Hari</option>
                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
                  <label className="text-xs font-bold text-[#08503C] uppercase tracking-wide">Pilih Kelurahan</label>
                  <select className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#08503C] focus:ring-2 focus:ring-[#08503C]/20" value={filterKelurahan} onChange={(e) => setFilterKelurahan(e.target.value)}>
                    <option value="">Semua Kelurahan</option>
                    {list_kelurahan.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* TABEL MATRIX */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-x-auto mb-10">
          {isLoadingSchedules ? (
            <div className="p-16 text-center text-[#08503C] font-bold">Memuat data jadwal...</div>
          ) : (
              <table className="w-full border-collapse text-left">
              <thead>
                <tr>
                        <th className="w-[120px] bg-gray-50 text-[#08503C] font-bold text-sm text-center border-b border-r border-gray-200 p-3">Jam Operasional</th>
                        {visibleDays.map(day => <th key={day} className="bg-gray-50 text-[#08503C] font-bold text-sm text-center border-b border-r border-gray-200 p-3">{day}</th>)}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map(time => (
                  <tr key={time}>
                    <td className="w-[120px] bg-gray-50 text-gray-700 text-sm font-bold text-center align-middle border-b border-r border-gray-200">
                      <div className="h-[100px] flex items-center justify-center">
                        {time}
                      </div>
                    </td>
                    {visibleDays.map(day => {
                      const matchedSchedules = getSchedulesForSlot(day, time);
                      return (
                        <td
                          key={`${day}-${time}`}
                          className={`${user?.role === "admin" ? "wl-cell-admin" : ""} align-top border-b border-r border-gray-200 p-2`}
                          style={{
                            height: "100px",
                            overflow: "hidden",
                            verticalAlign: "top"
                          }}
                          onClick={() => {
                            // Cek jika dia admin, buka modal tambah
                            if (user?.role === "admin") {
                              setAddSlotData({ day, time });
                              setIsAddModalOpen(true);
                            }
                          }}
                        >
                          {matchedSchedules.length > 0 ? (
                            <div className="flex flex-col gap-1 overflow-hidden" style={{ maxHeight: "100%" }}>
                              {matchedSchedules.map(sch => (
                                <div
                                  key={sch.id}
                                  className={`flex items-center justify-center bg-green-100 border border-green-300 text-[#08503C] px-2 py-1 rounded-md text-xs font-bold hover:bg-red-100 hover:text-red-700 transition flex-shrink-0${user?.role === "admin" ? " wl-jadwal-card-admin" : ""}`}
                                  style={{
                                    minHeight: "32px",
                                    cursor: "pointer",
                                    whiteSpace: "normal",
                                    wordBreak: "break-word"
                                  }}
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
                              ))}
                            </div>
                          ) : (
                              <div className="text-gray-400 text-sm flex items-center justify-center h-full">{user?.role === "admin" ? "+ Tambah" : "-"}</div>
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
              <div className="mt-10 bg-red-50 border border-red-300 rounded-2xl p-8 shadow-sm mb-10">
                <h2 className="text-lg font-extrabold text-red-700 mb-2">Perhatian Admin</h2>
                <p className="text-sm text-red-600 mb-6">Daftar kelurahan di bawah ini belum dimasukkan ke dalam jadwal operasional.</p>
                {unscheduled.length > 0 ? (
                  <div className="wl-unscheduled-grid">
                    {unscheduled.map(kel => <span key={kel} className="bg-red-100 border border-red-200 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">{kel}</span>)}
                  </div>
                ) : (
                  <div style={{ color: "#059669", fontWeight: 600 }}>Semua kelurahan telah memiliki jadwal operasional!</div>
                )}
              </div>
            )}
          </div>

        {/* ======================= */}
        {/* MODAL TAMBAH JADWAL */}
        {/* ======================= */}
        {isAddModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-extrabold text-[#08503C] mb-6">Tambah Jadwal Baru</h3>

              <div style={{ marginBottom: "1rem", fontSize: "0.9rem", color: "#374553" }}>
                <strong>Hari:</strong> {addSlotData.day} <br />
                <strong>Jam:</strong> {addSlotData.time}
              </div>

              {actionError && <div style={{ marginBottom: "1rem", color: "#DC2626", fontSize: "0.85rem", fontWeight: 600 }}>{actionError}</div>}

              <form onSubmit={handleAddSchedule}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: 700, color: "#08503C" }}>Pilih Kelurahan Target</label>
                <select
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#08503C] focus:ring-2 focus:ring-[#08503C]/20"
                  required
                  value={newKelurahan}
                  onChange={(e) => setNewKelurahan(e.target.value)}
                >
                  <option value="" disabled>-- Pilih Kelurahan --</option>
                  {list_kelurahan.map(k => <option key={k} value={k}>{k}</option>)}
                </select>

                <div className="flex gap-4 mt-6">
                  <button type="button" className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200" onClick={() => setIsAddModalOpen(false)}>Batal</button>
                  <button type="submit" className="px-4 py-2 rounded-lg bg-[#08503C] text-white font-semibold hover:bg-[#063B2C]" disabled={actionLoading || !newKelurahan}>
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
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white w-full max-w-md rounded-2xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-extrabold text-red-600 mb-6">Hapus Jadwal?</h3>

              <p style={{ fontSize: "0.95rem", color: "#374553", lineHeight: 1.5 }}>
                Apakah Anda yakin ingin menghapus jadwal truk keliling untuk kelurahan <strong>{deleteTarget.kelurahan_target}</strong> pada hari <strong>{deleteTarget.day}</strong> pukul <strong>{deleteTarget.time}</strong>?
              </p>

              {actionError && <div style={{ marginTop: "1rem", color: "#DC2626", fontSize: "0.85rem", fontWeight: 600 }}>{actionError}</div>}

              <div className="flex gap-4 mt-6">
                <button type="button" className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200" onClick={() => setIsDeleteModalOpen(false)}>Batal</button>
                <button type="button" className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700" onClick={handleDeleteSchedule} disabled={actionLoading}>
                  {actionLoading ? "Menghapus..." : "Ya, Hapus"}
                </button>
              </div>
            </div>
          </div>
        )}

        </BlurFade>
      </div>
    </>
  );
}
