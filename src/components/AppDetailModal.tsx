"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useApp, AppItem } from "@/context/AppContext";
import {
  ArrowLeft,
  Share2,
  Users,
  Calendar,
  Coins,
  CheckCircle2,
  ExternalLink,
  Clock,
  Sparkles,
  Info,
  Check,
  RefreshCw,
} from "lucide-react";

export function AppDetailModal() {
  const {
    openedApp,
    setOpenedApp,
    user,
    setIsAuthModalOpen,
    setIsFeedbackModalOpen,
    setSelectedParticipationApp,
    showToast,
    refreshUser,
    triggerConfetti,
    setSuccessModalData,
    setIsSuccessModalOpen,
  } = useApp();

  const [activeTab, setActiveTab] = useState<"steps" | "about">("steps");
  const [isJoining, setIsJoining] = useState(false);

  if (!openedApp) return null;

  const hasJoined = Boolean(openedApp.my_participation);
  const participationStatus = openedApp.my_participation?.status;

  const handleJoin = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    if (openedApp.is_owner) {
      showToast("Kendi uygulamanızı test edemezsiniz.", "info");
      return;
    }

    if (openedApp.is_full) {
      showToast("Kontenjan dolmuştur.", "info");
      return;
    }

    setIsJoining(true);
    try {
      const res = await fetch(`/api/apps/${openedApp.id}/participate`, { method: "POST" });
      const data = await res.json();

      if (res.ok && data.success) {
        triggerConfetti();
        showToast("Test başvurunuz alındı!", "success");
        await refreshUser();

        // Update local state
        setOpenedApp({
          ...openedApp,
          current_tester_count: openedApp.current_tester_count + 1,
          my_participation: data.participation,
        });

        // Show Success popup
        setSuccessModalData({
          appName: openedApp.name,
          optInUrl: openedApp.opt_in_url,
        });
        setIsSuccessModalOpen(true);
      } else {
        showToast(data.error || "Katılım sağlanamadı", "error");
      }
    } catch (e) {
      showToast("Bağlantı hatası", "error");
    } finally {
      setIsJoining(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${openedApp.name} — Android Test Havuzu`,
          text: `"${openedApp.name}" Android uygulamasını test et ve kredi kazan!`,
          url: window.location.href,
        });
      } catch (e) {
        // ignore cancel
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      showToast("Bağlantı panoya kopyalandı!", "info");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col max-w-md mx-auto shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200">
      {/* Top Bar (Back & Share) */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <button
          onClick={() => setOpenedApp(null)}
          className="p-2 -ml-2 rounded-full text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 className="font-bold text-xs text-slate-800 truncate max-w-[200px]">
          {openedApp.name}
        </h3>
        <button
          onClick={handleShare}
          className="p-2 -mr-2 rounded-full text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 pb-28">
        {/* App Hero Section */}
        <div className="flex flex-col items-center text-center my-2">
          <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-md bg-slate-50 border border-slate-100 flex items-center justify-center mb-3">
            <Image
              src={openedApp.icon_url || "/icons/brandlook.svg"}
              alt={openedApp.name}
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight mb-0.5">
            {openedApp.name}
          </h1>
          <span className="text-xs font-semibold text-slate-500 mb-4">
            {openedApp.category}
          </span>

          {/* 3 Stat Cards (Matches Screen 5) */}
          <div className="grid grid-cols-3 gap-2 w-full mb-6">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-2.5 flex flex-col items-center justify-center">
              <Users className="w-4 h-4 text-indigo-600 mb-1" />
              <span className="text-xs font-bold text-slate-900">
                {openedApp.current_tester_count} / {openedApp.target_tester_count}
              </span>
              <span className="text-[10px] text-slate-400">Testçi</span>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-2.5 flex flex-col items-center justify-center">
              <Calendar className="w-4 h-4 text-purple-600 mb-1" />
              <span className="text-xs font-bold text-slate-900">14 Gün</span>
              <span className="text-[10px] text-slate-400">Test Süresi</span>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-2.5 flex flex-col items-center justify-center">
              <Coins className="w-4 h-4 text-amber-500 mb-1" />
              <span className="text-xs font-bold text-emerald-600">+1</span>
              <span className="text-[10px] text-slate-400">Kredi Ödülü</span>
            </div>
          </div>
        </div>

        {/* Tab switchers: [ Teste Katıl ] [ Hakkında ] */}
        <div className="flex border-b border-slate-200 mb-5">
          <button
            onClick={() => setActiveTab("steps")}
            className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-all ${
              activeTab === "steps"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Teste Katıl
          </button>
          <button
            onClick={() => setActiveTab("about")}
            className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-all ${
              activeTab === "about"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Hakkında
          </button>
        </div>

        {/* TAB 1: TESTE KATIL & ADIMLAR */}
        {activeTab === "steps" && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Teste Katılım Adımları
            </h4>

            {/* 4 Steps timeline */}
            <div className="space-y-3">
              {/* Step 1 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    hasJoined
                      ? "bg-emerald-500 text-white"
                      : "bg-indigo-600 text-white"
                  }`}
                >
                  {hasJoined ? <Check className="w-3.5 h-3.5" /> : "1"}
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Teste Katıl</h5>
                  <p className="text-[11px] text-slate-500">
                    Uygulamanın testçi havuzuna kaydol ve Gmail adresin proje sahibinin listesine eklensin.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    participationStatus === "INVITED" ||
                    participationStatus === "CLAIMED_TESTED" ||
                    participationStatus === "APPROVED"
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  2
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-slate-900">Play Store Testine Katıl</h5>
                    {hasJoined && (
                      <a
                        href={openedApp.opt_in_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-semibold text-indigo-600 hover:underline flex items-center gap-0.5"
                      >
                        <span>Bağlantı</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Google Play web opt-in test sayfasından daveti kabul et.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    participationStatus === "CLAIMED_TESTED" ||
                    participationStatus === "APPROVED"
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  3
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Uygulamayı İndir ve Dene</h5>
                  <p className="text-[11px] text-slate-500">
                    Google Play üzerinden cihazına yükle, en az birkaç dakika test et ve incele.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    participationStatus === "APPROVED"
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  4
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Testi Tamamla & Onay Al</h5>
                  <p className="text-[11px] text-slate-500">
                    Kısa geri bildirim gönder. Geliştirici onaylayınca <strong>+1 kredi</strong> kazanırsın.
                  </p>
                </div>
              </div>
            </div>

            {/* Note from developer if any */}
            {openedApp.note_for_testers && (
              <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-2xl">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 mb-1">
                  <Info className="w-3.5 h-3.5" />
                  <span>Geliştiriciden Not</span>
                </div>
                <p className="text-xs text-amber-900/90 leading-relaxed font-normal">
                  {openedApp.note_for_testers}
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: HAKKINDA */}
        {activeTab === "about" && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <h4 className="text-xs font-bold text-slate-900 mb-2">Açıklama</h4>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                {openedApp.description || "Uygulama için detaylı açıklama girilmemiş."}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <h4 className="text-xs font-bold text-slate-900 mb-2">Google Play Bağlantıları</h4>
              <div>
                <span className="text-[11px] text-slate-400 block">Kapalı Test Web Opt-in</span>
                <a
                  href={openedApp.opt_in_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-indigo-600 hover:underline break-all flex items-center gap-1"
                >
                  <span className="truncate">{openedApp.opt_in_url}</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
              </div>
              {openedApp.store_url && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[11px] text-slate-400 block">Play Store İndirme Sayfası</span>
                  <a
                    href={openedApp.store_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-indigo-600 hover:underline break-all flex items-center gap-1"
                  >
                    <span className="truncate">{openedApp.store_url}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* STICKY BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-white/95 backdrop-blur-md border-t border-slate-100 flex flex-col gap-2 shadow-lg">
        {!hasJoined ? (
          openedApp.is_full ? (
            <button
              disabled
              className="w-full py-3.5 bg-slate-100 text-slate-400 rounded-2xl font-bold text-xs cursor-not-allowed"
            >
              Kontenjan Doldu (20/20)
            </button>
          ) : openedApp.is_owner ? (
            <div className="text-center py-2 text-xs font-semibold text-slate-500">
              Bu uygulamanın sahibisiniz. Katılımcıları "Benim Uygulamalarım"dan yönetebilirsiniz.
            </div>
          ) : (
            <button
              onClick={handleJoin}
              disabled={isJoining}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-indigo-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {isJoining ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Katılım Kaydediliyor...</span>
                </>
              ) : (
                <span>Teste Katıl</span>
              )}
            </button>
          )
        ) : (
          <div className="space-y-2">
            {/* Status indicator badge */}
            {participationStatus === "APPROVED" ? (
              <div className="w-full py-3 px-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl font-bold text-xs text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Testin Onaylandı! (+1 Kredi Hesabında)</span>
              </div>
            ) : participationStatus === "CLAIMED_TESTED" ? (
              <div className="w-full py-3 px-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl font-semibold text-xs text-center flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Test Bildirildi — Geliştirici Onayı Bekleniyor</span>
              </div>
            ) : (
              <div className="flex gap-2">
                <a
                  href={openedApp.opt_in_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl text-center flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Play Store Testi</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={() => {
                    setSelectedParticipationApp(openedApp);
                    setIsFeedbackModalOpen(true);
                  }}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl text-center shadow-md shadow-indigo-500/20 active:scale-98 transition-all"
                >
                  Test Ettim, Bildir
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
