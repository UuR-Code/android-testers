"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  Coins,
  Smartphone,
  History,
  Settings,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  ShieldAlert,
  Check,
  RefreshCw,
  Download,
  AlertCircle,
  AlertTriangle,
  Edit3,
  Trash2,
  X,
  Sparkles,
} from "lucide-react";

export function ProfileTab() {
  const {
    user,
    logout,
    setIsAuthModalOpen,
    setIsCreditsModalOpen,
    setIsAdminModalOpen,
    setIsTestersModalOpen,
    setManagingAppId,
    showToast,
    refreshUser,
  } = useApp();

  const [isMyAppsOpen, setIsMyAppsOpen] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [isTogglingNotification, setIsTogglingNotification] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice?.outcome === "accepted") {
        showToast("Uygulama başarıyla ana ekrana eklendi!", "success");
      }
      setDeferredPrompt(null);
    } else {
      showToast(
        "Tarayıcınızın menüsünden (⋮ veya Paylaş) 'Ana Ekrana Ekle' seçeneğini kullanabilirsiniz.",
        "info"
      );
    }
  };

  if (!user) {
    return (
      <div className="p-6 text-center py-20">
        <h3 className="text-base font-bold text-slate-800 mb-2">Profilinize Erişin</h3>
        <p className="text-xs text-slate-500 mb-6 max-w-xs mx-auto">
          Kredi bakiyenizi görmek, uygulamalarınızı yönetmek ve testlerinizi takip etmek için giriş yapın.
        </p>
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-md transition-all"
        >
          Giriş Yap
        </button>
      </div>
    );
  }

  const handleToggleNotifications = async () => {
    setIsTogglingNotification(true);
    try {
      const nextVal = !user.email_notifications;
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_notifications: nextVal }),
      });
      if (res.ok) {
        await refreshUser();
        showToast(
          nextVal ? "E-posta bildirimleri açıldı." : "E-posta bildirimleri kapatıldı.",
          "info"
        );
      }
    } catch (e) {
      showToast("Ayar güncellenemedi", "error");
    } finally {
      setIsTogglingNotification(false);
    }
  };

  return (
    <div className="pb-24">
      {/* User Header */}
      <div className="p-4 bg-white border-b border-slate-100 flex items-center gap-3.5">
        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-black text-xl flex items-center justify-center shadow-md">
          {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 leading-tight">
              {user.name || "Kullanıcı"}
            </h2>
            {user.role === "ADMIN" && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                Admin
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500 block">{user.email}</span>
        </div>
      </div>

      {/* Suspension / Warning Notice */}
      {user.is_suspended ? (
        <div className="mx-4 mt-4 p-3.5 bg-rose-50 border border-rose-300 rounded-2xl flex items-start gap-2.5 text-rose-900 shadow-2xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold">Hesabınız Sistemden Uzaklaştırıldı 🚫</h4>
            <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
              3 kez hatalı test bildirimi ve doğrulama uyarısı aldığınız için hesabınız askıya alınmıştır. Testlere katılamaz ve uygulama ekleyemezsiniz.
            </p>
          </div>
        </div>
      ) : user.warning_count && user.warning_count > 0 ? (
        <div className="mx-4 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-semibold">Doğrulama Uyarı Durumu:</span>
          </div>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-200/90 text-amber-900">
            {user.warning_count} / 3 Uyarı
          </span>
        </div>
      ) : null}

      <div className="p-4 space-y-4">
        {/* Purple Gradient Credit Card (Matches Screen 11) */}
        <div
          onClick={() => setIsCreditsModalOpen(true)}
          className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-3xl p-5 text-white shadow-lg shadow-indigo-500/25 cursor-pointer hover:opacity-95 transition-all relative overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner">
                🪙
              </div>
              <div>
                <span className="text-xs text-indigo-200 font-semibold block">
                  Kredi Bakiyem
                </span>
                <span className="text-2xl font-black tracking-tight">
                  {user.credit_balance}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-semibold text-indigo-100 bg-white/15 px-3 py-1.5 rounded-xl backdrop-blur-md">
              <span>Geçmiş</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Menu Navigation List */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-2xs divide-y divide-slate-100/80 overflow-hidden">
          {/* Benim Uygulamalarım */}
          <button
            onClick={() => setIsMyAppsOpen(true)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Benim Uygulamalarım
                </span>
                <span className="text-[11px] text-slate-400">
                  {user.ownedAppsCount ?? 0} uygulama yönetiliyor
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Kredi Hareketlerim */}
          <button
            onClick={() => setIsCreditsModalOpen(true)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <History className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Kredi Hareketlerim
                </span>
                <span className="text-[11px] text-slate-400">
                  Kazanılan ve harcanan krediler
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Bildirim Tercihleri (Toggle Switch) */}
          <div className="w-full p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Bildirim Tercihleri
                </span>
                <span className="text-[11px] text-slate-400">
                  E-posta hatırlatma ve onay mailleri
                </span>
              </div>
            </div>

            {/* Switch */}
            <button
              onClick={handleToggleNotifications}
              disabled={isTogglingNotification}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                user.email_notifications !== false ? "bg-indigo-600" : "bg-slate-300"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                  user.email_notifications !== false ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Yönetici Paneli (Only for ADMIN) */}
          {user.role === "ADMIN" && (
            <button
              onClick={() => setIsAdminModalOpen(true)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors bg-purple-50/40"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-purple-900 block">
                    Yönetici Paneli (Admin)
                  </span>
                  <span className="text-[11px] text-purple-600 font-medium">
                    Sistem ayarları, kullanıcılar ve krediler
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-purple-500" />
            </button>
          )}

          {/* Uygulamayı Yükle (PWA) */}
          <button
            onClick={handleInstallApp}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Uygulamayı Cihaza Yükle (PWA)
                </span>
                <span className="text-[11px] text-slate-400">
                  Ana ekrana ekle, daha hızlı ve tam ekran kullan
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Yardım & SSS */}
          <button
            onClick={() => setIsFaqOpen(true)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Yardım & SSS
                </span>
                <span className="text-[11px] text-slate-400">
                  Google Play kapalı beta kuralları ve kredi işleyişi
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Çıkış Yap */}
          <button
            onClick={logout}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-rose-50/40 transition-colors text-rose-600"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <LogOut className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold block">Çıkış Yap</span>
            </div>
            <ChevronRight className="w-4 h-4 text-rose-400" />
          </button>
        </div>
      </div>

      {/* SSS MODAL */}
      {isFaqOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-3">Sıkça Sorulan Sorular</h3>
            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-2xl">
                <strong className="text-slate-900 block mb-1">Kredi nasıl kazanırım?</strong>
                Havuzdaki uygulamalara katılıp Google Play üzerinden indirin ve kontrol sorusunu yanıtlayın. Doğrulama başarılı olunca anında <strong>+1 kredi</strong> hesabınıza aktarılır.
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <strong className="text-slate-900 block mb-1">Kendi uygulamamı nasıl eklerim?</strong>
                10 kredi biriktirdikten sonra "Uygulama Ekle" butonuna basarak Google Play kapalı test bağlantınızla uygulamanızı yayınlayabilirsiniz.
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <strong className="text-slate-900 block mb-1">Play Console'a e-postaları nasıl aktarırım?</strong>
                "Benim Uygulamalarım" ekranından "CSV İndir" butonuna basarak güncel Gmail listesini tek tıkla alıp Google Play Console'a yükleyebilirsiniz.
              </div>
            </div>
            <button
              onClick={() => setIsFaqOpen(false)}
              className="mt-4 w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
            >
              Kapat
            </button>
          </div>
        </div>
      )}

      {/* MY APPS MODAL TRIGGER */}
      {isMyAppsOpen && <MyAppsModalWrapper onClose={() => setIsMyAppsOpen(false)} />}
    </div>
  );
}

// Wrapper for MyAppsModal to manage owner dashboard view
function MyAppsModalWrapper({ onClose }: { onClose: () => void }) {
  const { setOpenedApp, setIsTestersModalOpen, setManagingAppId, showToast, refreshUser } = useApp();
  const [apps, setApps] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Edit app state
  const [editingApp, setEditingApp] = React.useState<any>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = React.useState(false);

  // Delete / cancel app state
  const [deletingApp, setDeletingApp] = React.useState<any>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const fetchApps = React.useCallback(() => {
    setIsLoading(true);
    fetch("/api/my-apps")
      .then((res) => res.json())
      .then((data) => {
        setApps(data.apps || []);
      })
      .finally(() => setIsLoading(false));
  }, []);

  React.useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp) return;

    setIsSubmittingEdit(true);
    try {
      const res = await fetch(`/api/apps/${editingApp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingApp.name,
          category: editingApp.category,
          description: editingApp.description,
          opt_in_url: editingApp.opt_in_url,
          store_url: editingApp.store_url,
          google_group_url: editingApp.google_group_url,
          verification_question: editingApp.verification_question,
          verification_answer: editingApp.verification_answer,
          note_for_testers: editingApp.note_for_testers,
        }),
      });

      const d = await res.json();
      if (res.ok && d.success) {
        showToast("Uygulama başarıyla güncellendi!", "success");
        setEditingApp(null);
        fetchApps();
      } else {
        showToast(d.error || "Güncelleme başarısız", "error");
      }
    } catch (e) {
      showToast("Bağlantı hatası", "error");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingApp) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/apps/${deletingApp.id}`, {
        method: "DELETE",
      });

      const d = await res.json();
      if (res.ok && d.success) {
        showToast(d.message || "İşlem başarılı", "success");
        setDeletingApp(null);
        await refreshUser();
        fetchApps();
      } else {
        showToast(d.error || "İşlem başarısız", "error");
      }
    } catch (e) {
      showToast("Bağlantı hatası", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col max-w-md mx-auto shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200">
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <button onClick={onClose} className="p-2 -ml-2 rounded-full text-slate-600 hover:bg-slate-100">
          <ChevronRight className="w-5 h-5 rotate-180" />
        </button>
        <h3 className="font-bold text-sm text-slate-800">Benim Uygulamalarım</h3>
        <div className="w-5" />
      </div>

      <div className="p-4 pb-20 space-y-4">
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Yükleniyor...</div>
        ) : apps.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 rounded-3xl p-6">
            <Smartphone className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">Yayınlanmış uygulamanız yok</h4>
            <p className="text-xs text-slate-400 mt-1">
              Kredi biriktirerek kendi uygulamanızı ekleyip 20 testçi toplayabilirsiniz.
            </p>
          </div>
        ) : (
          apps.map((app) => {
            const percent = Math.min(100, Math.round((app.current_tester_count / app.target_tester_count) * 100));

            return (
              <div key={app.id} className="bg-white rounded-3xl p-4 border border-slate-100 shadow-2xs space-y-3">
                {/* Header (Matches Screen 10) */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-2xs border border-slate-100 flex items-center justify-center">
                      <img src={app.icon_url} alt={app.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{app.name}</h4>
                      <span className="text-[11px] text-slate-400">{app.category}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    app.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}>
                    {app.status === "ACTIVE" ? "Aktif" : "Durduruldu"}
                  </span>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1">
                    <span>Testçi: {app.current_tester_count} / {app.target_tester_count}</span>
                    <span>%{percent}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* 14-Day Google Play Status Card */}
                {app.is_14_days_completed ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>🎉 14 Günlük Kapalı Beta Tamamlandı!</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 leading-relaxed">
                      Zorunlu 14 günlük test süreci başarıyla doldu! Google Play Console üzerinden uygulamanızı Üretim (Production) onayına gönderebilirsiniz.
                    </p>
                  </div>
                ) : app.is_target_reached ? (
                  <div className="p-2.5 bg-indigo-50 border border-indigo-200/80 rounded-2xl flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-indigo-950">14 Günlük Süreç:</span>
                    <span className="font-bold text-indigo-700">{app.days_passed}. gün ({app.days_remaining} gün kaldı)</span>
                  </div>
                ) : (
                  <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between text-[11px] text-slate-600">
                    <span>14 Günlük Süreç:</span>
                    <span className="font-medium text-slate-700">{app.current_tester_count}/20 testçi (20 olunca başlar)</span>
                  </div>
                )}

                {/* 3 Summary boxes (Matches Screen 10) */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-2.5 text-center">
                    <span className="text-base font-black text-emerald-700 block leading-tight">
                      {app.approved_count}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-600">Onaylanan</span>
                  </div>

                  <div className="bg-amber-50/70 border border-amber-100 rounded-2xl p-2.5 text-center">
                    <span className="text-base font-black text-amber-700 block leading-tight">
                      {app.pending_count}
                    </span>
                    <span className="text-[10px] font-semibold text-amber-600">Onay Bekleyen</span>
                  </div>

                  <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-2.5 text-center">
                    <span className="text-base font-black text-blue-700 block leading-tight">
                      {app.current_tester_count}
                    </span>
                    <span className="text-[10px] font-semibold text-blue-600">Toplam</span>
                  </div>
                </div>

                {/* Management Action Rows (Matches Screen 10) */}
                <div className="pt-2 border-t border-slate-100 divide-y divide-slate-100/80">
                  {/* Testçi Listesi (14) > */}
                  <button
                    onClick={() => {
                      setManagingAppId(app.id);
                      setIsTestersModalOpen(true);
                    }}
                    className="w-full py-2.5 flex items-center justify-between text-xs font-bold text-slate-800 hover:text-indigo-600 transition-colors"
                  >
                    <span>Testçi Listesi ({app.current_tester_count})</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  {/* Hatırlatma Maili Gönder > */}
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/apps/${app.id}/testers`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: "REMIND" }),
                        });
                        const d = await res.json();
                        showToast(d.message || "İşlem tamamlandı", d.success ? "success" : "info");
                      } catch (e) {
                        showToast("Hata oluştu", "error");
                      }
                    }}
                    className="w-full py-2.5 flex items-center justify-between text-xs font-bold text-slate-800 hover:text-indigo-600 transition-colors"
                  >
                    <span>Hatırlatma Maili Gönder</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  {/* CSV İndir (Gmail Listesi) > */}
                  <a
                    href={`/api/apps/${app.id}/csv`}
                    download
                    className="w-full py-2.5 flex items-center justify-between text-xs font-bold text-slate-800 hover:text-indigo-600 transition-colors"
                  >
                    <span>CSV İndir (Gmail Listesi)</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </a>

                  {/* Uygulamayı Düzenle > */}
                  <button
                    onClick={() => setEditingApp({ ...app })}
                    className="w-full py-2.5 flex items-center justify-between text-xs font-bold text-slate-800 hover:text-indigo-600 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Uygulamayı Düzenle</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  {/* Yayından Kaldır / İptal Et > */}
                  <button
                    onClick={() => setDeletingApp(app)}
                    className="w-full py-2.5 flex items-center justify-between text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>{app.current_tester_count === 0 ? "Uygulamayı İptal Et (+10 Kredi İadesi)" : "Yayından Kaldır"}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-rose-400" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* EDIT APP MODAL */}
      {editingApp && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h4 className="font-bold text-sm text-slate-800">Uygulamayı Düzenle</h4>
              <button onClick={() => setEditingApp(null)} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Uygulama Adı *</label>
                <input
                  type="text"
                  required
                  value={editingApp.name}
                  onChange={(e) => setEditingApp({ ...editingApp, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Kategori</label>
                <select
                  value={editingApp.category}
                  onChange={(e) => setEditingApp({ ...editingApp, category: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
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

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Play Store Test Linki *</label>
                <input
                  type="url"
                  required
                  value={editingApp.opt_in_url}
                  onChange={(e) => setEditingApp({ ...editingApp, opt_in_url: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-purple-900 mb-1">Google Grubu Bağlantısı (Önerilen)</label>
                <input
                  type="url"
                  value={editingApp.google_group_url || ""}
                  onChange={(e) => setEditingApp({ ...editingApp, google_group_url: e.target.value })}
                  placeholder="https://groups.google.com/g/ornek-grup"
                  className="w-full p-2.5 bg-purple-50/50 border border-purple-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Kontrol Sorusu *</label>
                <input
                  type="text"
                  required
                  value={editingApp.verification_question || ""}
                  onChange={(e) => setEditingApp({ ...editingApp, verification_question: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Doğru Cevap *</label>
                <input
                  type="text"
                  required
                  value={editingApp.verification_answer || ""}
                  onChange={(e) => setEditingApp({ ...editingApp, verification_answer: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Kısa Açıklama</label>
                <textarea
                  rows={2}
                  value={editingApp.description || ""}
                  onChange={(e) => setEditingApp({ ...editingApp, description: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingApp(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20"
                >
                  {isSubmittingEdit ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE / CANCEL CONFIRMATION MODAL */}
      {deletingApp && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl">
            <h4 className="text-sm font-bold text-slate-900 mb-2">
              {deletingApp.current_tester_count === 0 ? "Uygulamayı İptal Et & İade Al" : "Yayından Kaldır"}
            </h4>

            {deletingApp.current_tester_count === 0 ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-[11px] text-emerald-800 mb-4 space-y-1">
                <strong className="block font-bold">10 Kredi İadesi Yapılacak:</strong>
                <span>Bu uygulamaya henüz hiç testçi katılmadı. Uygulamayı iptal ettiğinizde harcanan <strong>10 kredi</strong> anında bakiyenize iade edilecektir.</span>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-800 mb-4 space-y-1">
                <strong className="block font-bold">Kredi İadesi Yapılamaz:</strong>
                <span>Bu uygulamaya şu ana kadar <strong>{deletingApp.current_tester_count} testçi</strong> katılmıştır. Yayından kaldırdığınızda yeni katılım alınmaz ancak harcanan kredi iade edilmez.</span>
              </div>
            )}

            <p className="text-xs text-slate-600 mb-4">
              <strong>"{deletingApp.name}"</strong> uygulamasını kaldırmak istediğinize emin misiniz?
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeletingApp(null)}
                className="flex-1 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl"
              >
                {isDeleting ? "İşleniyor..." : deletingApp.current_tester_count === 0 ? "İptal Et & İade Al" : "Kaldır"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
