"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { Check, ExternalLink, ArrowRight, X } from "lucide-react";

export function SuccessJoinedModal() {
  const {
    isSuccessModalOpen,
    setIsSuccessModalOpen,
    successModalData,
    setActiveTab,
    setOpenedApp,
  } = useApp();

  if (!isSuccessModalOpen || !successModalData) return null;

  const handleGoToMyTests = () => {
    setIsSuccessModalOpen(false);
    setOpenedApp(null);
    setActiveTab("tests");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
        {/* Close */}
        <button
          onClick={() => setIsSuccessModalOpen(false)}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Big Checkmark */}
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 mb-4 animate-in zoom-in duration-300">
          <Check className="w-9 h-9 stroke-[3]" />
        </div>

        {/* Titles */}
        <h2 className="text-lg font-black text-slate-900 mb-1">
          Test Başvurun Alındı!
        </h2>
        <p className="text-xs text-slate-500 mb-5">
          <strong className="text-indigo-600 font-semibold">{successModalData.appName}</strong> uygulaması için testçi listesine eklendin.
        </p>

        {/* Next steps list */}
        <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 text-left mb-6 space-y-2.5">
          <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">?</span>
            <span>Şimdi Ne Yapmalısın?</span>
          </h4>

          <div className="space-y-2 text-xs text-slate-600 font-medium">
            <div className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-indigo-200/80 text-indigo-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
              <span>Play Store test bağlantısını aç ve web testine kabul et.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-indigo-200/80 text-indigo-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
              <span>Uygulamayı Google Play üzerinden cihazına yükle.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-indigo-200/80 text-indigo-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
              <span>Uygulamayı dene ve kısa geri bildirimini hazırla.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-indigo-200/80 text-indigo-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">4</span>
              <span>"Test Ettim" butonuna basarak onay ve kredi bekle.</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <a
            href={successModalData.optInUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            <span>Play Store Testine Git</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          <button
            onClick={handleGoToMyTests}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-2xl transition-colors"
          >
            Testlerim'e Git
          </button>
        </div>
      </div>
    </div>
  );
}
