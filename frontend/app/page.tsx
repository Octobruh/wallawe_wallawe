"use client";
import Link from "next/link";
import { BlurFade } from "@/components/ui/blur-fade";

export default function LandingPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col relative w-full bg-[#F4F6F5]">
      {/* HERO */}
      <main className="flex-1 flex items-center justify-center text-center px-4 sm:px-6 py-10 relative overflow-hidden z-10">

        {/* DOT BG */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(8,80,60,0.05)_1px,transparent_1px)] bg-[length:24px_24px] pointer-events-none" />

        <BlurFade inView>
          <div className="relative w-full max-w-3xl mx-auto -mt-10">

            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#08503C] mb-6 px-4 py-1 rounded-full bg-green-200/40 border border-green-300">
              <span className="w-2 h-2 bg-[#08503C] rounded-full" />
              Kota Yogyakarta
            </div>

            <h1 className="text-[clamp(2.2rem,7vw,4.5rem)] font-extrabold leading-tight text-[#08503C] mb-6">
              Sistem Pengaduan <br />
              <span className="text-green-400">Sampah</span> Terpadu
            </h1>

            <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-10 max-w-xl mx-auto">
              Laporkan masalah sampah di lingkungan Anda. Setiap keluhan dipantau,
              diprioritaskan, dan diselesaikan secara transparan.
            </p>

            <div className="flex gap-3 sm:gap-4 justify-center flex-wrap">
              <Link
                href="/form"
                className="w-full sm:w-auto text-center px-8 py-3 bg-[#08503C] text-white rounded-xl font-bold shadow-lg hover:bg-[#063B2C] hover:-translate-y-1 transition"
              >
                + Buat Laporan
              </Link>

              <Link
                href="/jadwal"
                className="w-full sm:w-auto text-center px-8 py-3 border-2 border-[#08503C]/20 text-[#08503C] rounded-xl font-bold hover:border-[#08503C] transition"
              >
                Lihat Jadwal Keliling
              </Link>
            </div>
          </div>
        </BlurFade>
      </main>

      {/* WHATSAPP */}
      <a
        href="https://wa.me/6281234567890"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-5 sm:bottom-8 sm:right-8 flex items-center gap-2.5 bg-[#25D366] text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-full font-bold shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all text-sm sm:text-base z-50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.405-.883-.733-1.48-1.639-1.653-1.935-.173-.297-.018-.458.13-.606.134-.133-.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
        </svg>
        Hubungi via WhatsApp
      </a>
    </div>
  );
}
