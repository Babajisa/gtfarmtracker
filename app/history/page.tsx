"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// ========== TYPES ==========
type Harvest = {
  id: number;
  created_at: string;
  user_id: string;
  farm_name: string;
  harvested_at: string;
  planted_at: string;
  ances_level: number;
  has_ring: boolean;
  block_harvest: number;
  seed_harvest: number;
  seed_break: number;
  seed_to_plant: number;
  tm_count: number;
  hits_per_block: number;
};

const TABLE_NAME = "harvests";

// ========== FUNGSI ==========
function calculateHarvestResult(h: {
  block_harvest: number;
  seed_harvest: number;
  seed_break: number;
  seed_to_plant: number;
}) {
  const totalBlock = h.block_harvest;
  const totalSeed = h.seed_harvest + h.seed_break;
  const surplusSeed = totalSeed - h.seed_to_plant;
  return { totalBlock, totalSeed, surplusSeed };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRelativeTime(iso: string, now: number): string {
  const diff = now - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  if (days < 30) return `${days} hari lalu`;
  return `${Math.floor(days / 30)} bulan lalu`;
}

export default function HistoryPage() {
  const supabase = createClient();
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchHarvests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchHarvests() {
    setLoading(true);
    setErrorMsg(null);

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("*")
      .order("harvested_at", { ascending: false });

    if (error) {
      console.error("Error fetch harvests:", error);
      setErrorMsg(error.message);
    } else if (data) {
      setHarvests(data as Harvest[]);
    }
    setLoading(false);
  }

  async function handleDeleteHarvest(id: number) {
    if (!confirm("Hapus riwayat panen ini?")) return;

    const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id);

    if (error) {
      setErrorMsg(`Gagal menghapus: ${error.message}`);
      return;
    }
    fetchHarvests();
  }

  // ===== STATISTIK =====
  const [now, setNow] = useState<number>(0);
useEffect(() => {
  setNow(Date.now());
}, []);
  const weekAgo = now - 7 * 86400000;
  const monthAgo = now - 30 * 86400000;

  function sumSurplus(list: Harvest[]): number {
    return list.reduce(
      (s, h) => s + calculateHarvestResult(h).surplusSeed,
      0
    );
  }

  function sumBlock(list: Harvest[]): number {
    return list.reduce(
      (s, h) => s + calculateHarvestResult(h).totalBlock,
      0
    );
  }

  function sumSeed(list: Harvest[]): number {
    return list.reduce((s, h) => s + calculateHarvestResult(h).totalSeed, 0);
  }

  const harvestsThisWeek = harvests.filter(
    (h) => new Date(h.harvested_at).getTime() >= weekAgo
  );
  const harvestsThisMonth = harvests.filter(
    (h) => new Date(h.harvested_at).getTime() >= monthAgo
  );

  return (
    <main className="min-h-screen bg-gray-900 text-white p-4 md:p-8 font-mono">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="mb-8 border-b border-purple-500 pb-4 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-purple-400">
              📜 Riwayat Panen
            </h1>
            <p className="text-gray-400 mt-1 text-sm">
              {loading
                ? "Memuat..."
                : `${harvests.length} panen tercatat`}
            </p>
          </div>
          <Link
            href="/"
            className="px-3 py-1 text-xs bg-green-900/40 border border-green-700 hover:bg-green-800/60 rounded transition"
          >
            ← Tracker
          </Link>
        </header>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-900/40 border-2 border-red-600 rounded-lg flex justify-between items-start gap-3">
            <p className="text-sm text-red-200">{errorMsg}</p>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-red-300 hover:text-white font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* STATISTIK */}
        {harvests.length > 0 && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-purple-900/20 border-2 border-purple-700 rounded-lg">
              <p className="text-xs text-gray-400 uppercase">
                Minggu Ini (7 hari)
              </p>
              <p className="text-2xl font-bold text-purple-400 mt-1">
                {harvestsThisWeek.length}{" "}
                <span className="text-sm text-gray-500">panen</span>
              </p>
              <p className="text-sm text-green-400 mt-1">
                +{sumSurplus(harvestsThisWeek).toLocaleString("id-ID")} seed
              </p>
            </div>

            <div className="p-4 bg-blue-900/20 border-2 border-blue-700 rounded-lg">
              <p className="text-xs text-gray-400 uppercase">
                Bulan Ini (30 hari)
              </p>
              <p className="text-2xl font-bold text-blue-400 mt-1">
                {harvestsThisMonth.length}{" "}
                <span className="text-sm text-gray-500">panen</span>
              </p>
              <p className="text-sm text-green-400 mt-1">
                +{sumSurplus(harvestsThisMonth).toLocaleString("id-ID")} seed
              </p>
            </div>

            <div className="p-4 bg-emerald-900/20 border-2 border-emerald-700 rounded-lg">
              <p className="text-xs text-gray-400 uppercase">
                Total Sepanjang Waktu
              </p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">
                {harvests.length}{" "}
                <span className="text-sm text-gray-500">panen</span>
              </p>
              <p className="text-sm text-green-400 mt-1">
                +{sumSurplus(harvests).toLocaleString("id-ID")} seed
              </p>
            </div>
          </div>
        )}

        {/* LIST */}
        <div className="grid gap-3">
          {loading && (
            <p className="text-center text-gray-500 py-8">
              ⏳ Memuat riwayat...
            </p>
          )}

          {!loading && harvests.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              Belum ada riwayat panen. Panen farm dulu di tracker! 🌾
            </p>
          )}

          {harvests.map((h) => {
            const result = calculateHarvestResult(h);
            return (
              <div
                key={h.id}
                className="p-3 bg-gray-800 border border-gray-700 rounded-lg hover:border-purple-600 transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-purple-300">
                      🌾 {h.farm_name}
                    </h3>
                    <p className="text-xs text-gray-500">
                    {formatDate(h.harvested_at)} ·{" "}
                    {getRelativeTime(h.harvested_at, now)}   {/* ← tambah `now` */}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteHarvest(h.id)}
                    className="text-xs text-red-400 hover:text-red-300 underline"
                  >
                    Hapus
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs pt-2 border-t border-gray-700">
                  <div>
                    <p className="text-gray-500">Total Block</p>
                    <p className="font-bold text-yellow-400">
                      {result.totalBlock.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total Seed</p>
                    <p className="font-bold text-green-400">
                      {result.totalSeed.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Surplus</p>
                    <p
                      className={`font-bold ${
                        result.surplusSeed >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {result.surplusSeed >= 0 ? "+" : ""}
                      {result.surplusSeed.toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}