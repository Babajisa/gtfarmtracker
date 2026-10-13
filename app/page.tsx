"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/auth";
import { getProfile, type Profile } from "@/lib/premium";
import UpgradeModal from "@/components/UpgradeModal";

// ========== TYPES ==========
type Farm = {
  id: number;
  created_at: string;
  user_id: string;
  name: string;
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

// ========== KONSTANTA ==========
const BASE_GROW_MS = (3 * 86400 + 15 * 3600 + 54 * 60 + 32) * 1000;
const ANCES_REDUCTION_PER_LEVEL = 0.02;
const RING_OF_NATURE_REDUCTION = 0.02;
const MAX_ANCES_LEVEL = 6;
const DEFAULT_SEED_TO_PLANT = 2645;
const DEFAULT_TM_COUNT = 40;
const DEFAULT_HITS_PER_BLOCK = 5;
const TABLE_NAME = "farms_new";
const HARVEST_TABLE = "harvests";

// ========== FUNGSI WAKTU ==========
function calculateHarvestTime(
  plantedAt: string,
  ancesLevel: number,
  hasRing: boolean
): number {
  const plantedMs = new Date(plantedAt).getTime();
  const ancesReduction =
    Math.min(ancesLevel, MAX_ANCES_LEVEL) * ANCES_REDUCTION_PER_LEVEL;
  const ringReduction = hasRing ? RING_OF_NATURE_REDUCTION : 0;
  const totalReduction = ancesReduction + ringReduction;
  const growMs = BASE_GROW_MS * (1 - totalReduction);
  return plantedMs + growMs;
}

function formatTimeLeft(ms: number): string {
  if (ms <= 0) return "SIAP PANEN";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}h`);
  if (hours > 0 || days > 0) parts.push(`${hours}j`);
  if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}d`);
  return parts.join(" ");
}

function calculateHarvestResult(farm: {
  block_harvest: number;
  seed_harvest: number;
  seed_break: number;
  seed_to_plant: number;
}) {
  const totalBlock = farm.block_harvest;
  const totalSeed = farm.seed_harvest + farm.seed_break;
  const surplusSeed = totalSeed - farm.seed_to_plant;
  return { totalBlock, totalSeed, surplusSeed };
}

function calculateTMCost(
  blocks: number,
  tmCount: number,
  hitsPerBlock: number
) {
  const totalHits = blocks * hitsPerBlock;
  const gemsPerTM = tmCount > 0 ? totalHits / tmCount : 0;
  return {
    totalHits,
    gemsPerTM: Math.round(gemsPerTM),
    totalGems: totalHits,
  };
}

// ========== COMPONENT ==========
export default function Home() {
  const router = useRouter();
  const supabase = createClient();

  const [farms, setFarms] = useState<Farm[]>([]);
  const [now, setNow] = useState<number>(0);
  const [maxFarms, setMaxFarms] = useState(21);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Notifikasi
  const [notifPermission, setNotifPermission] =
    useState<NotificationPermission>("default");
  const [notifSupported, setNotifSupported] = useState(false);
  const [notifiedFarms, setNotifiedFarms] = useState<Set<number>>(new Set());

  // Form
  const [name, setName] = useState("");
  const [plantedAt, setPlantedAt] = useState("");
  const [ancesLevel, setAncesLevel] = useState(0);
  const [hasRing, setHasRing] = useState(false);
  const [blockHarvest, setBlockHarvest] = useState(0);
  const [seedHarvest, setSeedHarvest] = useState(0);
  const [seedBreak, setSeedBreak] = useState(0);
  const [seedToPlant, setSeedToPlant] = useState(DEFAULT_SEED_TO_PLANT);
  const [tmCount, setTmCount] = useState(DEFAULT_TM_COUNT);
  const [hitsPerBlock, setHitsPerBlock] = useState(DEFAULT_HITS_PER_BLOCK);

  // Timer
  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Cek support notifikasi
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifSupported(true);
      setNotifPermission(Notification.permission);
    }
  }, []);

  // Init
  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email || "");
      const p = await getProfile();
      setProfile(p);
      await fetchFarms();
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Notifikasi saat farm ready
  useEffect(() => {
    if (!notifSupported || notifPermission !== "granted") return;
    if (now === 0) return;

    farms.forEach((farm) => {
      const harvestTime = calculateHarvestTime(
        farm.planted_at,
        farm.ances_level,
        farm.has_ring
      );
      const isReady = now >= harvestTime;

      if (isReady && !notifiedFarms.has(farm.id)) {
        new Notification("🌾 Farm Siap Panen!", {
          body: `${farm.name} sudah siap dipanen!`,
          icon: "/favicon.ico",
          tag: `farm-${farm.id}`,
        });
        setNotifiedFarms((prev) => new Set(prev).add(farm.id));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, farms, notifPermission, notifSupported]);

  async function fetchFarms() {
    setLoading(true);
    setErrorMsg(null);
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetch farms:", error);
      setErrorMsg(
        `${error.message || "Unknown error"} (code: ${error.code || "?"})`
      );
    } else if (data) {
      setFarms(data as Farm[]);
    }
    setLoading(false);
  }

  async function handleAddFarm(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !plantedAt) {
      alert("Nama farm dan waktu tanam wajib diisi!");
      return;
    }
    if (farms.length >= maxFarms) {
      alert(`Sudah mencapai batas ${maxFarms} farm!`);
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      setErrorMsg("Session habis, silakan login ulang.");
      return;
    }

    const { error } = await supabase.from(TABLE_NAME).insert({
      user_id: user.id,
      name,
      planted_at: new Date(plantedAt).toISOString(),
      ances_level: ancesLevel,
      has_ring: hasRing,
      block_harvest: blockHarvest,
      seed_harvest: seedHarvest,
      seed_break: seedBreak,
      seed_to_plant: seedToPlant,
      tm_count: tmCount,
      hits_per_block: hitsPerBlock,
    });

    setSaving(false);

    if (error) {
      console.error("Error insert:", error);
      setErrorMsg(
        `Gagal menyimpan: ${error.message} (code: ${error.code || "?"})`
      );
      return;
    }

    setName("");
    setPlantedAt("");
    setAncesLevel(0);
    setHasRing(false);
    setBlockHarvest(0);
    setSeedHarvest(0);
    setSeedBreak(0);
    setSeedToPlant(DEFAULT_SEED_TO_PLANT);
    setTmCount(DEFAULT_TM_COUNT);
    setHitsPerBlock(DEFAULT_HITS_PER_BLOCK);

    fetchFarms();
  }

  async function handleDelete(id: number) {
    if (!confirm("Yakin mau hapus farm ini? (Data tidak masuk riwayat)")) return;

    const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id);

    if (error) {
      console.error("Error delete:", error);
      setErrorMsg(`Gagal menghapus: ${error.message}`);
      return;
    }
    fetchFarms();
  }

  async function handleHarvest(farm: Farm) {
    if (
      !confirm(
        `Panen farm "${farm.name}"?\n\nData akan dipindah ke riwayat, dan farm ini dihapus dari tracker.`
      )
    )
      return;

    setErrorMsg(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErrorMsg("Session habis, silakan login ulang.");
      return;
    }

    const { error: insertError } = await supabase.from(HARVEST_TABLE).insert({
      user_id: user.id,
      farm_name: farm.name,
      harvested_at: new Date().toISOString(),
      planted_at: farm.planted_at,
      ances_level: farm.ances_level,
      has_ring: farm.has_ring,
      block_harvest: farm.block_harvest,
      seed_harvest: farm.seed_harvest,
      seed_break: farm.seed_break,
      seed_to_plant: farm.seed_to_plant,
      tm_count: farm.tm_count,
      hits_per_block: farm.hits_per_block,
    });

    if (insertError) {
      console.error("Error insert harvest:", insertError);
      setErrorMsg(`Gagal menyimpan riwayat: ${insertError.message}`);
      return;
    }

    const { error: deleteError } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq("id", farm.id);

    if (deleteError) {
      console.error("Error delete farm:", deleteError);
      setErrorMsg(`Gagal menghapus farm: ${deleteError.message}`);
      return;
    }

    setNotifiedFarms((prev) => {
      const next = new Set(prev);
      next.delete(farm.id);
      return next;
    });

    fetchFarms();
  }

  async function handleLogout() {
    if (!confirm("Yakin mau logout?")) return;
    await signOut();
    router.push("/login");
    router.refresh();
  }

  async function handleRequestNotif() {
    if (!notifSupported) {
      alert("Browser kamu tidak support notifikasi.");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);

    if (permission === "granted") {
      new Notification("🔔 Notifikasi Aktif!", {
        body: "Kamu akan diberitahu saat farm siap panen.",
        icon: "/favicon.ico",
      });
    } else if (permission === "denied") {
      alert(
        "Notifikasi diblokir. Buka pengaturan browser → Site Settings → Notifications → Allow."
      );
    }
  }

  function handleTestNotif() {
    if (notifPermission !== "granted") {
      alert("Aktifkan notifikasi dulu!");
      return;
    }
    new Notification("🔔 Test Notifikasi", {
      body: "Ini contoh notifikasi saat farm siap panen.",
      icon: "/favicon.ico",
    });
  }

  const previewHarvest = calculateHarvestResult({
    block_harvest: blockHarvest,
    seed_harvest: seedHarvest,
    seed_break: seedBreak,
    seed_to_plant: seedToPlant,
  });
  const previewTM = calculateTMCost(blockHarvest, tmCount, hitsPerBlock);

  const totals = farms.reduce(
    (acc, f) => {
      const h = calculateHarvestResult(f);
      const t = calculateTMCost(h.totalBlock, f.tm_count, f.hits_per_block);
      acc.blocks += h.totalBlock;
      acc.seed += h.totalSeed;
      acc.surplus += h.surplusSeed;
      acc.gems += t.totalGems;
      return acc;
    },
    { blocks: 0, seed: 0, surplus: 0, gems: 0 }
  );

  return (
    <main className="min-h-screen bg-gray-900 text-white p-4 md:p-8 font-mono">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 border-b border-green-500 pb-4 flex flex-wrap justify-between items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold text-green-400">
              🌱 Growtopia Farm Tracker
            </h1>
            <p className="text-gray-400 mt-1 text-sm">
              {loading
                ? "Memuat data..."
                : `Kelola ${farms.length} / ${maxFarms} farm looming kamu`}
            </p>
            {userEmail && (
              <p className="text-gray-500 text-xs mt-1">
                Login sebagai:{" "}
                <span className="text-green-400">{userEmail}</span>
                {profile?.is_premium && (
                  <span className="ml-2 px-2 py-0.5 text-[10px] bg-yellow-900/60 border border-yellow-600 rounded text-yellow-300">
                    ⭐ PREMIUM
                  </span>
                )}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400">Max Farm:</label>
              <input
                type="number"
                min={1}
                value={maxFarms}
                onChange={(e) => setMaxFarms(Number(e.target.value))}
                className="w-20 px-2 py-1 rounded bg-gray-900 border border-gray-600 focus:border-green-500 outline-none text-center"
              />
            </div>

            {notifSupported &&
              (notifPermission === "granted" ? (
                <button
                  onClick={handleTestNotif}
                  className="px-3 py-1 text-xs bg-green-900/40 border border-green-700 hover:bg-green-800/60 rounded transition"
                  title="Klik untuk test notifikasi"
                >
                  🔔 Notif Aktif
                </button>
              ) : (
                <button
                  onClick={handleRequestNotif}
                  className="px-3 py-1 text-xs bg-blue-900/40 border border-blue-700 hover:bg-blue-800/60 rounded transition"
                  title="Aktifkan notifikasi browser"
                >
                  🔕 Aktifkan Notif
                </button>
              ))}

            {profile?.is_premium ? (
              <Link
                href="/analytics"
                className="px-3 py-1 text-xs bg-yellow-900/40 border border-yellow-700 hover:bg-yellow-800/60 rounded transition"
              >
                📊 Analytics
              </Link>
            ) : (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="px-3 py-1 text-xs bg-gray-700/60 border border-gray-600 hover:bg-gray-600/60 rounded transition"
                title="Premium feature"
              >
                📊 Analytics 🔒
              </button>
            )}

            <Link
              href="/history"
              className="px-3 py-1 text-xs bg-purple-900/40 border border-purple-700 hover:bg-purple-800/60 rounded transition"
            >
              📜 History
            </Link>
            <button
              onClick={handleLogout}
              className="px-3 py-1 text-xs bg-red-900/40 border border-red-700 hover:bg-red-800/60 rounded transition"
            >
              🚪 Logout
            </button>
          </div>
        </header>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-900/40 border-2 border-red-600 rounded-lg flex justify-between items-start gap-3">
            <div>
              <p className="font-bold text-red-300 mb-1">⚠️ Error</p>
              <p className="text-sm text-red-200 break-all">{errorMsg}</p>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-red-300 hover:text-white font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* FORM */}
        <form
          onSubmit={handleAddFarm}
          className="mb-8 p-5 bg-gray-800 rounded-lg border border-gray-700 grid gap-4"
        >
          <h2 className="text-lg font-semibold text-green-400">
            ➕ Tambah Farm Baru
          </h2>

          <div className="border border-gray-700 rounded p-3">
            <h3 className="text-sm font-bold text-yellow-400 mb-2">
              ⏱️ Waktu
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Nama Farm
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Farm Looming A"
                  className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-600 focus:border-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Waktu Tanam
                </label>
                <input
                  type="datetime-local"
                  value={plantedAt}
                  onChange={(e) => setPlantedAt(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-600 focus:border-green-500 outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Level Ances (0-6)
                </label>
                <input
                  type="number"
                  min={0}
                  max={6}
                  value={ancesLevel}
                  onChange={(e) =>
                    setAncesLevel(
                      Math.min(6, Math.max(0, Number(e.target.value)))
                    )
                  }
                  className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-600 focus:border-green-500 outline-none"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-300 self-end pb-2">
                <input
                  type="checkbox"
                  checked={hasRing}
                  onChange={(e) => setHasRing(e.target.checked)}
                  className="w-4 h-4 accent-green-500"
                />
                Pakai Ring of Nature
              </label>
            </div>
          </div>

          <div className="border border-gray-700 rounded p-3">
            <h3 className="text-sm font-bold text-green-400 mb-2">
              🌾 Hasil Panen
            </h3>
            <p className="text-xs text-emerald-400 mb-1">
              Hasil Panen Pohon
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Block Harvest
                </label>
                <input
                  type="number"
                  min={0}
                  value={blockHarvest || ""}
                  onChange={(e) => setBlockHarvest(Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-600 focus:border-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Seed Harvest
                </label>
                <input
                  type="number"
                  min={0}
                  value={seedHarvest || ""}
                  onChange={(e) => setSeedHarvest(Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-600 focus:border-green-500 outline-none"
                />
              </div>
            </div>
            <p className="text-xs text-amber-400 mb-1">
              Hasil Break Block (pakai TM)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Seed Break
                </label>
                <input
                  type="number"
                  min={0}
                  value={seedBreak || ""}
                  onChange={(e) => setSeedBreak(Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-600 focus:border-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Modal Tanam (seed)
                </label>
                <input
                  type="number"
                  min={0}
                  value={seedToPlant || ""}
                  onChange={(e) => setSeedToPlant(Number(e.target.value))}
                  placeholder="2645"
                  className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-600 focus:border-green-500 outline-none"
                />
              </div>
            </div>
            <div className="bg-gray-900 rounded p-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-gray-500 text-xs">Total Block</p>
                <p className="text-yellow-400 font-bold">
                  {previewHarvest.totalBlock.toLocaleString("id-ID")}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Total Seed</p>
                <p className="text-green-400 font-bold">
                  {previewHarvest.totalSeed.toLocaleString("id-ID")}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Surplus Seed</p>
                <p
                  className={`font-bold ${
                    previewHarvest.surplusSeed >= 0
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {previewHarvest.surplusSeed >= 0 ? "+" : ""}
                  {previewHarvest.surplusSeed.toLocaleString("id-ID")}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Gems per TM</p>
                <p className="text-purple-400 font-bold">
                  {previewTM.gemsPerTM.toLocaleString("id-ID")}
                </p>
              </div>
            </div>
          </div>

          <div className="border border-gray-700 rounded p-3">
            <h3 className="text-sm font-bold text-purple-400 mb-2">
              💎 Biaya TM
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Jumlah TM
                </label>
                <input
                  type="number"
                  min={1}
                  value={tmCount}
                  onChange={(e) => setTmCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-600 focus:border-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Hits/Block
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={hitsPerBlock}
                  onChange={(e) => setHitsPerBlock(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-600 focus:border-green-500 outline-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={farms.length >= maxFarms || saving}
            className={`px-4 py-2 rounded font-semibold transition ${
              farms.length >= maxFarms || saving
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-500"
            }`}
          >
            {saving
              ? "Menyimpan..."
              : farms.length >= maxFarms
                ? `Batas ${maxFarms} Farm Tercapai`
                : "Tambah Farm"}
          </button>
        </form>

        {/* DAFTAR FARM */}
        <div className="grid gap-4">
          {loading && (
            <p className="text-center text-gray-500 py-8">
              ⏳ Memuat data dari database...
            </p>
          )}

          {!loading && farms.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              Belum ada farm. Tambah dulu di atas! 🌾
            </p>
          )}

          {farms.map((farm) => {
            const harvestTime = calculateHarvestTime(
              farm.planted_at,
              farm.ances_level,
              farm.has_ring
            );
            const timeLeft = harvestTime - now;
            const isReady = now > 0 && timeLeft <= 0;
            const harvestResult = calculateHarvestResult(farm);
            const tmResult = calculateTMCost(
              harvestResult.totalBlock,
              farm.tm_count,
              farm.hits_per_block
            );

            return (
              <div
                key={farm.id}
                className={`p-4 rounded-lg border-2 ${
                  isReady
                    ? "border-yellow-400 bg-yellow-900/30 animate-pulse"
                    : "border-green-800 bg-gray-800"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h2 className="text-lg font-semibold">{farm.name}</h2>
                    <p className="text-xs text-gray-500">
                      Ances Lv {farm.ances_level} | Ring:{" "}
                      {farm.has_ring ? "✅" : "❌"} | Modal:{" "}
                      {farm.seed_to_plant.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold text-lg ${
                        isReady ? "text-yellow-400" : "text-green-400"
                      }`}
                    >
                      {now === 0
                        ? "loading..."
                        : isReady
                          ? "🌾 SIAP PANEN!"
                          : formatTimeLeft(timeLeft)}
                    </p>
                    <div className="flex gap-2 justify-end mt-1">
                      {isReady && (
                        <button
                          onClick={() => handleHarvest(farm)}
                          className="text-xs px-2 py-1 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded transition"
                        >
                          🌾 Panen
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(farm.id)}
                        className="text-xs text-red-400 hover:text-red-300 underline"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm pt-3 border-t border-gray-700">
                  <div>
                    <p className="text-gray-500 text-xs">Total Block</p>
                    <p className="text-yellow-400 font-bold">
                      {harvestResult.totalBlock.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Total Seed</p>
                    <p className="text-green-400 font-bold">
                      {harvestResult.totalSeed.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Surplus</p>
                    <p
                      className={`font-bold ${
                        harvestResult.surplusSeed >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {harvestResult.surplusSeed >= 0 ? "+" : ""}
                      {harvestResult.surplusSeed.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Gems per TM</p>
                    <p className="text-purple-400 font-bold">
                      {tmResult.gemsPerTM.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Total Gems TM</p>
                    <p className="text-red-400 font-bold">
                      {tmResult.totalGems.toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* TOTAL */}
        {farms.length > 0 && (
          <div className="mt-8 p-4 bg-green-900/20 border-2 border-green-700 rounded-lg">
            <h2 className="text-xl font-bold text-green-400 mb-4">
              📊 Total Semua Farm
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-xs text-gray-400">Total Farm</p>
                <p className="text-2xl font-bold text-white">
                  {farms.length}{" "}
                  <span className="text-sm text-gray-500">/ {maxFarms}</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Total Block</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {totals.blocks.toLocaleString("id-ID")}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Total Seed</p>
                <p className="text-2xl font-bold text-green-400">
                  {totals.seed.toLocaleString("id-ID")}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Total Surplus</p>
                <p
                  className={`text-2xl font-bold ${
                    totals.surplus >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {totals.surplus >= 0 ? "+" : ""}
                  {totals.surplus.toLocaleString("id-ID")}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Total Gems TM</p>
                <p className="text-2xl font-bold text-purple-400">
                  {totals.gems.toLocaleString("id-ID")}
                </p>
              </div>
            </div>
          </div>
        )}

        <footer className="mt-12 text-center text-gray-600 text-sm">
          <p>
            Total Farm: {farms.length} / {maxFarms}
          </p>
        </footer>
      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </main>
  );
}