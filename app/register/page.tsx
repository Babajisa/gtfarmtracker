"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password !== confirmPassword) {
      setErrorMsg("Password dan konfirmasi password tidak sama!");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password minimal 6 karakter!");
      return;
    }

    setLoading(true);
    const { data, error } = await signUp(email, password);
    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    if (data.session) {
      setSuccessMsg("Registrasi berhasil! Mengarahkan ke tracker...");
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1000);
    } else {
      setSuccessMsg(
        "Registrasi berhasil! Cek email kamu untuk verifikasi, lalu login."
      );
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    }
  }

  return (
        <main className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-emerald-950 text-white p-4 flex items-center justify-center font-mono relative overflow-hidden">      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-400 mb-2">
            🌱 Growtopia Farm Tracker
          </h1>
          <p className="text-gray-400 text-sm">Buat akun baru</p>
        </div>

        <form
        onSubmit={handleSubmit}
        className="bg-green-950/80 backdrop-blur-sm border-2 border-green-700/50 rounded-2xl p-6 space-y-4 shadow-2xl shadow-green-900/50 w-full max-w-md relative z-10"
        >
          <h2 className="text-xl font-bold text-green-400 mb-2">
            ✨ Registrasi
          </h2>

          {errorMsg && (
            <div className="p-3 bg-red-900/40 border border-red-600 rounded text-sm text-red-200">
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-green-900/40 border border-green-600 rounded text-sm text-green-200">
              ✅ {successMsg}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="kamu@email.com"
              className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-600 focus:border-green-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Minimal 6 karakter"
              minLength={6}
              className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-600 focus:border-green-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Konfirmasi Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Ketik ulang password"
              minLength={6}
              className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-600 focus:border-green-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded font-semibold transition ${
              loading
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-500"
            }`}
          >
            {loading ? "Loading..." : "Daftar"}
          </button>

          <p className="text-center text-sm text-gray-400 pt-2 border-t border-gray-700">
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="text-green-400 hover:text-green-300 underline"
            >
              Login di sini
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}