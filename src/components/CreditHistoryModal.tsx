"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { ArrowLeft, ArrowDownRight, ArrowUpRight, Coins, RefreshCw } from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  balance_after: number;
  transaction_type: string;
  description: string;
  created_at: string;
}

export function CreditHistoryModal() {
  const { isCreditsModalOpen, setIsCreditsModalOpen } = useApp();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isCreditsModalOpen) {
      setIsLoading(true);
      fetch("/api/credits")
        .then((res) => res.json())
        .then((data) => {
          setBalance(data.balance ?? 0);
          setTotalEarned(data.total_earned ?? 0);
          setTotalSpent(data.total_spent ?? 0);
          setTransactions(data.transactions || []);
        })
        .finally(() => setIsLoading(false));
    }
  }, [isCreditsModalOpen]);

  if (!isCreditsModalOpen) return null;

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col max-w-md mx-auto shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200">
      {/* Top Bar */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <button
          onClick={() => setIsCreditsModalOpen(false)}
          className="p-2 -ml-2 rounded-full text-slate-600 hover:bg-slate-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 className="font-bold text-sm text-slate-800">Kredi Hareketlerim</h3>
        <div className="w-5" />
      </div>

      <div className="p-4 pb-20 space-y-4">
        {/* 3 Summary Pills (Matches Screen 12) */}
        <div className="grid grid-cols-3 gap-2">
          {/* +X Kazanılan */}
          <div className="bg-emerald-50/80 border border-emerald-100 rounded-2xl p-3 text-center">
            <span className="text-base font-black text-emerald-600 block leading-tight">
              +{totalEarned}
            </span>
            <span className="text-[10px] font-semibold text-emerald-700">Kazanılan</span>
          </div>

          {/* -X Harcanan */}
          <div className="bg-rose-50/80 border border-rose-100 rounded-2xl p-3 text-center">
            <span className="text-base font-black text-rose-600 block leading-tight">
              -{totalSpent}
            </span>
            <span className="text-[10px] font-semibold text-rose-700">Harcanan</span>
          </div>

          {/* X Mevcut */}
          <div className="bg-purple-50/80 border border-purple-100 rounded-2xl p-3 text-center">
            <span className="text-base font-black text-purple-700 block leading-tight">
              {balance}
            </span>
            <span className="text-[10px] font-semibold text-purple-800">Mevcut</span>
          </div>
        </div>

        {/* Transactions List */}
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            İşlem Geçmişi
          </h4>

          {isLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Yükleniyor...</div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center bg-slate-50 rounded-2xl p-6 text-slate-400 text-xs">
              Henüz kredi hareketi bulunmuyor.
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 divide-y divide-slate-100 shadow-2xs overflow-hidden">
              {transactions.map((t) => {
                const isPositive = t.amount > 0;
                return (
                  <div key={t.id} className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isPositive
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-rose-50 text-rose-600"
                        }`}
                      >
                        {isPositive ? (
                          <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-xs text-slate-900 block">
                          {t.description}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatDate(t.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-sm font-black ${
                          isPositive ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {isPositive ? `+${t.amount}` : t.amount}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Kalan: {t.balance_after}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
