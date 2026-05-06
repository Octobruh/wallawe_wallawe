"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BlurFade } from "@/components/ui/blur-fade";

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

  const [kelurahan, setKelurahan] = useState("");
  const [rt, setRt] = useState("");
  const [rw, setRw] = useState("");
  const [jalan, setJalan] = useState("");
  const [descriptionLocation, setDescriptionLocation] = useState("");
  const [complaintText, setComplaintText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

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
      const formData = new FormData();
      formData.append("kelurahan", kelurahan);
      formData.append("rt", rt);
      formData.append("rw", rw);
      formData.append("jalan", jalan);
      formData.append("description_location", descriptionLocation);
      formData.append("complaint_text", complaintText);
      formData.append("file", file);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/complaints/`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Gagal mengirim laporan. Silakan coba lagi.");
      }

      setSubmitSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setKelurahan(""); setRt(""); setRw(""); setJalan("");
    setDescriptionLocation(""); setComplaintText("");
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);

    setSubmitSuccess(false); setErrorMessage("");
  };

  return (
    <div className="flex-1 w-full py-12 px-4 sm:px-6 relative">
      <div className="max-w-3xl mx-auto">
        <BlurFade inView>
          {submitSuccess ? (
            /* SUCCESS STATE */
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-12 text-center">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <h2 className="text-4xl font-extrabold text-[#08503C] mb-4">Laporan Berhasil Terkirim!</h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-8 max-w-xl mx-auto">
                Terima kasih atas kepedulian Anda. Laporan sedang diproses oleh AI kami untuk menentukan prioritas, dan akan segera ditangani oleh petugas kelurahan terkait.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <button onClick={resetForm} className="inline-block px-6 py-3 border-2 border-[#08503C] rounded-full text-[#08503C] font-bold hover:bg-[#08503C] hover:text-white transition">
                  Buat Laporan Lain
                </button>
                <Link href="/complaints" className="inline-block px-6 py-3 bg-[#08503C] text-white rounded-full font-bold hover:bg-[#063B2C] transition">
                  Pantau Laporan Saya
                </Link>
              </div>
            </div>
          ) : (
            /* FORM STATE */
            <>
              <div className="mb-10 text-center">
                <h1 className="text-4xl font-extrabold text-[#08503C] mb-3">Buat Laporan Sampah</h1>
                <p className="text-gray-600 text-lg">Isi detail lokasi dan unggah foto tumpukan sampah agar petugas dapat segera melakukan penanganan.</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
                {errorMessage && (
                  <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 rounded text-red-700 font-semibold">
                    {errorMessage}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">

                  {/* BAGIAN 1: LOKASI */}
                  <div>
                    <h3 className="text-lg font-extrabold text-[#08503C] mb-5 flex items-center gap-3 pb-3 border-b-2 border-gray-100">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-[#E6F3EE] text-[#08503C] rounded-full text-sm font-bold">1</span>
                      Lokasi Tumpukan
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Kelurahan</label>
                        <select
                          required
                          value={kelurahan}
                          onChange={(e) => setKelurahan(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#08503C] focus:ring-2 focus:ring-[#08503C]/20"
                        >
                          <option value="" disabled>-- Pilih Kelurahan --</option>
                          {list_kelurahan.map(k => <option key={k} value={k}>{k}</option>)}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">RT</label>
                          <input
                            type="number"
                            min="1"
                            placeholder="Mis. 05"
                            required
                            value={rt}
                            onChange={(e) => setRt(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#08503C] focus:ring-2 focus:ring-[#08503C]/20"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">RW</label>
                          <input
                            type="number"
                            min="1"
                            placeholder="Mis. 02"
                            required
                            value={rw}
                            onChange={(e) => setRw(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#08503C] focus:ring-2 focus:ring-[#08503C]/20"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Nama Jalan / Gang</label>
                        <input
                          type="text"
                          placeholder="Jalan Mawar No. 12"
                          required
                          value={jalan}
                          onChange={(e) => setJalan(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#08503C] focus:ring-2 focus:ring-[#08503C]/20"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Patokan Detail Lokasi</label>
                        <input
                          type="text"
                          placeholder="Di pojok perempatan, sebelah tiang listrik"
                          required
                          value={descriptionLocation}
                          onChange={(e) => setDescriptionLocation(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#08503C] focus:ring-2 focus:ring-[#08503C]/20"
                        />
                      </div>
                    </div>
                  </div>

                  {/* BAGIAN 2: DESKRIPSI KELUHAN */}
                  <div>
                    <h3 className="text-lg font-extrabold text-[#08503C] mb-5 flex items-center gap-3 pb-3 border-b-2 border-gray-100">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-[#E6F3EE] text-[#08503C] rounded-full text-sm font-bold">2</span>
                      Deskripsi Laporan
                    </h3>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Ceritakan detail tumpukan sampah</label>
                      <textarea
                        placeholder="Misal: Sudah menumpuk sejak 3 hari lalu dan mulai mengeluarkan bau tidak sedap. Sampah berserakan ke jalan..."
                        required
                        value={complaintText}
                        onChange={(e) => setComplaintText(e.target.value)}
                        rows={5}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#08503C] focus:ring-2 focus:ring-[#08503C]/20 resize-vertical"
                      ></textarea>
                    </div>
                  </div>

                  {/* BAGIAN 3: UNGGAH FOTO */}
                  <div>
                    <h3 className="text-lg font-extrabold text-[#08503C] mb-5 flex items-center gap-3 pb-3 border-b-2 border-gray-100">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-[#E6F3EE] text-[#08503C] rounded-full text-sm font-bold">3</span>
                      Bukti Foto
                    </h3>

                    <label className="block relative border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 cursor-pointer hover:border-[#08503C] hover:bg-[#08503C]/5 transition min-h-[180px] flex flex-col justify-center items-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        required={!file}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />

                      {!previewUrl ? (
                        <>
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#8A9490" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4 mx-auto">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>
                          </svg>
                          <div className="font-bold text-gray-700">Klik atau Tarik Foto ke Sini</div>
                          <div className="text-xs text-gray-500 mt-1">Format: JPG, PNG, JPEG</div>
                        </>
                      ) : (
                        <div className="text-center">
                          <div className="font-bold text-[#08503C] mb-2">Foto Terpilih: {file?.name}</div>
                          <img src={previewUrl} alt="Preview" className="max-w-full max-h-64 rounded-lg mx-auto border border-gray-200" />
                          <div className="text-xs text-[#08503C] mt-3 underline">Klik area ini untuk mengganti foto</div>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* TOMBOL SUBMIT */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-[#08503C] text-white font-bold rounded-lg shadow-lg hover:bg-[#063B2C] hover:-translate-y-1 transition disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
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
        </BlurFade>
      </div>
    </div>
  );
}
