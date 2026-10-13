"use client";

import Link from "next/link";

type UpgradeModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const features = [
  {
    name: "Tracker Farm",
    free: "21 farm",
    premium: "Unlimited",
  },
  {
    name: "Countdown Panen",
    free: "✅",
    premium: "✅",
  },
  {
    name: "Auto-hitung Profit",
    free: "❌",
    premium: "✅",
  },
  {
    name: "Analisis Profit",
    free: "❌",
    premium: "✅",
  },
  {
    name: "Estimasi Mingguan & Bulanan",
    free: "❌",
    premium: "✅",
  },
  {
    name: "Riwayat Panen",
    free: "✅",
    premium: "✅",
  },
  {
    name: "Notifikasi Browser",
    free: "✅",
    premium: "✅",
  },
  {
    name: "Export Data (CSV)",
    free: "❌",
    premium: "✅ (Coming Soon)",
  },
  {
    name: "Prioritas Support",
    free: "❌",
    premium: "✅",
  },
];

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  if (!isOpen) return null;

  function handleUpgrade() {
    alert(
      "🎉 Terima kasih atas minatmu!\n\nFitur pembayaran sedang dalam pengembangan. Stay tuned!"
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border-2 border-yellow-600 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-5 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-yellow-400">
              ⭐ Upgrade ke Premium
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Buka semua fitur analisis profit
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold w-8 h-8 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-6">
          {/* Highlight */}
          <div className="bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border border-yellow-600 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-400 uppercase mb-1">
              Harga Spesial
            </p>
            <p className="text-3xl font-bold text-yellow-400">Coming Soon</p>
            <p className="text-xs text-gray-400 mt-1">
              Sekali bayar, akses selamanya
            </p>
          </div>

          {/* Comparison Table */}
          <div>
            <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">
              📊 Perbandingan Fitur
            </h3>
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="grid grid-cols-3 bg-gray-700 text-xs font-bold">
                <div className="p-3 text-gray-300">Fitur</div>
                <div className="p-3 text-center text-gray-400">Gratis</div>
                <div className="p-3 text-center text-yellow-400">
                  ⭐ Premium
                </div>
              </div>
              {features.map((f, idx) => (
                <div
                  key={f.name}
                  className={`grid grid-cols-3 text-xs ${
                    idx % 2 === 0 ? "bg-gray-800" : "bg-gray-800/50"
                  }`}
                >
                  <div className="p-3 text-gray-300">{f.name}</div>
                  <div className="p-3 text-center text-gray-400">{f.free}</div>
                  <div className="p-3 text-center text-yellow-400 font-bold">
                    {f.premium}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <button
              onClick={handleUpgrade}
              className="w-full py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white font-bold rounded-lg transition text-lg"
            >
              🚀 Upgrade Sekarang
            </button>
            <p className="text-center text-xs text-gray-500">
              Pembayaran via QRIS, transfer bank, atau e-wallet
            </p>
          </div>

          {/* FAQ */}
          <div className="border-t border-gray-700 pt-4">
            <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">
              ❓ Pertanyaan Umum
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-bold text-yellow-400">
                  Apakah ini sekali bayar?
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Ya, sekali bayar untuk akses selamanya. Tidak ada biaya
                  bulanan.
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-yellow-400">
                  Bagaimana cara bayarnya?
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Akan tersedia QRIS, transfer bank, dan e-wallet (GoPay,
                  OVO, Dana).
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-yellow-400">
                  Apakah data saya aman?
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Data kamu tersimpan di server Supabase yang terenkripsi.
                  Kami tidak akan membagikan data ke pihak lain.
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-yellow-400">
                  Bisa refund?
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Bisa, dalam 7 hari pertama kalau tidak puas.
                </p>
              </div>
            </div>
          </div>

          {/* Back link */}
          <div className="text-center pt-2">
            <Link
              href="/"
              className="text-xs text-gray-500 hover:text-gray-300 underline"
              onClick={onClose}
            >
              ← Kembali ke Tracker
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}