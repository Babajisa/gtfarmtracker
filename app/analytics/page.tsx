"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getProfile, type Profile } from "@/lib/premium";
import { createClient } from "@/lib/supabase/client";
import UpgradeModal from "@/components/UpgradeModal";

// ========== TYPES ==========
type Farm = {
  id: number;
  block_harvest: number;
  seed_harvest: number;
  seed_break: number;
  seed_to_plant: number;
  ances_level: number;
  has_ring: boolean;
};

// ========== KONSTANTA ==========
const BASE_GROW_MS = (3 * 86400 + 15 * 3600 + 54 * 60 + 32) * 1000;
const ANCES_REDUCTION_PER_LEVEL = 0.02;
const RING_OF_NATURE_REDUCTION = 0.02;
const MAX_ANCES_LEVEL = 6;
const TABLE_NAME = "farms_new";

function calculateGrowMs(ancesLevel: number, hasRing: boolean): number {
  const ancesReduction =
    Math.min(ancesLevel, MAX_ANCES_LEVEL) * ANCES_REDUCTION_PER_LEVEL;
  const ringReduction = hasRing ? RING_OF_NATURE_REDUCTION : 0;
  const totalReduction = ancesReduction + ringReduction;
  return BASE_GROW_MS * (1 - totalReduction);
}

function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="relative group inline-block ml-1 cursor-help">
      <span className="text-gray-500 hover:text-gray-300 text-xs">ⓘ</span>
      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black border border-gray-600 rounded text-xs text-gray-200 w-64 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
        {text}
      </span>
    </span>
  );
}

export default function AnalyticsPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Kalkulator 1
  const [seedPerFarm, setSeedPerFarm] = useState(2646);
  const [seedAmount, setSeedAmount] = useState(200);
  const [seedWl, setSeedWl] = useState(190);
  const [blockHarvest, setBlockHarvest] = useState(11020);
  const [seedHarvest, setSeedHarvest] = useState(125);
  const [seedBreak, setSeedBreak] = useState(3040);
  const [marketSeedAmt, setMarketSeedAmt] = useState(200);
  const [marketSeedWl, setMarketSeedWl] = useState(190);
  const [tmCount, setTmCount] = useState(40);
  const [hitsPerBlock, setHitsPerBlock] = useState(5);

  // Kalkulator 2
  const [farmCount, setFarmCount] = useState(1);
  const [surplusPerFarm, setSurplusPerFarm] = useState(520);
  const [cyclesPerMonth, setCyclesPerMonth] = useState(7.5);
  const [longMarketSeedAmt, setLongMarketSeedAmt] = useState(200);
  const [longMarketSeedWl, setLongMarketSeedWl] = useState(190);

  const [autoFillMessage, setAutoFillMessage] = useState<string | null>(null);
  const [loadingFarms, setLoadingFarms] = useState(false);

  useEffect(() => {
    async function check() {
      const p = await getProfile();
      setProfile(p);
      setLoading(false);
    }
    check();
  }, []);

  // ===== KALKULASI 1 =====
  const rateSeedPerWl = seedAmount > 0 ? seedWl / seedAmount : 0.95;
  const totalModalDl = (seedPerFarm * rateSeedPerWl) / 100;
  const totalAccSeed = seedHarvest + seedBreak;
  const surplusSeed = totalAccSeed - seedPerFarm;
  const wlPerSeed = marketSeedAmt > 0 ? marketSeedWl / marketSeedAmt : 0.95;
  const profitWl = surplusSeed * wlPerSeed;
  const profitDl = profitWl / 100;
  const gemsPerTM = tmCount > 0 ? (blockHarvest * hitsPerBlock) / tmCount : 0;

  // ===== KALKULASI 2 =====
  const longWlPerSeed =
    longMarketSeedAmt > 0 ? longMarketSeedWl / longMarketSeedAmt : 0.95;

  const totalSurplusPerCycle = surplusPerFarm * farmCount;
  const profitWlPerCycle = totalSurplusPerCycle * longWlPerSeed;
  const profitDlPerCycle = profitWlPerCycle / 100;

  const daysPerCycle = cyclesPerMonth > 0 ? 30 / cyclesPerMonth : 4;
  const cyclesPerWeek = 7 / daysPerCycle;

  const profitWlPerDay = profitWlPerCycle / daysPerCycle;
  const profitWlPerWeek = profitWlPerDay * 7;
  const profitWlPerMonth = profitWlPerCycle * cyclesPerMonth;

  const profitDlPerDay = profitWlPerDay / 100;
  const profitDlPerWeek = profitWlPerWeek / 100;
  const profitDlPerMonth = profitWlPerMonth / 100;

  // ===== AUTO-FILL =====
  async function handleAutoFill() {
    setLoadingFarms(true);
    setAutoFillMessage(null);

    const { data, error } = await supabase.from(TABLE_NAME).select("*");

    if (error) {
      setAutoFillMessage(`❌ Error: ${error.message}`);
      setLoadingFarms(false);
      return;
    }

    if (!data || data.length === 0) {
      setAutoFillMessage("⚠️ Tidak ada farm di tracker. Tambah farm dulu!");
      setLoadingFarms(false);
      return;
    }

    const typedFarms = data as Farm[];

    let totalSurplus = 0;
    let totalGrowMs = 0;

    typedFarms.forEach((farm) => {
      const seedTotal = farm.seed_harvest + farm.seed_break;
      const surplus = seedTotal - farm.seed_to_plant;
      totalSurplus += surplus;
      totalGrowMs += calculateGrowMs(farm.ances_level, farm.has_ring);
    });

    const avgSurplus = totalSurplus / typedFarms.length;
    const avgGrowMs = totalGrowMs / typedFarms.length;

    const monthMs = 30 * 86400 * 1000;
    const cycles = monthMs / avgGrowMs;

    setFarmCount(typedFarms.length);
    setSurplusPerFarm(Math.round(avgSurplus));
    setCyclesPerMonth(Number(cycles.toFixed(2)));
    setLongMarketSeedAmt(marketSeedAmt);
    setLongMarketSeedWl(marketSeedWl);

    setAutoFillMessage(
      `✅ Auto-fill dari ${typedFarms.length} farm — surplus rata-rata ${Math.round(
        avgSurplus
      )} seed/farm, siklus ${cycles.toFixed(2)}×/bulan`
    );
    setLoadingFarms(false);
  }

  // ===== LOADING =====
  if (loading) {
    return (
      <main className="min-h-screen bg-gray-900 text-white p-8 font-mono flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </main>
    );
  }

  // ===== GATE PREMIUM =====
  if (!profile?.is_premium) {
    return (
      <main className="min-h-screen bg-gray-900 text-white p-4 md:p-8 font-mono">
        <div className="max-w-md mx-auto text-center py-20">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-yellow-400 mb-2">
            Fitur Premium
          </h1>
          <p className="text-gray-400 mb-6">
            Analisis profit hanya tersedia untuk member premium.
          </p>
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white font-bold rounded-lg transition"
          >
            ⭐ Lihat Detail Premium
          </button>
          <div>
            <Link
              href="/"
              className="inline-block mt-6 text-green-400 hover:text-green-300 underline text-sm"
            >
              ← Kembali ke Tracker
            </Link>
          </div>
        </div>

        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
        />
      </main>
    );
  }

  const maxProfit = Math.max(
    profitWlPerDay,
    profitWlPerWeek,
    profitWlPerMonth
  );

  return (
    <main className="min-h-screen bg-gray-900 text-white p-4 md:p-8 font-mono">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 border-b border-yellow-500 pb-4 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-yellow-400">
              📊 Analytics
            </h1>
            <p className="text-gray-400 mt-1 text-sm">
              Kalkulator profit looming premium
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 text-xs bg-yellow-900/40 border border-yellow-700 rounded">
              ⭐ Premium
            </span>
            <Link
              href="/"
              className="px-3 py-1 text-xs bg-green-900/40 border border-green-700 hover:bg-green-800/60 rounded transition"
            >
              ← Tracker
            </Link>
          </div>
        </header>

        {/* KALKULATOR 1 */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-emerald-400 mb-4 flex items-center">
            🌾 Kalkulator Profit per Farm
            <InfoTooltip text="Hitung profit dari 1 kali panen 1 farm. Cocok untuk tahu nilai per siklus." />
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-bold text-emerald-400 mb-3">
                  🛠️ Modal & Persiapan
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Seed per Farm
                    </label>
                    <input
                      type="number"
                      value={seedPerFarm}
                      onChange={(e) => setSeedPerFarm(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-600 focus:border-green-500 outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Rate Seed / WL
                    </label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        value={seedAmount}
                        onChange={(e) => setSeedAmount(Number(e.target.value))}
                        className="w-1/2 px-2 py-2 rounded bg-gray-900 border border-gray-600 focus:border-green-500 outline-none text-center"
                      />
                      <input
                        type="number"
                        value={seedWl}
                        onChange={(e) => setSeedWl(Number(e.target.value))}
                        className="w-1/2 px-2 py-2 rounded bg-gray-900 border border-gray-600 focus:border-green-500 outline-none text-center"
                      />
                    </div>
                  </div>
                  <div className="bg-gray-900 rounded p-2 border border-emerald-700/50 text-center">
                    <p className="text-xs text-gray-400 mb-1">Total Modal</p>
                    <p className="text-xl font-bold text-yellow-400">
                      {totalModalDl.toFixed(2)} DL
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-bold text-emerald-400 mb-3">
                  🌾 Hasil Panen & Break
                </h3>
                <p className="text-xs text-emerald-400 mb-2">
                  Dari Panen Pohon
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Block Harvest
                    </label>
                    <input
                      type="number"
                      value={blockHarvest}
                      onChange={(e) => setBlockHarvest(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-600 focus:border-green-500 outline-none font-bold text-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Seed Harvest
                    </label>
                    <input
                      type="number"
                      value={seedHarvest}
                      onChange={(e) => setSeedHarvest(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-600 focus:border-green-500 outline-none font-bold text-emerald-400"
                    />
                  </div>
                </div>
                <p className="text-xs text-amber-400 mb-2">
                  Dari Break Block (pakai TM)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Seed Break
                    </label>
                    <input
                      type="number"
                      value={seedBreak}
                      onChange={(e) => setSeedBreak(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-600 focus:border-green-500 outline-none font-bold text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Rate Pasar Seed
                    </label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        value={marketSeedAmt}
                        onChange={(e) =>
                          setMarketSeedAmt(Number(e.target.value))
                        }
                        className="w-1/2 px-2 py-2 rounded bg-gray-900 border border-gray-600 focus:border-green-500 outline-none text-center"
                      />
                      <input
                        type="number"
                        value={marketSeedWl}
                        onChange={(e) =>
                          setMarketSeedWl(Number(e.target.value))
                        }
                        className="w-1/2 px-2 py-2 rounded bg-gray-900 border border-gray-600 focus:border-green-500 outline-none text-center"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-bold text-purple-400 mb-3">
                  💎 TM & Rotasi
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Jumlah TM
                    </label>
                    <input
                      type="number"
                      value={tmCount}
                      onChange={(e) => setTmCount(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-600 focus:border-green-500 outline-none font-bold text-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Hits per Block
                    </label>
                    <input
                      type="number"
                      value={hitsPerBlock}
                      onChange={(e) => setHitsPerBlock(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-600 focus:border-green-500 outline-none font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 border-2 border-emerald-700 rounded-lg p-4 h-fit lg:sticky lg:top-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-gray-700 pb-2 mb-4">
                📊 Rincian per Siklus
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Seed Panen:</span>
                  <span className="font-bold text-emerald-400">
                    +{seedHarvest.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Seed Break:</span>
                  <span className="font-bold text-white">
                    +{seedBreak.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-700 pt-2 font-bold">
                  <span className="text-gray-200">Total Seed:</span>
                  <span className="text-emerald-400">
                    {totalAccSeed.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between text-red-400">
                  <span>Modal Tanam:</span>
                  <span className="font-bold">
                    −{seedPerFarm.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-700 pt-2 font-bold">
                  <span className="text-yellow-400">Surplus:</span>
                  <span className="text-yellow-400">
                    {surplusSeed >= 0 ? "+" : ""}
                    {surplusSeed.toLocaleString("id-ID")} seed
                  </span>
                </div>
                <div className="mt-4 p-3 bg-gray-900 rounded border border-emerald-700/50 text-center">
                  <p className="text-xs text-gray-400 uppercase">
                    Nilai Surplus
                  </p>
                  <p className="text-2xl font-bold text-emerald-400">
                    {profitWl.toFixed(1)} WL
                  </p>
                  <p className="text-xs text-gray-500">
                    ≈ {profitDl.toFixed(2)} DL
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Gems per TM:</span>
                    <span className="font-bold text-purple-400">
                      {Math.round(gemsPerTM).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-gray-400">Total Gems:</span>
                    <span className="font-bold text-red-400">
                      {(blockHarvest * hitsPerBlock).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KALKULATOR 2 */}
        <div className="border-t-2 border-purple-700 pt-8">
          <h2 className="text-xl font-bold text-purple-400 mb-4 flex items-center">
            📅 Estimasi Profit Jangka Panjang
            <InfoTooltip text="Simulasi profit dari semua farm kamu, dihitung berdasarkan siklus panen per bulan." />
          </h2>

          <div className="mb-6 p-4 bg-purple-900/20 border border-purple-700 rounded-lg">
            <p className="text-xs text-purple-200 leading-relaxed">
              💡 <strong>Cara baca:</strong>{" "}
              <span className="text-emerald-300">1 siklus</span> = 1× tanam →
              panen. Kalau waktu tumbuh 3,2 hari, maka dalam 30 hari kamu panen{" "}
              <strong>~9,4×</strong>.
            </p>
          </div>

          <div className="mb-6 p-4 bg-purple-900/20 border border-purple-700 rounded-lg">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-purple-300">
                  ⚡ Auto-Fill dari Tracker
                </p>
                <p className="text-xs text-gray-400">
                  Isi otomatis dari farm di tracker kamu
                </p>
              </div>
              <button
                onClick={handleAutoFill}
                disabled={loadingFarms}
                className={`px-4 py-2 rounded font-semibold text-sm transition ${
                  loadingFarms
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-500"
                }`}
              >
                {loadingFarms ? "Memuat..." : "🔄 Pakai Data dari Tracker"}
              </button>
            </div>
            {autoFillMessage && (
              <p className="text-xs mt-3 text-gray-300">{autoFillMessage}</p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-bold text-purple-400 mb-3">
                  📋 Parameter
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Jumlah Farm
                    </label>
                    <input
                      type="number"
                      value={farmCount}
                      onChange={(e) => setFarmCount(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-600 focus:border-purple-500 outline-none font-bold text-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Surplus per Farm (seed)
                    </label>
                    <input
                      type="number"
                      value={surplusPerFarm}
                      onChange={(e) =>
                        setSurplusPerFarm(Number(e.target.value))
                      }
                      className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-600 focus:border-purple-500 outline-none font-bold text-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1 flex items-center">
                      Siklus Panen per Bulan
                      <InfoTooltip text="Berapa kali kamu panen dalam 30 hari. Contoh: kalau waktu tumbuh 4 hari, maka ~7,5 siklus/bulan." />
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={cyclesPerMonth}
                      onChange={(e) =>
                        setCyclesPerMonth(Number(e.target.value))
                      }
                      className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-600 focus:border-purple-500 outline-none font-bold text-emerald-400"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">
                      Contoh: 7,5 (tanpa ances) · 9,4 (ances Lv5)
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Rate Pasar Seed
                    </label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        value={longMarketSeedAmt}
                        onChange={(e) =>
                          setLongMarketSeedAmt(Number(e.target.value))
                        }
                        className="w-1/2 px-2 py-2 rounded bg-gray-900 border border-gray-600 focus:border-purple-500 outline-none text-center"
                      />
                      <input
                        type="number"
                        value={longMarketSeedWl}
                        onChange={(e) =>
                          setLongMarketSeedWl(Number(e.target.value))
                        }
                        className="w-1/2 px-2 py-2 rounded bg-gray-900 border border-gray-600 focus:border-purple-500 outline-none text-center"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-bold text-purple-400 mb-3">
                  📈 Visualisasi Profit
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">
                        Harian
                        <InfoTooltip text="Profit per hari." />
                      </span>
                      <span className="text-emerald-400 font-bold">
                        {profitWlPerDay.toFixed(1)} WL ·{" "}
                        {profitDlPerDay.toFixed(2)} DL
                      </span>
                    </div>
                    <div className="bg-gray-900 rounded h-4 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full transition-all"
                        style={{
                          width: `${
                            maxProfit > 0
                              ? (profitWlPerDay / maxProfit) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">
                        Mingguan (7 hari)
                        <InfoTooltip text="Profit per 7 hari." />
                      </span>
                      <span className="text-blue-400 font-bold">
                        {profitWlPerWeek.toFixed(1)} WL ·{" "}
                        {profitDlPerWeek.toFixed(2)} DL
                      </span>
                    </div>
                    <div className="bg-gray-900 rounded h-4 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full transition-all"
                        style={{
                          width: `${
                            maxProfit > 0
                              ? (profitWlPerWeek / maxProfit) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">
                        Bulanan (30 hari)
                        <InfoTooltip text="Profit per 30 hari." />
                      </span>
                      <span className="text-yellow-400 font-bold">
                        {profitWlPerMonth.toFixed(1)} WL ·{" "}
                        {profitDlPerMonth.toFixed(2)} DL
                      </span>
                    </div>
                    <div className="bg-gray-900 rounded h-4 overflow-hidden">
                      <div
                        className="bg-yellow-600 h-full transition-all"
                        style={{
                          width: `${
                            maxProfit > 0
                              ? (profitWlPerMonth / maxProfit) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 border-2 border-purple-700 rounded-lg p-4 h-fit lg:sticky lg:top-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-gray-700 pb-2 mb-4">
                💰 Rincian Profit
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Surplus / Siklus</span>
                  <span className="font-bold text-emerald-400">
                    +{totalSurplusPerCycle.toLocaleString("id-ID")} seed
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Hari / Siklus</span>
                  <span className="font-bold text-white">
                    {daysPerCycle.toFixed(2)} hari
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Siklus / Minggu</span>
                  <span className="font-bold text-white">
                    {cyclesPerWeek.toFixed(2)}×
                  </span>
                </div>
                <div className="border-t border-gray-700 pt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Profit / Siklus</span>
                    <span className="font-bold text-purple-400">
                      {profitDlPerCycle.toFixed(2)} DL
                    </span>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="p-3 bg-gray-900 rounded border border-emerald-700/50">
                    <p className="text-xs text-gray-400 uppercase">
                      Profit Harian
                    </p>
                    <p className="text-xl font-bold text-emerald-400">
                      {profitDlPerDay.toFixed(2)} DL
                    </p>
                    <p className="text-xs text-gray-500">
                      = {profitWlPerDay.toFixed(1)} WL
                    </p>
                  </div>
                  <div className="p-3 bg-gray-900 rounded border border-blue-700/50">
                    <p className="text-xs text-gray-400 uppercase">
                      Profit Mingguan
                    </p>
                    <p className="text-xl font-bold text-blue-400">
                      {profitDlPerWeek.toFixed(2)} DL
                    </p>
                    <p className="text-xs text-gray-500">
                      = {profitWlPerWeek.toFixed(1)} WL
                    </p>
                  </div>
                  <div className="p-3 bg-gray-900 rounded border border-yellow-700/50">
                    <p className="text-xs text-gray-400 uppercase">
                      Profit Bulanan
                    </p>
                    <p className="text-2xl font-bold text-yellow-400">
                      {profitDlPerMonth.toFixed(2)} DL
                    </p>
                    <p className="text-xs text-gray-500">
                      = {profitWlPerMonth.toFixed(1)} WL
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}