"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import {
  ArrowLeft,
  Download,
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  RefreshCw,
  Send,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";

interface TesterRecord {
  participation_id: string;
  user_id: string;
  email: string;
  name: string | null;
  status: "JOINED" | "INVITED" | "CLAIMED_TESTED" | "APPROVED" | "REJECTED";
  joined_at: string;
  invited_at?: string | null;
  claimed_tested_at?: string | null;
  approved_at?: string | null;
  feedback_type?: string | null;
  feedback_text?: string | null;
  rejection_reason?: string | null;
}

export function TestersManagementModal() {
  const {
    isTestersModalOpen,
    setIsTestersModalOpen,
    managingAppId,
    showToast,
    refreshUser,
    triggerConfetti,
  } = useApp();

  const [testers, setTesters] = useState<TesterRecord[]>([]);
  const [appName, setAppName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectingRecord, setRejectingRecord] = useState<TesterRecord | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchTesters = useCallback(async () => {
    if (!managingAppId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/apps/${managingAppId}/testers`);
      const data = await res.json();
      if (res.ok) {
        setTesters(data.testers || []);
        setAppName(data.app?.name || "");
      } else {
        showToast(data.error || "Testçiler getirilemedi.", "error");
      }
    } catch (e) {
      showToast("Bağlantı hatası", "error");
    } finally {
      setIsLoading(false);
    }
  }, [managingAppId, showToast]);

  useEffect(() => {
    if (isTestersModalOpen && managingAppId) {
      fetchTesters();
    }
  }, [isTestersModalOpen, managingAppId, fetchTesters]);

  if (!isTestersModalOpen || !managingAppId) return null;

  const handleApprove = async (tester: TesterRecord) => {
    setProcessingId(tester.participation_id);
    try {
      const res = await fetch(`/api/apps/${managingAppId}/testers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPROVE",
          participation_id: tester.participation_id,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        triggerConfetti();
        showToast(data.message || "Testçi onaylandı ve +1 kredi tanımlandı!", "success");
        await fetchTesters();
        await refreshUser();
      } else {
        showToast(data.error || "Onaylama başarısız", "error");
      }
    } catch (e) {
      showToast("İşlem hatası", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingRecord) return;
    setProcessingId(rejectingRecord.participation_id);
    try {
      const res = await fetch(`/api/apps/${managingAppId}/testers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REJECT",
          participation_id: rejectingRecord.participation_id,
          reason: rejectReason || "Test şartları karşılanmadı.",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Testçi reddedildi ve kontenjan yeniden açıldı.", "info");
        setRejectingRecord(null);
        setRejectReason("");
        await fetchTesters();
      } else {
        showToast(data.error || "İşlem başarısız", "error");
      }
    } catch (e) {
      showToast("İşlem hatası", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkAllInvited = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/apps/${managingAppId}/testers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "INVITE_READY" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || "Tüm testçiler 'Davet Hazır' yapıldı.", "success");
        await fetchTesters();
      }
    } catch (e) {
      showToast("İşlem hatası", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: TesterRecord["status"]) => {
    switch (status) {
      case "APPROVED":
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Onaylandı</span>;
      case "CLAIMED_TESTED":
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Onay Bekliyor</span>;
      case "INVITED":
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Davet Hazır</span>;
      case "REJECTED":
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">Reddedildi</span>;
      default:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">Katıldı</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col max-w-md mx-auto shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200">
      {/* Top Bar */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <button
          onClick={() => setIsTestersModalOpen(false)}
          className="p-2 -ml-2 rounded-full text-slate-600 hover:bg-slate-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h3 className="font-bold text-sm text-slate-800 text-center">{appName} Testçileri</h3>
          <span className="text-[10px] text-slate-400 block text-center">Toplam {testers.length} Katılımcı</span>
        </div>
        <a
          href={`/api/apps/${managingAppId}/csv`}
          download
          className="p-2 -mr-2 text-indigo-600 hover:bg-indigo-50 rounded-full"
          title="Google Play Console CSV İndir"
        >
          <Download className="w-5 h-5" />
        </a>
      </div>

      <div className="p-4 pb-28 space-y-3">
        {/* Bulk Action Header Bar */}
        <div className="flex gap-2">
          <button
            onClick={handleMarkAllInvited}
            className="flex-1 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Toplu Davet Hazır</span>
          </button>

          <a
            href={`/api/apps/${managingAppId}/csv`}
            download
            className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </a>
        </div>

        {/* Notice for Developer */}
        <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] text-slate-600 leading-relaxed">
          💡 Bu Gmail adreslerini <strong>Google Play Console &gt; Kapalı Test &gt; Test Edenler</strong> alanına ekleyin. Ekledikten sonra testçilerin durumunu "Davet Hazır" yapabilir ve teste davet edebilirsiniz.
        </div>

        {/* Testers List */}
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Yükleniyor...</div>
        ) : testers.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 rounded-2xl p-6 text-slate-400 text-xs">
            Henüz testçi katılmadı.
          </div>
        ) : (
          testers.map((t) => (
            <div
              key={t.participation_id}
              className="p-3.5 bg-white rounded-2xl border border-slate-100 shadow-2xs space-y-2.5"
            >
              {/* Email & Status */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Mail className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span className="font-semibold text-xs text-slate-900 truncate">
                    {t.email}
                  </span>
                </div>
                {getStatusBadge(t.status)}
              </div>

              {/* Feedback text if present */}
              {t.feedback_type && (
                <div className="p-2.5 bg-indigo-50/60 rounded-xl text-[11px] space-y-1">
                  <div className="flex items-center gap-1 font-bold text-indigo-900">
                    <MessageSquare className="w-3 h-3 text-indigo-600" />
                    <span>
                      {t.feedback_type === "NO_PROBLEM"
                        ? "Sorunsuz çalıştı"
                        : t.feedback_type === "BUG_FOUND"
                        ? "Hata bildirdi"
                        : "Öneri sundu"}
                    </span>
                  </div>
                  {t.feedback_text && (
                    <p className="text-slate-600 italic font-normal">"{t.feedback_text}"</p>
                  )}
                </div>
              )}

              {/* Action Buttons for this tester */}
              {t.status !== "APPROVED" && t.status !== "REJECTED" && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setRejectingRecord(t)}
                    disabled={processingId === t.participation_id}
                    className="py-1.5 px-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs font-semibold rounded-xl transition-colors"
                  >
                    Reddet
                  </button>

                  <button
                    onClick={() => handleApprove(t)}
                    disabled={processingId === t.participation_id}
                    className="py-1.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-all active:scale-95 flex items-center gap-1"
                  >
                    {processingId === t.participation_id ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Onayla (+1 Kredi)</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* REJECT MODAL */}
      {rejectingRecord && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl">
            <h4 className="text-sm font-bold text-slate-900 mb-2">Testçiyi Reddet</h4>
            <p className="text-xs text-slate-500 mb-3">
              {rejectingRecord.email} kullanıcısını reddetmek istediğinize emin misiniz? Kontenjan yeniden açılacaktır.
            </p>
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Red gerekçesi (isteğe bağlı)"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setRejectingRecord(null)}
                className="flex-1 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
              >
                İptal
              </button>
              <button
                onClick={handleConfirmReject}
                className="flex-1 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl"
              >
                Reddet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
