"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  ArrowLeft,
  Settings,
  Users,
  Smartphone,
  Coins,
  Mail,
  ShieldCheck,
  Check,
  AlertTriangle,
  RefreshCw,
  Plus,
} from "lucide-react";

export function AdminModal() {
  const { isAdminModalOpen, setIsAdminModalOpen, showToast, refreshUser } = useApp();

  const [activeTab, setActiveTab] = useState<"stats" | "settings" | "users" | "apps" | "emails">("stats");
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    app_creation_cost: 10,
    reward_per_approved_test: 1,
    target_tester_count: 20,
    max_active_apps_per_user: 5,
    reminder_cooldown_hours: 24,
  });

  // Credit adjustment state
  const [selectedUserForCredit, setSelectedUserForCredit] = useState<any>(null);
  const [creditAmount, setCreditAmount] = useState<string>("5");
  const [creditReason, setCreditReason] = useState<string>("Yönetici İkramiyesi");

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin");
      if (res.ok) {
        const json = await res.json();
        setData(json);
        if (json.settings) {
          setSettingsForm({
            app_creation_cost: json.settings.app_creation_cost,
            reward_per_approved_test: json.settings.reward_per_approved_test,
            target_tester_count: json.settings.target_tester_count,
            max_active_apps_per_user: json.settings.max_active_apps_per_user,
            reminder_cooldown_hours: json.settings.reminder_cooldown_hours,
          });
        }
      } else {
        showToast("Yönetici paneli yüklenemedi", "error");
      }
    } catch (e) {
      showToast("Bağlantı hatası", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminModalOpen) {
      fetchAdminData();
    }
  }, [isAdminModalOpen]);

  if (!isAdminModalOpen) return null;

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_SETTINGS",
          settings: settingsForm,
        }),
      });
      const d = await res.json();
      if (res.ok && d.success) {
        showToast("Sistem ayarları güncellendi!", "success");
        await fetchAdminData();
      } else {
        showToast(d.error || "Ayar kaydedilemedi", "error");
      }
    } catch (e) {
      showToast("Hata oluştu", "error");
    }
  };

  const handleAdjustCredit = async () => {
    if (!selectedUserForCredit) return;
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADJUST_CREDITS",
          user_id: selectedUserForCredit.id,
          amount: Number(creditAmount),
          reason: creditReason,
        }),
      });
      const d = await res.json();
      if (res.ok && d.success) {
        showToast(d.message || "Kredi uygulandı!", "success");
        setSelectedUserForCredit(null);
        await fetchAdminData();
        await refreshUser();
      } else {
        showToast(d.error || "İşlem başarısız", "error");
      }
    } catch (e) {
      showToast("Hata oluştu", "error");
    }
  };

  const handleToggleApp = async (appId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TOGGLE_APP_STATUS",
          app_id: appId,
          status: nextStatus,
        }),
      });
      if (res.ok) {
        showToast(`Uygulama durumu "${nextStatus}" yapıldı.`, "info");
        await fetchAdminData();
      }
    } catch (e) {
      showToast("Hata oluştu", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col max-w-md mx-auto shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200">
      {/* Top Bar */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <button
          onClick={() => setIsAdminModalOpen(false)}
          className="p-2 -ml-2 rounded-full text-slate-600 hover:bg-slate-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 className="font-bold text-sm text-slate-800">Yönetim Paneli</h3>
        <div className="w-5" />
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-slate-100 px-2 overflow-x-auto no-scrollbar">
        {[
          { key: "stats", label: "Özet" },
          { key: "settings", label: "Ayarlar" },
          { key: "users", label: "Kullanıcılar" },
          { key: "apps", label: "Uygulamalar" },
          { key: "emails", label: "E-postalar" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`py-2.5 px-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
              activeTab === tab.key
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4 pb-20 space-y-4">
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Yükleniyor...</div>
        ) : !data ? (
          <div className="text-center text-xs text-rose-500">Veri bulunamadı.</div>
        ) : (
          <>
            {/* 1. STATS TAB */}
            {activeTab === "stats" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl">
                    <span className="text-[10px] font-semibold text-indigo-700 block mb-0.5">Toplam Kullanıcı</span>
                    <span className="text-xl font-black text-indigo-950">{data.stats.total_users}</span>
                  </div>

                  <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-2xl">
                    <span className="text-[10px] font-semibold text-purple-700 block mb-0.5">Aktif Uygulama</span>
                    <span className="text-xl font-black text-purple-950">{data.stats.active_apps} / {data.stats.total_apps}</span>
                  </div>

                  <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-2xl">
                    <span className="text-[10px] font-semibold text-amber-700 block mb-0.5">Piyasadaki Kredi</span>
                    <span className="text-xl font-black text-amber-950">{data.stats.circulating_credits}</span>
                  </div>

                  <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl">
                    <span className="text-[10px] font-semibold text-emerald-700 block mb-0.5">Onay Bekleyen Test</span>
                    <span className="text-xl font-black text-emerald-950">{data.stats.pending_approvals}</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                  <h4 className="text-xs font-bold text-slate-800">Kredi Ekonomisi</h4>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Dağıtılan Test Ödülü:</span>
                    <strong className="text-emerald-600">+{data.stats.total_rewards_given} Kredi</strong>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Uygulama Açma İçin Harcanan:</span>
                    <strong className="text-rose-600">-{data.stats.total_spent_on_apps} Kredi</strong>
                  </div>
                </div>
              </div>
            )}

            {/* 2. SETTINGS TAB */}
            {activeTab === "settings" && (
              <form onSubmit={handleSaveSettings} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Uygulama Yayınlama Bedeli (Kredi)
                  </label>
                  <input
                    type="number"
                    value={settingsForm.app_creation_cost}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, app_creation_cost: Number(e.target.value) })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Onaylanan Test Başına Ödül (Kredi)
                  </label>
                  <input
                    type="number"
                    value={settingsForm.reward_per_approved_test}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, reward_per_approved_test: Number(e.target.value) })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Varsayılan Hedef Testçi Sayısı
                  </label>
                  <input
                    type="number"
                    value={settingsForm.target_tester_count}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, target_tester_count: Number(e.target.value) })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kullanıcı Başına Maksimum Aktif Uygulama
                  </label>
                  <input
                    type="number"
                    value={settingsForm.max_active_apps_per_user}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, max_active_apps_per_user: Number(e.target.value) })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hatırlatma E-postası Bekleme Süresi (Saat)
                  </label>
                  <input
                    type="number"
                    value={settingsForm.reminder_cooldown_hours}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, reminder_cooldown_hours: Number(e.target.value) })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Ayarları Kaydet
                </button>
              </form>
            )}

            {/* 3. USERS TAB */}
            {activeTab === "users" && (
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Kayıtlı Kullanıcılar ({data.users.length})
                </h4>

                {data.users.map((u: any) => (
                  <div key={u.id} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">{u.name || "İsimsiz"}</span>
                        {u.role === "ADMIN" && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 bg-purple-100 text-purple-700 rounded-full">Admin</span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 block">{u.email}</span>
                      <span className="text-[10px] text-slate-400">
                        {u._count.apps} uygulama • {u._count.participations} test
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="text-xs font-black text-amber-600 block">{u.credit_balance} Kredi</span>
                      </div>
                      <button
                        onClick={() => setSelectedUserForCredit(u)}
                        className="py-1 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold rounded-lg"
                      >
                        ± Kredi
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 4. APPS TAB */}
            {activeTab === "apps" && (
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Tüm Uygulamalar ({data.apps.length})
                </h4>

                {data.apps.map((a: any) => (
                  <div key={a.id} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">{a.name}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                          a.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                        }`}>
                          {a.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 block">Sahibi: {a.owner.email}</span>
                      <span className="text-[10px] text-slate-400">{a.current_tester_count} / {a.target_tester_count} Testçi</span>
                    </div>

                    <button
                      onClick={() => handleToggleApp(a.id, a.status)}
                      className={`py-1.5 px-3 text-[11px] font-bold rounded-xl transition-colors ${
                        a.status === "ACTIVE"
                          ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      {a.status === "ACTIVE" ? "Durdur" : "Aktifleştir"}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 5. EMAILS TAB */}
            {activeTab === "emails" && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  E-posta Gönderim Kayıtları
                </h4>

                {data.emailLogs.map((log: any) => (
                  <div key={log.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{log.to_email}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                        log.status === "SENT"
                          ? "bg-emerald-100 text-emerald-700"
                          : log.status === "SIMULATED"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-rose-100 text-rose-700"
                      }`}>
                        {log.status}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 block">{log.subject}</span>
                    <span className="text-[9px] text-slate-400">Şablon: {log.template}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ADJUST CREDIT MODAL */}
      {selectedUserForCredit && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl">
            <h4 className="text-sm font-bold text-slate-900 mb-1">Kredi Düzenle</h4>
            <p className="text-xs text-slate-500 mb-3">{selectedUserForCredit.email}</p>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Miktar (+ veya -)</label>
                <input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Gerekçe</label>
                <input
                  type="text"
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedUserForCredit(null)}
                className="flex-1 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
              >
                İptal
              </button>
              <button
                onClick={handleAdjustCredit}
                className="flex-1 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl"
              >
                Uygula
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
