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

      await fetchSchedules();
      if (token) fetchUnscheduled(token);

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
  const visibleDays = filterDay ? [filterDay] : days;

  const getSchedulesForSlot = (day: string, time: string) => {
    return schedules.filter(sch => {
      const matchSlot = sch.day === day && sch.time === time;
      const matchKelurahan = filterKelurahan ? sch.kelurahan_target.toLowerCase() === filterKelurahan.toLowerCase() : true;
      return matchSlot && matchKelurahan;
    });
  };

  return (
    <div className="flex-1 w-full flex flex-col bg-[#F4F6F5] min-h-[calc(100vh-64px)] font-[Plus Jakarta Sans] text-gray-900 px-4 sm:px-8 py-8">
      <BlurFade inView>
        <div className="max-w-[1200px] mx-auto w-full">

          {/* HEADER & FILTER */}
          <header className="mb-8">
            <h1 className="text-[2.25rem] font-extrabold text-[#08503C] tracking-tight mb-2">Jadwal Truk Keliling</h1>
            <p className="text-[#374553] text-lg">Pantau jadwal pengambilan sampah. {user?.role === "admin" && <strong>Klik area kosong pada tabel untuk menambah jadwal.</strong>}</p>
          </header>

          <div className="bg-white rounded-2xl border border-[#E8EDEB] shadow-sm p-6 mb-10 flex flex-wrap gap-6 items-end">
            <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
              <label className="text-xs font-bold text-[#08503C] uppercase tracking-wide">Pilih Hari</label>
              <select className="w-full px-4 py-3 rounded-lg border-2 border-[#E0E7E4] bg-[#FAFBFA] text-[0.95rem] text-[#111] focus:outline-none focus:border-[#08503C] transition-colors cursor-pointer" value={filterDay} onChange={(e) => setFilterDay(e.target.value)}>
                <option value="">Semua Hari</option>
                {days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
              <label className="text-xs font-bold text-[#08503C] uppercase tracking-wide">Pilih Kelurahan</label>
              <select className="w-full px-4 py-3 rounded-lg border-2 border-[#E0E7E4] bg-[#FAFBFA] text-[0.95rem] text-[#111] focus:outline-none focus:border-[#08503C] transition-colors cursor-pointer" value={filterKelurahan} onChange={(e) => setFilterKelurahan(e.target.value)}>
                <option value="">Semua Kelurahan</option>
                {list_kelurahan.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          </div>

          {/* TABEL MATRIX */}
          <div className="bg-white rounded-2xl border border-[#E8EDEB] shadow-sm overflow-x-auto mb-10">
            {isLoadingSchedules ? (
              <div className="p-16 text-center text-[#08503C] font-bold text-lg">Memuat data jadwal...</div>
            ) : (
              <table className={`w-full border-collapse text-left ${visibleDays.length > 1 ? "min-w-[800px]" : "min-w-full"}`}>
                <thead>
                  <tr>
                    <th className="w-[90px] sm:w-[120px] p-2 sm:p-4 bg-[#FAFBFA] text-[#08503C] font-bold text-[0.75rem] sm:text-[0.9rem] text-center border border-[#E8EDEB]">
                      Jam Operasional
                    </th>
                    {visibleDays.map(day => (
                      <th key={day} className="p-2 sm:p-4 bg-[#FAFBFA] text-[#08503C] font-bold text-[0.75rem] sm:text-[0.9rem] text-center border border-[#E8EDEB]">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map(time => (
                    <tr key={time}>
                      <td className="w-[90px] sm:w-[120px] p-2 sm:p-4 bg-[#FAFBFA] text-[#374553] text-[0.7rem] sm:text-[0.85rem] font-bold text-center align-middle border border-[#E8EDEB]">
                        {time}
                      </td>
                      {visibleDays.map(day => {
                        const matchedSchedules = getSchedulesForSlot(day, time);
                        return (
                          <td
                            key={`${day}-${time}`}
                            className={`p-2 sm:p-3 border border-[#E8EDEB] align-top relative ${visibleDays.length > 1 ? "min-w-[140px]" : ""} h-[80px] sm:h-[100px] ${user?.role === "admin" ? "cursor-pointer hover:bg-[#E6F3EE] transition-colors" : ""}`}
                            onClick={() => {
                              if (user?.role === "admin") {
                                setAddSlotData({ day, time });
                                setIsAddModalOpen(true);
                              }
                            }}
                          >
                            {matchedSchedules.length > 0 ? (
                              <div className="flex flex-col items-center gap-1.5 w-full h-full max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
                                {matchedSchedules.map(sch => (
                                  <div
                                    key={sch.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (user?.role === "admin") {
                                        setDeleteTarget(sch);
                                        setIsDeleteModalOpen(true);
                                      }
                                    }}
                                    title={user?.role === "admin" ? "Klik untuk menghapus" : ""}
                                    className={`w-fit min-w-[110px] max-w-[95%] text-center bg-[#E6F3EE] border border-[#A7F3D0] text-[#08503C] px-2 py-1.5 rounded-md text-[0.7rem] sm:text-[0.8rem] font-bold shadow-sm transition-all ${user?.role === "admin" ? "hover:bg-[#FEE2E2] hover:text-[#B91C1C] hover:border-[#FCA5A5] hover:line-through" : ""}`}
                                  >
                                    {sch.kelurahan_target}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className={`text-[#A0ABA6] text-[0.7rem] sm:text-[0.8rem] flex items-center justify-center h-full w-full pointer-events-none ${user?.role === "admin" ? "group-hover:text-[#08503C] group-hover:font-bold" : ""}`}>
                                {user?.role === "admin" ? "+ Tambah" : "-"}
                              </div>
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
            <div className="bg-[#FFF4F4] border border-[#FCA5A5] rounded-2xl p-8 shadow-sm mb-10">
              <h2 className="text-[1.25rem] font-extrabold text-[#B91C1C] mb-2 flex items-center gap-2">Perhatian Admin</h2>
              <p className="text-[0.9rem] text-[#991B1B] mb-6">Daftar kelurahan di bawah ini belum dimasukkan ke dalam jadwal operasional.</p>
              {unscheduled.length > 0 ? (
                <div className="flex flex-wrap gap-2.5">
                  {unscheduled.map(kel => <span key={kel} className="bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] px-3.5 py-1.5 rounded-full text-[0.85rem] font-semibold">{kel}</span>)}
                </div>
              ) : (
                <div className="text-[#059669] font-semibold">Semua kelurahan telah memiliki jadwal operasional!</div>
              )}
            </div>
          )}

        </div>
      </BlurFade>

      {/* ======================= */}
      {/* MODAL TAMBAH JADWAL */}
      {/* ======================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-[420px] rounded-2xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto animate-[dropIn_0.2s_ease-out]">
            <h3 className="text-[1.35rem] font-extrabold text-[#08503C] mb-6">Tambah Jadwal Baru</h3>

            <div className="mb-4 text-[0.9rem] text-[#374553]">
              <strong>Hari:</strong> {addSlotData.day} <br />
              <strong>Jam:</strong> {addSlotData.time}
            </div>

            {actionError && <div className="mb-4 text-[#DC2626] text-[0.85rem] font-semibold">{actionError}</div>}

            <form onSubmit={handleAddSchedule}>
              <label className="block mb-2 text-[0.85rem] font-bold text-[#08503C]">Pilih Kelurahan Target</label>
              <select
                className="w-full px-4 py-3 bg-[#FAFBFA] border-2 border-[#E0E7E4] rounded-xl text-[0.95rem] text-[#111] focus:outline-none focus:border-[#08503C] transition-colors cursor-pointer"
                required
                value={newKelurahan}
                onChange={(e) => setNewKelurahan(e.target.value)}
              >
                <option value="" disabled>-- Pilih Kelurahan --</option>
                {list_kelurahan.map(k => <option key={k} value={k}>{k}</option>)}
              </select>

              <div className="flex gap-4 mt-8">
                <button type="button" className="flex-1 py-3 rounded-xl bg-[#F4F6F5] text-[#374553] font-bold hover:bg-[#E8EDEB] transition-colors" onClick={() => setIsAddModalOpen(false)}>Batal</button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-[#08503C] text-white font-bold hover:bg-[#063B2C] transition-colors disabled:opacity-60 disabled:cursor-not-allowed" disabled={actionLoading || !newKelurahan}>
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
          <div className="bg-white w-full max-w-[420px] rounded-2xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto animate-[dropIn_0.2s_ease-out]">
            <h3 className="text-[1.35rem] font-extrabold text-[#DC2626] mb-6">Hapus Jadwal?</h3>

            <p className="text-[0.95rem] text-[#374553] leading-relaxed">
              Apakah Anda yakin ingin menghapus jadwal truk keliling untuk kelurahan <strong>{deleteTarget.kelurahan_target}</strong> pada hari <strong>{deleteTarget.day}</strong> pukul <strong>{deleteTarget.time}</strong>?
            </p>

            {actionError && <div className="mt-4 text-[#DC2626] text-[0.85rem] font-semibold">{actionError}</div>}

            <div className="flex gap-4 mt-8">
              <button type="button" className="flex-1 py-3 rounded-xl bg-[#F4F6F5] text-[#374553] font-bold hover:bg-[#E8EDEB] transition-colors" onClick={() => setIsDeleteModalOpen(false)}>Batal</button>
              <button type="button" className="flex-1 py-3 rounded-xl bg-[#DC2626] text-white font-bold hover:bg-[#B91C1C] transition-colors disabled:opacity-60 disabled:cursor-not-allowed" onClick={handleDeleteSchedule} disabled={actionLoading}>
                {actionLoading ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
