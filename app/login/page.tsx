"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    <main className="min-h-screen bg-gray-900 text-white p-4 flex items-center justify-center font-mono">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-400 mb-2">
            🌱 Growtopia Farm Tracker
          </h1>
          <p className="text-gray-400 text-sm">Login untuk lanjut</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4"
        >
          <h2 className="text-xl font-bold text-green-400 mb-2">🔐 Login</h2>

          {errorMsg && (
            <div className="p-3 bg-red-900/40 border border-red-600 rounded text-sm text-red-200">
              ⚠️ {errorMsg}
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
              placeholder="••••••••"
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
            {loading ? "Loading..." : "Login"}
          </button>

          <p className="text-center text-sm text-gray-400 pt-2 border-t border-gray-700">
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="text-green-400 hover:text-green-300 underline"
            >
              Daftar di sini
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}