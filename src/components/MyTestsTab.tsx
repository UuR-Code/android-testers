"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useApp, AppItem } from "@/context/AppContext";
import {
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Coins,
  Send,
} from "lucide-react";

interface TestItem {
  id: string;
  app_id: string;
  app_name: string;
  category: string;
  icon_url: string;
  opt_in_url: string;
  store_url?: string | null;
  status: "JOINED" | "INVITED" | "CLAIMED_TESTED" | "APPROVED" | "REJECTED";
  joined_at: string;
  invited_at?: string | null;
  claimed_tested_at?: string | null;
  approved_at?: string | null;
  feedback_type?: string | null;
  feedback_text?: string | null;
  rejection_reason?: string | null;
  earned_credits: number;
  days_remaining: number;
  days_tested: number;
}

export function MyTestsTab() {
  const {
    user,
    setIsAuthModalOpen,
    setIsFeedbackModalOpen,
    setSelectedParticipationApp,
    setOpenedApp,
    setActiveTab,
  } = useApp();

  const [tests, setTests] = useState<TestItem[]>([]);
  const [summary, setSummary] = useState({
    total_joined: 0,
    total_approved: 0,
    total_credits_earned: 0,
  });
  const [filter, setFilter] = useState<"all" | "ongoing" | "pending" | "completed">("all");
  const [isLoading, setIsLoading] = useState(true);

  const fetchMyTests = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/my-tests?filter=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setTests(data.tests || []);
        if (data.summary) {
          setSummary(data.summary);
        }
      }
    } catch (e) {
      console.error("Fetch tests error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (user) {
      fetchMyTests();
    } else {
      setIsLoading(false);
    }
  }, [user, fetchMyTests]);

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
    } catch (e) {
      return dateString;
    }
  };

  const getStatusBadge = (status: TestItem["status"]) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Onaylandı</span>
          </span>
        );
      case "CLAIMED_TESTED":
        return (
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Onay Bekliyor</span>
          </span>
        );
      case "INVITED":
        return (
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 flex items-center gap-1">
            <span>Davet Hazır</span>
          </span>
        );
      case "REJECTED":
        return (
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            <span>Reddedildi</span>
          </span>
        );
      case "JOINED":
      default:
        return (
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 flex items-center gap-1">
            <span>Devam Ediyor</span>
          </span>
        );
    }
  };

  const handleOpenFeedback = (test: TestItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedParticipationApp({
      id: test.app_id,
      name: test.app_name,
      category: test.category,
      icon_url: test.icon_url,
      opt_in_url: test.opt_in_url,
      store_url: test.store_url,
      status: "ACTIVE",
      target_tester_count: 20,
      current_tester_count: 0,
      is_full: false,
      is_owner: false,
      description: null,
      created_at: test.joined_at,
    });
    setIsFeedbackModalOpen(true);
  };

  return (
    <div className="pb-24">
      {/* Top Header */}
      <div className="p-4 bg-white border-b border-slate-100">
        <h2 className="text-base font-bold text-slate-900 tracking-tight mb-3">
          Testlerim
        </h2>

        {/* 3 Summary Badges (Matches Section 8) */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-2.5 text-center">
            <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">
              Katıldığım
            </span>
            <span className="text-sm font-bold text-slate-800">
              {summary.total_joined}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-2.5 text-center">
            <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">
              Onaylanan
            </span>
            <span className="text-sm font-bold text-emerald-600">
              {summary.total_approved}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-2.5 text-center">
            <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">
              Kazanılan
            </span>
            <span className="text-sm font-bold text-indigo-600">
              +{summary.total_credits_earned} Kredi
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs (Tümü, Devam Eden, Onay Bekleyen, Tamamlanan) */}
      <div className="p-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filter === "all"
                ? "bg-indigo-600 text-white shadow-2xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Tümü
          </button>
          <button
            onClick={() => setFilter("ongoing")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filter === "ongoing"
                ? "bg-indigo-600 text-white shadow-2xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Devam Eden
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filter === "pending"
                ? "bg-indigo-600 text-white shadow-2xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Onay Bekleyen
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filter === "completed"
                ? "bg-indigo-600 text-white shadow-2xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Tamamlanan
          </button>
        </div>
      </div>

      {/* Tests List */}
      <div className="px-4 space-y-3">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-500 mb-2" />
            <span className="text-xs">Testler yükleniyor...</span>
          </div>
        ) : tests.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-3xl border border-slate-100 p-6 shadow-2xs">
            <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">Henüz katıldığınız test yok</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto mb-4">
              Test havuzundaki uygulamaları test ederek kredi kazanmaya hemen başla.
            </p>
            <button
              onClick={() => setActiveTab("apps")}
              className="py-2.5 px-4 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              Test Havuzunu İncele
            </button>
          </div>
        ) : (
          tests.map((test) => (
            <div
              key={test.id}
              className="bg-white rounded-3xl p-4 border border-slate-100 shadow-2xs hover:shadow-sm transition-all"
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 shadow-2xs bg-slate-50 border border-slate-100 flex items-center justify-center">
                    <Image
                      src={test.icon_url || "/icons/brandlook.svg"}
                      alt={test.app_name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      {test.app_name}
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      Katılım: {formatDate(test.joined_at)}
                    </span>
                  </div>
                </div>

                {getStatusBadge(test.status)}
              </div>

              {/* 14 Day closed beta tracking banner */}
              <div className="py-1.5 px-2.5 bg-slate-50 rounded-xl text-[10px] text-slate-500 flex items-center justify-between mb-3 border border-slate-100">
                <span>14 Günlük Kapalı Beta Süreci:</span>
                <span className="font-semibold text-slate-700">
                  {test.days_tested}. gün ({test.days_remaining} gün kaldı)
                </span>
              </div>

              {/* Rejection reason if rejected */}
              {test.status === "REJECTED" && test.rejection_reason && (
                <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-[11px] text-rose-700 mb-3">
                  <strong>Reddedilme Nedeni:</strong> {test.rejection_reason}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <a
                  href={test.opt_in_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <span>Play Store Testi</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                {test.status === "JOINED" || test.status === "INVITED" ? (
                  <button
                    onClick={(e) => handleOpenFeedback(test, e)}
                    className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-2xs active:scale-95 transition-all flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>Test Ettim</span>
                  </button>
                ) : test.status === "APPROVED" ? (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-amber-500" />
                    <span>+1 Kredi Kazanıldı</span>
                  </span>
                ) : test.status === "CLAIMED_TESTED" ? (
                  <span className="text-xs font-medium text-amber-600">
                    Onay Bekleniyor
                  </span>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
