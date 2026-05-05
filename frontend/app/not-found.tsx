import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F4F6F5] flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        
        {/* Error Code */}
        <div className="mb-8">
          <h1 className="text-9xl font-extrabold text-[#08503C] leading-none mb-2">
            404
          </h1>
          <div className="h-1 w-24 mx-auto bg-gradient-to-r from-[#08503C] to-[#5FD4AA] rounded-full"></div>
        </div>

        {/* Message */}
        <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Halaman Tidak Ditemukan</h2>
        <p className="text-gray-600 text-lg leading-relaxed mb-8">
          Maaf, halaman yang Anda cari tidak ada atau mungkin telah dipindahkan. Mari kembali ke beranda untuk melanjutkan.
        </p>

        {/* Illustration */}
        <div className="mb-12 text-6xl">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#08503C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto opacity-70">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="8" y1="15" x2="16" y2="15"></line>
            <line x1="8" y1="10" x2="8.01" y2="10"></line>
            <line x1="16" y1="10" x2="16.01" y2="10"></line>
          </svg>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 justify-center flex-col sm:flex-row">
          <Link
            href="/"
            className="px-8 py-3 bg-[#08503C] text-white font-bold rounded-xl hover:bg-[#063B2C] transition shadow-lg hover:-translate-y-1"
          >
            ← Kembali ke Beranda
          </Link>
          <Link
            href="/form"
            className="px-8 py-3 border-2 border-[#08503C] text-[#08503C] font-bold rounded-xl hover:bg-[#08503C] hover:text-white transition"
          >
            Buat Laporan →
          </Link>
        </div>

        {/* Additional Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm mb-4">Navigasi Cepat:</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/complaints" className="text-[#08503C] font-semibold hover:underline text-sm">
              Pantau Laporan
            </Link>
            <span className="text-gray-300">•</span>
            <Link href="/jadwal" className="text-[#08503C] font-semibold hover:underline text-sm">
              Jadwal Keliling
            </Link>
            <span className="text-gray-300">•</span>
            <Link href="/dashboard" className="text-[#08503C] font-semibold hover:underline text-sm">
              Dasbor
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
