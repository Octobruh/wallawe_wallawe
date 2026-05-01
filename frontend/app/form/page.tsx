"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// --- Tipe Data ---
type User = {
  username: string;
  role: string;
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

export default function FormLaporanPage() {
  const router = useRouter();

  // State Profil & Navbar
  const [user, setUser] = useState<User>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // State Form
  const [kelurahan, setKelurahan] = useState("");
  const [rt, setRt] = useState("");
  const [rw, setRw] = useState("");
  const [jalan, setJalan] = useState("");
  const [descriptionLocation, setDescriptionLocation] = useState("");
  const [complaintText, setComplaintText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // State Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // --- Efek Autentikasi (Navbar) ---
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const resUser = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (resUser.ok) setUser(await resUser.json());
        else localStorage.removeItem("token");
      } catch (err) {
        console.error("Gagal memuat profil", err);
      }
    };
    fetchUser();
  }, []);

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
  };

  // --- Handler File Input (Untuk Image Preview) ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  // --- Handler Submit Form ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    if (!file) {
      setErrorMessage("Bukti foto wajib dilampirkan.");
      setIsSubmitting(false);
      return;
    }

    try {
      // PERHATIAN: Gunakan FormData untuk mengirim Form() dan File() ke FastAPI
      const formData = new FormData();
      formData.append("kelurahan", kelurahan);
      formData.append("rt", rt);
      formData.append("rw", rw);
      formData.append("jalan", jalan);
      formData.append("description_location", descriptionLocation);
      formData.append("complaint_text", complaintText);
      formData.append("file", file); // File di-append langsung

      // Catatan: Jangan set "Content-Type", biarkan browser yang men-set secara otomatis dengan "boundary"
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/complaints/`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Gagal mengirim laporan. Silakan coba lagi.");
      }

      // Jika sukses
      setSubmitSuccess(true);

    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset Form untuk laporan baru
  const resetForm = () => {
    setKelurahan(""); setRt(""); setRw(""); setJalan("");
    setDescriptionLocation(""); setComplaintText("");
    setFile(null); setPreviewUrl(null);
    setSubmitSuccess(false); setErrorMessage("");
  };

  const initials = user ? user.username.substring(0, 2).toUpperCase() : null;

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

        /* PROFIL AVATAR */
        .wl-avatar-btn { width: 36px; height: 36px; border-radius: 50%; border: 1.5px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.1); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 700; color: #fff; transition: all 0.15s; }
        .wl-avatar-btn:hover, .wl-avatar-btn.active { border-color: #5FD4AA; background: rgba(95,212,170,0.15); color: #5FD4AA; }
        .wl-dropdown { position: absolute; top: calc(100% + 12px); right: 0; width: 280px; background: #fff; border: 1px solid #E8EDEB; border-radius: 16px; box-shadow: 0 16px 40px rgba(0,0,0,0.12); overflow: hidden; animation: dropIn 0.18s cubic-bezier(.22,1,.36,1); }
        @keyframes dropIn { from { opacity: 0; transform: translateY(-8px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }

        /* FORM KONTEN */
        .wl-page-container { max-width: 800px; margin: 3rem auto; width: 100%; padding: 0 2rem; }
        .wl-page-header { margin-bottom: 2rem; text-align: center; }
        .wl-page-title { font-size: 2.5rem; font-weight: 800; color: #08503C; margin-bottom: 0.5rem; letter-spacing: -0.03em; }
        .wl-page-subtitle { color: #374553; font-size: 1.1rem; line-height: 1.6; }

        .wl-form-card { background: #fff; border-radius: 20px; border: 1px solid #E8EDEB; box-shadow: 0 12px 32px rgba(0,0,0,0.04); padding: 2.5rem; }
        .wl-form-section-title { font-size: 1.15rem; font-weight: 800; color: #08503C; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 8px; border-bottom: 2px solid #F4F6F5; padding-bottom: 0.75rem; }
        
        .wl-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.5rem; }
        .wl-form-group { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem; }
        .wl-form-group.full { grid-column: 1 / -1; }
        
        .wl-label { font-size: 0.85rem; font-weight: 700; color: #374553; }
        .wl-input { width: 100%; padding: 14px 16px; background: #FAFBFA; border: 1.5px solid #E0E7E4; border-radius: 12px; font-family: inherit; font-size: 0.95rem; color: #111; transition: all 0.2s; outline: none; }
        .wl-input:focus { border-color: #08503C; background: #fff; box-shadow: 0 0 0 4px rgba(8,80,60,0.05); }
        textarea.wl-input { min-height: 120px; resize: vertical; }

        /* UPLOAD FILE ZONE */
        .wl-file-dropzone { border: 2px dashed #C5D1CD; border-radius: 16px; padding: 2rem; text-align: center; background: #FAFBFA; cursor: pointer; transition: all 0.2s; position: relative; }
        .wl-file-dropzone:hover { border-color: #08503C; background: rgba(8,80,60,0.02); }
        .wl-file-input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }
        .wl-preview-img { max-width: 100%; max-height: 250px; border-radius: 8px; margin-top: 1rem; border: 1px solid #E0E7E4; }

        .wl-btn-submit { width: 100%; padding: 16px; background: #08503C; border-radius: 12px; color: #fff; font-weight: 800; font-size: 1.05rem; border: none; cursor: pointer; transition: all 0.2s; font-family: inherit; margin-top: 1rem; box-shadow: 0 4px 12px rgba(8,80,60,0.2); }
        .wl-btn-submit:hover:not(:disabled) { background: #063B2C; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(8,80,60,0.3); }
        .wl-btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }

        /* SUCCESS STATE */
        .wl-success-card { text-align: center; padding: 4rem 2rem; }
        .wl-success-icon { width: 80px; height: 80px; background: #D1FAE5; color: #059669; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; }
        .wl-btn-outline { display: inline-block; padding: 12px 24px; border: 2px solid #08503C; border-radius: 999px; color: #08503C; font-weight: 700; text-decoration: none; margin-top: 2rem; transition: all 0.2s; }
        .wl-btn-outline:hover { background: #08503C; color: #fff; }
      `}</style>

      <div className="wl-root">
        {/* NAVBAR */}
        <nav className="wl-nav">
          <div style={{ display: "flex", alignItems: "center", gap: "2.5rem" }}>
            <Link href="/" className="wl-brand">Wall-awe</Link>
            <div style={{ display: "flex", gap: "1.75rem" }}>
              <Link href="/form" className="wl-nav-link active">Buat Laporan</Link>
              <Link href="/complaints" className="wl-nav-link">Pantau Laporan</Link>
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

        {/* KONTEN UTAMA */}
        <div className="wl-page-container">

          {submitSuccess ? (
            /* TAMPILAN SUKSES */
            <div className="wl-form-card wl-success-card">
              <div className="wl-success-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <h2 className="wl-page-title" style={{ fontSize: "2rem" }}>Laporan Berhasil Terkirim!</h2>
              <p className="wl-page-subtitle">
                Terima kasih atas kepedulian Anda. Laporan sedang diproses oleh AI kami untuk menentukan prioritas, dan akan segera ditangani oleh petugas kelurahan terkait.
              </p>

              <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
                <button onClick={resetForm} className="wl-btn-outline" style={{ cursor: "pointer" }}>
                  Buat Laporan Lain
                </button>
                <Link href="/complaints" className="wl-btn-outline" style={{ background: "#08503C", color: "#fff" }}>
                  Pantau Laporan Saya
                </Link>
              </div>
            </div>
          ) : (
            /* TAMPILAN FORM */
            <>
              <header className="wl-page-header">
                <h1 className="wl-page-title">Buat Laporan Sampah</h1>
                <p className="wl-page-subtitle">Isi detail lokasi dan unggah foto tumpukan sampah agar petugas dapat segera melakukan penanganan.</p>
              </header>

              <div className="wl-form-card">
                {errorMessage && (
                  <div style={{ padding: "1rem", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "12px", color: "#B91C1C", fontWeight: 600, marginBottom: "2rem" }}>
                    {errorMessage}
                  </div>
                )}

                <form onSubmit={handleSubmit}>

                  {/* BAGIAN 1: LOKASI */}
                  <h3 className="wl-form-section-title">
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, background: "#E6F3EE", color: "#08503C", borderRadius: "50%", fontSize: "0.85rem", marginRight: 8 }}>1</span>
                    Lokasi Tumpukan
                  </h3>

                  <div className="wl-form-grid">
                    <div className="wl-form-group">
                      <label className="wl-label">Kelurahan</label>
                      <select className="wl-input" required value={kelurahan} onChange={(e) => setKelurahan(e.target.value)}>
                        <option value="" disabled>-- Pilih Kelurahan --</option>
                        {list_kelurahan.map(k => <option key={k} value={k}>{k}</option>)}
                      </select>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                      <div className="wl-form-group">
                        <label className="wl-label">RT</label>
                        <input type="number" min="1" className="wl-input" placeholder="Mis. 05" required value={rt} onChange={(e) => setRt(e.target.value)} />
                      </div>
                      <div className="wl-form-group">
                        <label className="wl-label">RW</label>
                        <input type="number" min="1" className="wl-input" placeholder="Mis. 02" required value={rw} onChange={(e) => setRw(e.target.value)} />
                      </div>
                    </div>

                    <div className="wl-form-group full">
                      <label className="wl-label">Nama Jalan / Gang</label>
                      <input type="text" className="wl-input" placeholder="Jalan Mawar No. 12" required value={jalan} onChange={(e) => setJalan(e.target.value)} />
                    </div>

                    <div className="wl-form-group full">
                      <label className="wl-label">Patokan Detail Lokasi</label>
                      <input type="text" className="wl-input" placeholder="Di pojok perempatan, sebelah tiang listrik" required value={descriptionLocation} onChange={(e) => setDescriptionLocation(e.target.value)} />
                    </div>
                  </div>

                  {/* BAGIAN 2: DETAIL KELUHAN */}
                  <h3 className="wl-form-section-title" style={{ marginTop: "2rem" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, background: "#E6F3EE", color: "#08503C", borderRadius: "50%", fontSize: "0.85rem", marginRight: 8 }}>2</span>
                    Deskripsi Laporan
                  </h3>

                  <div className="wl-form-group">
                    <label className="wl-label">Ceritakan detail tumpukan sampah</label>
                    <textarea
                      className="wl-input"
                      placeholder="Misal: Sudah menumpuk sejak 3 hari lalu dan mulai mengeluarkan bau tidak sedap. Sampah berserakan ke jalan..."
                      required
                      value={complaintText}
                      onChange={(e) => setComplaintText(e.target.value)}
                    ></textarea>
                  </div>

                  {/* BAGIAN 3: UNGGAH FOTO */}
                  <h3 className="wl-form-section-title" style={{ marginTop: "2rem" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, background: "#E6F3EE", color: "#08503C", borderRadius: "50%", fontSize: "0.85rem", marginRight: 8 }}>3</span>
                    Bukti Foto
                  </h3>

                  <div className="wl-form-group">
                    <div className="wl-file-dropzone">
                      <input
                        type="file"
                        accept="image/*"
                        className="wl-file-input"
                        onChange={handleFileChange}
                        required={!file} // Hanya wajib jika belum ada file
                      />

                      {!previewUrl ? (
                        <>
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#A0ABA6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 1rem" }}>
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>
                          </svg>
                          <div style={{ fontWeight: 700, color: "#374553" }}>Klik atau Tarik Foto ke Sini</div>
                          <div style={{ fontSize: "0.8rem", color: "#8A9490", marginTop: 4 }}>Format: JPG, PNG, JPEG</div>
                        </>
                      ) : (
                        <div>
                          <div style={{ fontWeight: 700, color: "#08503C", marginBottom: "0.5rem" }}>Foto Terpilih: {file?.name}</div>
                          <img src={previewUrl} alt="Preview" className="wl-preview-img" />
                          <div style={{ fontSize: "0.8rem", color: "#08503C", marginTop: "1rem", textDecoration: "underline" }}>Klik area ini untuk mengganti foto</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* TOMBOL SUBMIT */}
                  <button type="submit" className="wl-btn-submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Menganalisis & Mengirim...
                      </span>
                    ) : (
                      "Kirim Laporan"
                    )}
                  </button>

                </form>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}
