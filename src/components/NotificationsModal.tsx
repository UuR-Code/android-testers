"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { ArrowLeft, Bell, Check, ExternalLink } from "lucide-react";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  is_read: boolean;
  created_at: string;
}

export function NotificationsModal() {
  const { isNotificationsOpen, setIsNotificationsOpen, refreshUser } = useApp();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isNotificationsOpen) {
      setIsLoading(true);
      fetch("/api/notifications")
        .then((res) => res.json())
        .then((data) => {
          setNotifications(data.notifications || []);
        })
        .finally(() => setIsLoading(false));
    }
  }, [isNotificationsOpen]);

  const handleMarkAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await refreshUser();
  };

  if (!isNotificationsOpen) return null;

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col max-w-md mx-auto shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200">
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <button
          onClick={() => setIsNotificationsOpen(false)}
          className="p-2 -ml-2 rounded-full text-slate-600 hover:bg-slate-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 className="font-bold text-sm text-slate-800">Bildirimler</h3>
        <button
          onClick={handleMarkAllRead}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
        >
          Tümünü Oku
        </button>
      </div>

      <div className="p-4 pb-20 space-y-2.5">
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Yükleniyor...</div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 rounded-2xl p-6 text-slate-400 text-xs">
            Henüz bildiriminiz yok.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-3.5 rounded-2xl border transition-all ${
                n.is_read
                  ? "bg-white border-slate-100"
                  : "bg-indigo-50/50 border-indigo-100"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                <span className="text-[10px] text-slate-400 shrink-0">
                  {formatDate(n.created_at)}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                {n.message}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
