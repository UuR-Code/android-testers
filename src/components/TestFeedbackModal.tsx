"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useApp } from "@/context/AppContext";
import { ArrowLeft, Check, AlertCircle, Lightbulb, RefreshCw, X, ShieldCheck } from "lucide-react";

export function TestFeedbackModal() {
  const {
    isFeedbackModalOpen,
    setIsFeedbackModalOpen,
    selectedParticipationApp,
    setSelectedParticipationApp,
    showToast,
    refreshUser,
    triggerConfetti,
    setActiveTab,
    setOpenedApp,
  } = useApp();

  const [feedbackType, setFeedbackType] = useState<"NO_PROBLEM" | "BUG_FOUND" | "SUGGESTION">("NO_PROBLEM");
  const [feedbackText, setFeedbackText] = useState("");
  const [verificationAnswer, setVerificationAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isFeedbackModalOpen || !selectedParticipationApp) return null;

  const handleSubmit = async () => {
    if (selectedParticipationApp.verification_question && !verificationAnswer.trim()) {
      showToast("Lütfen geliştiricinin kontrol sorusunu yanıtlayın.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/apps/${selectedParticipationApp.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedback_type: feedbackType,
          feedback_text: feedbackText,
          tester_answer: verificationAnswer.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        triggerConfetti();
        showToast("Geri bildirim iletildi! Geliştirici onayı bekleniyor.", "success");
        await refreshUser();
        setIsFeedbackModalOpen(false);
        setOpenedApp(null);
        setActiveTab("tests");
      } else {
        showToast(data.error || "Geri bildirim gönderilemedi", "error");
        if (data.is_locked_out) {
          await refreshUser();
          setIsFeedbackModalOpen(false);
          setOpenedApp(null);
        }
      }
    } catch (e) {
      showToast("Bağlantı hatası", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <button
            onClick={() => setIsFeedbackModalOpen(false)}
            className="p-1 -ml-1 text-slate-400 hover:text-slate-600 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h3 className="font-bold text-sm text-slate-800">Test Geri Bildirimi</h3>
          <div className="w-5" />
        </div>

        {/* App Snapshot */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl mb-5">
          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-2xs border border-slate-100 bg-white flex items-center justify-center">
            <Image
              src={selectedParticipationApp.icon_url || "/icons/brandlook.svg"}
              alt={selectedParticipationApp.name}
              width={48}
              height={48}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-sm text-slate-900 truncate">
              {selectedParticipationApp.name}
            </h4>
            <span className="text-[11px] text-slate-500 font-medium">
              {selectedParticipationApp.category}
            </span>
          </div>
        </div>

        {/* Question & Options (Matches Screen 8) */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-800 mb-2.5">
            Uygulamayı nasıl buldun?
          </label>

          <div className="space-y-2">
            {/* Option 1: No problem */}
            <label
              onClick={() => setFeedbackType("NO_PROBLEM")}
              className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                feedbackType === "NO_PROBLEM"
                  ? "bg-indigo-50/70 border-indigo-500 text-indigo-950"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                  feedbackType === "NO_PROBLEM" ? "border-indigo-600 bg-indigo-600" : "border-slate-300"
                }`}
              >
                {feedbackType === "NO_PROBLEM" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <div className="text-left">
                <span className="text-xs font-bold block">Sorunsuz çalıştı</span>
                <span className="text-[11px] text-slate-500">Genel olarak problem yaşamadım.</span>
              </div>
            </label>

            {/* Option 2: Bug found */}
            <label
              onClick={() => setFeedbackType("BUG_FOUND")}
              className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                feedbackType === "BUG_FOUND"
                  ? "bg-indigo-50/70 border-indigo-500 text-indigo-950"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                  feedbackType === "BUG_FOUND" ? "border-indigo-600 bg-indigo-600" : "border-slate-300"
                }`}
              >
                {feedbackType === "BUG_FOUND" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <div className="text-left">
                <span className="text-xs font-bold block">Hata buldum</span>
                <span className="text-[11px] text-slate-500">Uygulamada bir sorunla karşılaştım.</span>
              </div>
            </label>

            {/* Option 3: Suggestion */}
            <label
              onClick={() => setFeedbackType("SUGGESTION")}
              className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                feedbackType === "SUGGESTION"
                  ? "bg-indigo-50/70 border-indigo-500 text-indigo-950"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                  feedbackType === "SUGGESTION" ? "border-indigo-600 bg-indigo-600" : "border-slate-300"
                }`}
              >
                {feedbackType === "SUGGESTION" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <div className="text-left">
                <span className="text-xs font-bold block">Önerim var</span>
                <span className="text-[11px] text-slate-500">Geliştirme için bir önerim var.</span>
              </div>
            </label>
          </div>
        </div>

        {/* Verification Question & Answer (Control Mechanism) */}
        {selectedParticipationApp.verification_question && (
          <div className="mb-4 p-3.5 bg-gradient-to-r from-indigo-50/90 to-purple-50/80 border border-indigo-200/90 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-indigo-950 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>İndirme Doğrulama Sorusu *</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                2 Hak Sınırı
              </span>
            </div>

            {selectedParticipationApp.my_participation?.failed_attempts === 1 && (
              <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-700 flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600" />
                <div>
                  <strong className="block font-bold">1. denemeniz hatalı oldu!</strong>
                  <span>Son 1 hakkınız kaldı. Bu deneme de yanlış olursa bu projeden men edilirsiniz ve 1 uyarı alırsınız.</span>
                </div>
              </div>
            )}

            <p className="text-xs text-slate-700 font-semibold">
              {selectedParticipationApp.verification_question}
            </p>

            <input
              type="text"
              required
              value={verificationAnswer}
              onChange={(e) => setVerificationAnswer(e.target.value)}
              placeholder="Uygulama içindeki cevabı buraya yazın..."
              className="w-full p-2.5 bg-white border border-indigo-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            />

            <div className="text-[10px] text-slate-500 space-y-0.5">
              <p>💡 <strong>Esnek Eşleşme:</strong> Kelimeler birebir aynı olmak zorunda değildir (%70 benzerlik kabul edilir, örn: <em>hemen başla / hemn basla</em>).</p>
              <p className="text-rose-600 font-medium">⚠️ 2 hatalı cevapta proje kapanır ve üye 1 uyarı alır (3 uyarıda sistemden uzaklaştırılır).</p>
            </div>
          </div>
        )}

        {/* Optional Comment */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Kısa yorumun (isteğe bağlı)
          </label>
          <textarea
            rows={3}
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Genel olarak çok iyi, görsel oluşturma hızını beğendim."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all resize-none shadow-2xs"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-md shadow-indigo-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Gönderiliyor...</span>
            </>
          ) : (
            <span>Test Ettim, Onaya Gönder</span>
          )}
        </button>
      </div>
    </div>
  );
}
