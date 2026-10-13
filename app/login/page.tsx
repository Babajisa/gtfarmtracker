"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "@/lib/auth";

const itemIcons = [
  { src: "/images/Looming.png", alt: "Looming" },
  { src: "/images/DCS.png", alt: "Dreamcatcher Staff" },
  { src: "/images/TM.png", alt: "Tesseract Manipulator" },
  { src: "/images/BGL.png", alt: "BGL" },
  { src: "/images/WL.png", alt: "World Lock" },
  { src: "/images/fuelpack.png", alt: "Fuel Pack" },
  { src: "/images/soil.png", alt: "Soil" },
  { src: "/images/sorrow.png", alt: "Sorrow" },
];

const features = [
  { icon: "🌾", title: "Tracker Farm", desc: "Kelola 21 farm looming" },
  { icon: "⏱️", title: "Countdown Panen", desc: "Auto-hitung waktu tumbuh" },
  { icon: "💰", title: "Hitung Profit", desc: "Seed, WL, DL otomatis" },
  { icon: "📊", title: "Analisis", desc: "Laporan mingguan & bulanan" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const formFilled = email.trim() !== "" && password.trim() !== "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const { error } = await signIn(email, password);

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-950 via-emerald-950 to-green-900 text-white p-4 flex items-center justify-center font-mono relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(34,197,94,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,197,94,0.3) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-green-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Icon orbit */}
      <div className="absolute inset-0 pointer-events-none opacity-25 z-0">
        <div
          className="orbit-container orbit-cw-slow"
          style={{ "--orbit-radius": "min(40vw, 420px)" } as React.CSSProperties}
        >
          <div className="absolute -translate-x-1/2 -translate-y-1/2 counter-rotate-cw">
            <Image src="/images/Looming.png" alt="" width={55} height={55} className="brightness-110" />
          </div>
        </div>

        <div
          className="orbit-container orbit-ccw-slow"
          style={{ "--orbit-radius": "min(40vw, 420px)" } as React.CSSProperties}
        >
          <div className="absolute -translate-x-1/2 -translate-y-1/2 counter-rotate-ccw">
            <Image src="/images/DCS.png" alt="" width={50} height={50} className="brightness-110" />
          </div>
        </div>

        <div
          className="orbit-container orbit-cw-slow"
          style={{ "--orbit-radius": "min(40vw, 420px)" } as React.CSSProperties}
        >
          <div className="absolute -translate-x-1/2 -translate-y-1/2 counter-rotate-cw">
            <Image src="/images/TM.png" alt="" width={50} height={50} className="brightness-110" />
          </div>
        </div>

        <div
          className="orbit-container orbit-ccw-medium"
          style={{ "--orbit-radius": "min(32vw, 340px)" } as React.CSSProperties}
        >
          <div className="absolute -translate-x-1/2 -translate-y-1/2 counter-rotate-ccw">
            <Image src="/images/BGL.png" alt="" width={48} height={48} className="brightness-110" />
          </div>
        </div>

        <div
          className="orbit-container orbit-cw-medium"
          style={{ "--orbit-radius": "min(32vw, 340px)" } as React.CSSProperties}
        >
          <div className="absolute -translate-x-1/2 -translate-y-1/2 counter-rotate-cw">
            <Image src="/images/WL.png" alt="" width={45} height={45} className="brightness-110" />
          </div>
        </div>

        <div
          className="orbit-container orbit-ccw-medium"
          style={{ "--orbit-radius": "min(32vw, 340px)" } as React.CSSProperties}
        >
          <div className="absolute -translate-x-1/2 -translate-y-1/2 counter-rotate-ccw">
            <Image src="/images/fuelpack.png" alt="" width={45} height={45} className="brightness-110" />
          </div>
        </div>

        <div
          className="orbit-container orbit-cw-medium"
          style={{ "--orbit-radius": "min(24vw, 260px)" } as React.CSSProperties}
        >
          <div className="absolute -translate-x-1/2 -translate-y-1/2 counter-rotate-cw">
            <Image src="/images/soil.png" alt="" width={42} height={42} className="brightness-110" />
          </div>
        </div>

        <div
          className="orbit-container orbit-ccw-medium"
          style={{ "--orbit-radius": "min(24vw, 260px)" } as React.CSSProperties}
        >
          <div className="absolute -translate-x-1/2 -translate-y-1/2 counter-rotate-ccw">
            <Image src="/images/sorrow.png" alt="" width={42} height={42} className="brightness-110" />
          </div>
        </div>
      </div>

      {/* Konten utama */}
      <div className="w-full max-w-xl relative z-10 py-8">
        {/* Hero */}
        <div className="text-center mb-6">
          <div className="relative inline-block mb-4">
            <div className="logo-glow absolute inset-0 blur-2xl bg-green-500/60 rounded-full" />
            <Image
              src="/images/Looming.png"
              alt="Looming"
              width={100}
              height={100}
              className="relative brightness-125 drop-shadow-[0_0_35px_rgba(34,197,94,1)] logo-rotate"
            />
          </div>

          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-1 bg-gradient-to-r from-green-300 via-emerald-400 to-green-300 bg-clip-text text-transparent drop-shadow-[0_4px_15px_rgba(34,197,94,0.7)]">
            GROWTOPIA FARM
          </h1>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-3 bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent drop-shadow-[0_4px_15px_rgba(250,204,21,0.6)]">
            TRACKER
          </h2>

          <p className="text-green-300 text-sm font-semibold mb-2">
            🌾 Penghitung Profit Looming Otomatis
          </p>

          <p className="text-green-200/70 text-xs max-w-md mx-auto leading-relaxed">
            Kelola farm looming, hitung profit seed, biaya TM, dan analisis
            mingguan & bulanan — semua otomatis.
          </p>
        </div>

        {/* Form Login */}
        <div className="animated-border-wrapper">
          <form
            onSubmit={handleSubmit}
            className={`relative backdrop-blur-md rounded-2xl p-6 space-y-4 shadow-2xl transition-all duration-700 ${
              formFilled
                ? "bg-green-950/30 border border-green-500/30 shadow-green-500/20"
                : "bg-green-950 shadow-green-900/80"
            }`}
          >
            <h2 className="text-xl font-bold text-green-400 text-center">
              🔐 Login
            </h2>

            {errorMsg && (
              <div className="p-3 bg-red-900/60 border border-red-600 rounded text-sm text-red-200">
                ⚠️ {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-sm text-green-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Your email"
                className={`w-full px-3 py-2.5 rounded-lg border focus:border-green-400 focus:ring-2 focus:ring-green-500/30 outline-none text-white placeholder-green-700 transition-all duration-500 ${
                  formFilled
                    ? "bg-green-900/20 border-green-600/40"
                    : "bg-green-900/40 border-green-700/50"
                }`}
              />
            </div>

            <div>
              <label className="block text-sm text-green-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Password"
                minLength={6}
                className={`w-full px-3 py-2.5 rounded-lg border focus:border-green-400 focus:ring-2 focus:ring-green-500/30 outline-none text-white placeholder-green-700 transition-all duration-500 ${
                  formFilled
                    ? "bg-green-900/20 border-green-600/40"
                    : "bg-green-900/40 border-green-700/50"
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-bold transition-all ${
                loading
                  ? "bg-green-900 cursor-not-allowed text-green-600"
                  : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-900/50 hover:shadow-green-500/30 hover:scale-[1.02]"
              }`}
            >
              {loading ? "⏳ Loading..." : "🚀 Masuk"}
            </button>

            <p className="text-center text-sm text-green-300/70 pt-2 border-t border-green-800/50">
              Belum punya akun?{" "}
              <Link
                href="/register"
                className="text-green-400 hover:text-green-300 underline font-semibold"
              >
                Daftar di sini
              </Link>
            </p>
          </form>
        </div>

        {/* Fitur Grid */}
        <div className="grid grid-cols-4 gap-2 mt-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-green-950/60 backdrop-blur-sm border border-green-700/30 rounded-lg p-2 text-center"
              title={f.desc}
            >
              <div className="text-xl">{f.icon}</div>
              <p className="text-[10px] font-bold text-green-400 mt-1">
                {f.title}
              </p>
            </div>
          ))}
        </div>

        {/* Item Showcase */}
        <div className="mt-6">
          <p className="text-center text-[10px] text-green-500/50 mb-2 uppercase tracking-widest">
            Item yang dilayani
          </p>
          <div className="flex justify-center items-center gap-2 flex-wrap">
            {itemIcons.map((icon) => (
              <div
                key={icon.src}
                className="group relative bg-green-950/60 backdrop-blur-sm border border-green-700/30 rounded-lg p-1.5 hover:scale-110 hover:border-green-500/60 transition-all cursor-help"
                title={icon.alt}
              >
                <Image
                  src={icon.src}
                  alt={icon.alt}
                  width={26}
                  height={26}
                  className="opacity-80 group-hover:opacity-100"
                />
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-green-700/50 mt-6">
          © 2026 Growtopia Farm Tracker
        </p>
      </div>
    </main>
  );
}