import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F4F6F5] flex flex-col font-[Plus Jakarta Sans] text-black">

      {/* HERO */}
      <main className="flex-1 flex items-center justify-center text-center px-4 sm:px-6 py-10 relative overflow-hidden">

        {/* DOT BG */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(8,80,60,0.05)_1px,transparent_1px)] bg-[length:24px_24px]" />

        <div className="relative w-full max-w-3xl mx-auto">

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
      </main>

      {/* WHATSAPP */}
      <a
        href="https://wa.me/6281234567890"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-5 sm:bottom-8 sm:right-8 flex items-center gap-2 bg-green-500 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-full font-bold shadow-lg hover:-translate-y-1 transition text-sm sm:text-base"
      >
        WhatsApp
      </a>
    </div>
  );
}
