"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BlurFade } from "@/components/ui/blur-fade";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });

      if (!response.ok) throw new Error("Username atau password salah!");

      const data = await response.json();
      localStorage.setItem("token", data.access_token);
      router.push("/dashboard");
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row w-full min-h-[calc(100vh-64px)]">
        <div className="hidden md:flex relative w-[45%] bg-[#08503C] flex-col justify-center px-16 py-16 overflow-hidden">
          <div className="deco-circle-1" />
          <div className="deco-circle-2" />
          <div className="deco-circle-3" />
          <div className="text-[clamp(3.5rem,6vw,5.5rem)] font-extrabold text-white leading-none mb-2 tracking-tight">
            Wall-awe
          </div>
          <h1 className="text-[clamp(2.5rem,4vw,3.5rem)] font-bold text-white leading-tight mb-6 tracking-tight">
            Sistem Keluhan<br />
            <span style={{ color: "#5FD4AA" }}>Sampah</span> Terpadu
          </h1>
          <p className="text-white/75 text-lg leading-relaxed max-w-md">
            Masuk ke portal dasbor untuk mengelola, memantau, dan menyelesaikan pengaduan masyarakat di lingkungan Anda.
          </p>
        </div>
        <div className="flex-1 bg-[#F4F6F5] flex items-center justify-center px-6 py-12">
          <BlurFade inView className="w-full max-w-md">
            <div className="w-full bg-white rounded-2xl shadow-xl p-11 border border-[#E8EDEB]">

              {/* Header form */}
              <div className="mb-8">
                <h2 className="text-2xl font-extrabold text-black tracking-tight">
                  Selamat Datang
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Silakan login untuk melanjutkan
                </p>
              </div>

              {/* Error alert */}
              {errorMsg && (
                <div className="mb-5 p-3 bg-red-50 border border-red-200 border-l-4 border-red-500 rounded text-red-700 text-sm font-medium">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleLogin} className="flex flex-col gap-5">
                {/* Username */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 tracking-wide">
                    Username
                  </label>
                  <input
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#08503C] focus:ring-2 focus:ring-[#08503C]/20 transition-all"
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                    placeholder="Masukkan username Anda"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 tracking-wide">
                    Password
                  </label>
                  <input
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-[#08503C] focus:ring-2 focus:ring-[#08503C]/20 transition-all"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                  />
                </div>

                {/* Tombol */}
                <button
                  className="mt-2 w-full py-3 bg-[#08503C] text-white font-bold text-sm rounded-lg flex justify-center items-center gap-2 disabled:opacity-70 hover:bg-[#063B2C] hover:-translate-y-[1px] transition-all"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg style={{ animation: "spin 1s linear infinite", width: 18, height: 18 }}
                        viewBox="0 0 24 24" fill="none">
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                        <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      Memproses...
                    </>
                  ) : (
                    "Masuk ke Dasbor →"
                  )}
                </button>
              </form>

              {/* Footer info */}
              <p className="mt-7 text-center text-xs text-gray-400 leading-relaxed">
                Ada pertanyaan? Hubungi{" "}
                <a href="#" className="text-[#08503C] font-semibold no-underline hover:underline">
                  tim teknis
                </a>.
              </p>
            </div>
          </BlurFade>
        </div>
      </div>
    </>
  );
}
