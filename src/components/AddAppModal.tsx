"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useApp } from "@/context/AppContext";
import {
  ArrowLeft,
  Coins,
  Link as LinkIcon,
  Sparkles,
  AlertCircle,
  Plus,
  RefreshCw,
  Check,
} from "lucide-react";

const PRESET_ICONS = [
  { name: "Brandlook", url: "/icons/brandlook.svg" },
  { name: "Oyun", url: "/icons/durbasma.svg" },
  { name: "Market", url: "/icons/hafifsepet.svg" },
  { name: "Planly", url: "/icons/planly.svg" },
  { name: "FitPulse", url: "/icons/fitpulse.svg" },
  { name: "Genel", url: "/icons/logo.svg" },
];

export function AddAppModal() {
  const {
    isAddAppOpen,
    setIsAddAppOpen,
    user,
    showToast,
    refreshUser,
    triggerConfetti,
    setActiveTab,
  } = useApp();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Fotoğraf • Yapay Zeka");
  const [description, setDescription] = useState("");
  const [optInUrl, setOptInUrl] = useState("");
  const [storeUrl, setStoreUrl] = useState("");
  const [noteForTesters, setNoteForTesters] = useState("");
  const [iconUrl, setIconUrl] = useState("/icons/brandlook.svg");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAddAppOpen) return null;

  const currentCredits = user?.credit_balance ?? 0;
  const cost = 10;
  const hasEnoughCredit = currentCredits >= cost;
  const missingCredits = Math.max(0, cost - currentCredits);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasEnoughCredit) {
      showToast(`Uygulama eklemek için ${missingCredits} krediye daha ihtiyacın var.`, "error");
      return;
    }

    if (!name.trim()) {
      showToast("Lütfen uygulama adını girin.", "error");
      return;
    }

    if (!optInUrl.trim().startsWith("http")) {
      showToast("Lütfen geçerli bir Google Play test bağlantısı girin.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          category: category.trim(),
          description: description.trim(),
          opt_in_url: optInUrl.trim(),
          store_url: storeUrl.trim() || null,
          note_for_testers: noteForTesters.trim() || null,
          icon_url: iconUrl,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        triggerConfetti();
        showToast(`${name} başarıyla yayınlandı! 10 kredi düşüldü.`, "success");
        await refreshUser();
        setIsAddAppOpen(false);
        setActiveTab("apps");
      } else {
        showToast(data.error || "Uygulama yayınlanamadı.", "error");
      }
    } catch (e) {
      showToast("Bağlantı hatası", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col max-w-md mx-auto shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200">
      {/* Top Bar */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <button
          onClick={() => setIsAddAppOpen(false)}
          className="p-2 -ml-2 rounded-full text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 className="font-bold text-sm text-slate-800">Uygulama Ekle</h3>
        <div className="w-5" />
      </div>

      <form onSubmit={handleSubmit} className="p-4 pb-32 space-y-4">
        {/* Credit Notice Banner (Matches Screen 9) */}
        {hasEnoughCredit ? (
          <div className="p-3.5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100/90 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-amber-900 flex items-center justify-center font-bold text-base shrink-0 shadow-2xs">
              🪙
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-950">
                Bu işlem için 10 kredi gerekiyor.
              </p>
              <p className="text-[11px] text-slate-500">
                Mevcut kredin: <strong className="text-indigo-600 font-bold">{currentCredits} kredi</strong>.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-rose-50 border border-rose-200/80 rounded-2xl space-y-2">
            <div className="flex items-start gap-2 text-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="text-xs font-bold">
                Uygulama eklemek için {missingCredits} krediye daha ihtiyacın var.
              </div>
            </div>
            <p className="text-[11px] text-rose-700/80 leading-relaxed">
              Diğer geliştiricilerin uygulamalarını test ederek kolayca kredi kazanabilirsin.
            </p>
            <button
              type="button"
              onClick={() => {
                setIsAddAppOpen(false);
                setActiveTab("apps");
              }}
              className="mt-1 w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors"
            >
              Test Havuzuna Git
            </button>
          </div>
        )}

        {/* 1. App Name */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5">
            Uygulama Adı *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Brandlook"
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 focus:bg-white transition-all shadow-2xs"
          />
        </div>

        {/* 2. Category */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5">
            Kategori
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 focus:bg-white transition-all shadow-2xs"
          >
            <option value="Fotoğraf • Yapay Zeka">Fotoğraf • Yapay Zeka</option>
            <option value="Oyun">Oyun</option>
            <option value="Verimlilik">Verimlilik</option>
            <option value="Alışveriş & Fiyat">Alışveriş & Fiyat</option>
            <option value="Sağlık & Spor">Sağlık & Spor</option>
            <option value="Eğitim">Eğitim</option>
            <option value="Finans">Finans</option>
            <option value="Sosyal">Sosyal</option>
            <option value="Genel">Genel</option>
          </select>
        </div>

        {/* 3. Short Description */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5">
            Kısa Açıklama
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Yapay zeka ile marka içerikleri ve sosyal medya görselleri oluşturun."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 focus:bg-white transition-all resize-none shadow-2xs"
          />
        </div>

        {/* 4. Play Store Test Link */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5">
            Play Store Test Bağlantısı *
          </label>
          <div className="relative">
            <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="url"
              required
              value={optInUrl}
              onChange={(e) => setOptInUrl(e.target.value)}
              placeholder="https://play.google.com/apps/testing/com.brandlook.ai"
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 focus:bg-white transition-all shadow-2xs"
            />
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Google Play Console kapalı test web bağlantısı (opt-in linki).
          </span>
        </div>

        {/* 5. Play Store Direct Download Link (Optional) */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5">
            Play Store İndirme Bağlantısı (İsteğe bağlı)
          </label>
          <div className="relative">
            <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="url"
              value={storeUrl}
              onChange={(e) => setStoreUrl(e.target.value)}
              placeholder="https://play.google.com/store/apps/details?id=com.brandlook.ai"
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 focus:bg-white transition-all shadow-2xs"
            />
          </div>
        </div>

        {/* 6. Note for Testers (Optional) */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5">
            Testçilerin Bilmesi Gereken Kısa Not
          </label>
          <textarea
            rows={2}
            value={noteForTesters}
            onChange={(e) => setNoteForTesters(e.target.value)}
            placeholder="Örn: Lütfen profil oluşturup en az 1 görsel oluşturmayı deneyin."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 focus:bg-white transition-all resize-none shadow-2xs"
          />
        </div>

        {/* 7. App Icon Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-2">
            Uygulama Simgesi
          </label>
          <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
            {PRESET_ICONS.map((preset) => (
              <div
                key={preset.url}
                onClick={() => setIconUrl(preset.url)}
                className={`relative w-14 h-14 rounded-2xl p-1 border-2 cursor-pointer transition-all shrink-0 flex items-center justify-center bg-white shadow-2xs ${
                  iconUrl === preset.url
                    ? "border-indigo-600 ring-2 ring-indigo-200 scale-105"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <Image
                  src={preset.url}
                  alt={preset.name}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover rounded-xl"
                />
                {iconUrl === preset.url && (
                  <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* STICKY BOTTOM BUTTON */}
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-lg">
          <button
            type="submit"
            disabled={isSubmitting || !hasEnoughCredit}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-md shadow-indigo-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Yayınlanıyor...</span>
              </>
            ) : (
              <span>Uygulamayı Yayınla (10 Kredi)</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
