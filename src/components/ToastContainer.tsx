"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export function ToastContainer() {
  const { toasts } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 p-3.5 rounded-2xl shadow-lg border text-sm font-medium transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
            toast.type === "success"
              ? "bg-white text-emerald-800 border-emerald-200 shadow-emerald-500/10"
              : toast.type === "error"
              ? "bg-white text-rose-800 border-rose-200 shadow-rose-500/10"
              : "bg-white text-indigo-900 border-indigo-100 shadow-indigo-500/10"
          }`}
        >
          {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
          {toast.type === "error" && <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />}
          {toast.type === "info" && <Info className="w-5 h-5 text-indigo-500 shrink-0" />}
          <span className="flex-1">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
