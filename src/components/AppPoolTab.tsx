"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useApp, AppItem } from "@/context/AppContext";
import { Coins, Plus, Search, ChevronRight, Check, AlertCircle, RefreshCw, Smartphone } from "lucide-react";

export function AppPoolTab() {
  const {
    user,
    setIsAuthModalOpen,
    setIsAddAppOpen,
    setOpenedApp,
    showToast,
    refreshUser,
    triggerConfetti,
    setSuccessModalData,
    setIsSuccessModalOpen,
  } = useApp();

  const [apps, setApps] = useState<AppItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<"pool" | "popular" | "new">("pool");
  const [searchQuery, setSearchQuery] = useState("");
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const fetchApps = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/apps?tab=${filterTab}&search=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setApps(data.apps || []);
      }
    } catch (e) {
      console.error("Failed to fetch apps", e);
    } finally {
      setIsLoading(false);
    }
  }, [filterTab, searchQuery]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const handleJoinTest = async (app: AppItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    if (app.is_owner) {
      showToast("Kendi uygulamanızı test edemezsiniz.", "info");
      return;
    }

    if (app.is_full) {
      showToast("Bu uygulamanın 20 kişilik testçi kontenjanı dolmuştur.", "info");
      return;
    }

    if (app.my_participation) {
      // Already joined, open detail
      setOpenedApp(app);
      return;
    }

    setJoiningId(app.id);
    try {
      const res = await fetch(`/api/apps/${app.id}/participate`, { method: "POST" });
      const data = await res.json();

      if (res.ok && data.success) {
        triggerConfetti();
        showToast("Test başvurunuz başarıyla alındı!", "success");
        await refreshUser();
        await fetchApps();

        // Show Success modal (Screen 6)
        setSuccessModalData({
          appName: app.name,
          optInUrl: app.opt_in_url,
        });
        setIsSuccessModalOpen(true);
      } else {
        showToast(data.error || "Katılım sağlanamadı", "error");
      }
    } catch (err) {
      showToast("Bağlantı hatası", "error");
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className="pb-24">
      {/* 1. GREETING & BALANCE HERO BANNER (Matches Screen 4) */}
      <div className="p-4 bg-white border-b border-slate-100">
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Merhaba {user?.name || "Misafir"} 👋
            </h2>
            <p className="text-xs text-slate-500">
              {user ? "Bugün yeni uygulamalar test ederek kredi kazan." : "Testçi havuzuna katılmak için giriş yapın."}
            </p>
          </div>

          {/* Add App Button */}
          <button
            onClick={() => {
              if (!user) {
                setIsAuthModalOpen(true);
              } else {
                setIsAddAppOpen(true);
              }
            }}
            className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-semibold px-3.5 py-2 rounded-2xl shadow-sm shadow-indigo-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Uygulama Ekle</span>
          </button>
        </div>

        {/* Credit Card / Stat Widget */}
        {user && (
          <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50/50 border border-indigo-100/80 rounded-2xl p-3 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-400 text-amber-900 flex items-center justify-center font-bold text-base shadow-xs">
                🪙
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Kredin
                </span>
                <span className="text-lg font-black text-slate-900 leading-none">
                  {user.credit_balance} <span className="text-xs font-medium text-slate-500">kredi</span>
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-indigo-700 bg-indigo-100/70 font-semibold px-2 py-0.5 rounded-full">
                Uygulama Ekleme: 10 Kredi
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. SEARCH & FILTER CHIPS */}
      <div className="p-4 space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Uygulama veya kategori ara..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all shadow-2xs"
          />
        </div>

        {/* Filter Chips (Test Havuzu, Popüler, Yeni) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setFilterTab("pool")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filterTab === "pool"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Test Havuzu
          </button>
          <button
            onClick={() => setFilterTab("popular")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filterTab === "popular"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Popüler
          </button>
          <button
            onClick={() => setFilterTab("new")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filterTab === "new"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Yeni
          </button>
        </div>
      </div>

      {/* 3. APPS LIST */}
      <div className="px-4 space-y-3">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-500 mb-2" />
            <span className="text-xs">Uygulamalar yükleniyor...</span>
          </div>
        ) : apps.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-3xl border border-slate-100 p-6 shadow-2xs">
            <Smartphone className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">Uygulama bulunamadı</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Arama kriterlerinize uygun uygulama bulunamadı veya henüz yeni uygulama eklenmemiş.
            </p>
          </div>
        ) : (
          apps.map((app) => {
            const percent = Math.min(100, Math.round((app.current_tester_count / app.target_tester_count) * 100));
            const hasJoined = Boolean(app.my_participation);

            return (
              <div
                key={app.id}
                onClick={() => setOpenedApp(app)}
                className={`bg-white rounded-3xl p-4 border transition-all cursor-pointer shadow-xs hover:shadow-md hover:border-indigo-100 active:scale-[0.99] ${
                  app.is_full ? "opacity-75 border-slate-200 bg-slate-50/50" : "border-slate-100"
                }`}
              >
                {/* Top Row: Icon, Title & Category */}
                <div className="flex items-start gap-3.5 mb-3">
                  <div className="w-13 h-13 rounded-2xl overflow-hidden shrink-0 shadow-2xs bg-slate-50 border border-slate-100 flex items-center justify-center">
                    <Image
                      src={app.icon_url || "/icons/brandlook.svg"}
                      alt={app.name}
                      width={52}
                      height={52}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h3 className="font-bold text-sm text-slate-900 truncate">
                        {app.name}
                      </h3>
                      {app.is_owner && (
                        <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full shrink-0">
                          Senin Uygulaman
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-slate-400 block mb-1">
                      {app.category}
                    </span>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">
                      {app.description || "Kapalı beta test katılımcıları aranıyor."}
                    </p>
                  </div>
                </div>

                {/* Progress Bar & Actions */}
                <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1">
                      <span>{app.current_tester_count} / {app.target_tester_count} Testçi</span>
                      <span>%{percent}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          app.is_full
                            ? "bg-slate-400"
                            : percent > 80
                            ? "bg-amber-500"
                            : "bg-gradient-to-r from-indigo-500 to-purple-600"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Status / Join Button */}
                  <div className="shrink-0">
                    {hasJoined ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Katıldın</span>
                      </span>
                    ) : app.is_full ? (
                      <span className="inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500">
                        Kontenjan Doldu
                      </span>
                    ) : app.is_owner ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenedApp(app);
                        }}
                        className="text-xs font-semibold px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        Yönet
                      </button>
                    ) : (
                      <button
                        onClick={(e) => handleJoinTest(app, e)}
                        disabled={joiningId === app.id}
                        className="text-xs font-bold px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs hover:shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
                      >
                        {joiningId === app.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <span>Teste Katıl</span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
