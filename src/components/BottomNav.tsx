"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { LayoutGrid, Layers, User as UserIcon } from "lucide-react";

export function BottomNav() {
  const { activeTab, setActiveTab, user, setIsAuthModalOpen } = useApp();

  const handleTabClick = (tab: "apps" | "tests" | "profile") => {
    if ((tab === "tests" || tab === "profile") && !user) {
      setIsAuthModalOpen(true);
      return;
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-100 py-2 px-6 flex items-center justify-around max-w-md mx-auto shadow-lg">
      {/* 1. Uygulamalar */}
      <button
        onClick={() => handleTabClick("apps")}
        className={`flex flex-col items-center gap-1 transition-all py-1 px-3 rounded-xl ${
          activeTab === "apps"
            ? "text-indigo-600 font-semibold scale-105"
            : "text-slate-400 hover:text-slate-600 font-normal"
        }`}
      >
        <LayoutGrid className="w-5 h-5 stroke-[2.2]" />
        <span className="text-[11px]">Uygulamalar</span>
      </button>

      {/* 2. Testlerim */}
      <button
        onClick={() => handleTabClick("tests")}
        className={`flex flex-col items-center gap-1 transition-all py-1 px-3 rounded-xl relative ${
          activeTab === "tests"
            ? "text-indigo-600 font-semibold scale-105"
            : "text-slate-400 hover:text-slate-600 font-normal"
        }`}
      >
        <Layers className="w-5 h-5 stroke-[2.2]" />
        <span className="text-[11px]">Testlerim</span>
        {user && (user.participatedTestsCount ?? 0) > 0 && (
          <span className="absolute top-1 right-2 w-2 h-2 bg-indigo-500 rounded-full" />
        )}
      </button>

      {/* 3. Profilim */}
      <button
        onClick={() => handleTabClick("profile")}
        className={`flex flex-col items-center gap-1 transition-all py-1 px-3 rounded-xl ${
          activeTab === "profile"
            ? "text-indigo-600 font-semibold scale-105"
            : "text-slate-400 hover:text-slate-600 font-normal"
        }`}
      >
        <UserIcon className="w-5 h-5 stroke-[2.2]" />
        <span className="text-[11px]">Profilim</span>
      </button>
    </nav>
  );
}
