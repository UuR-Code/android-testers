"use client";

import React from "react";
import Image from "next/image";
import { useApp } from "@/context/AppContext";
import { Bell, Coins, LogIn, Smartphone, Monitor } from "lucide-react";

export function Navbar() {
  const {
    user,
    setIsAuthModalOpen,
    setIsNotificationsOpen,
    setIsAddAppOpen,
    isMobileFrame,
    setIsMobileFrame,
    setActiveTab,
  } = useApp();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center justify-between transition-all">
      {/* Brand logo & title */}
      <div
        className="flex items-center gap-2.5 cursor-pointer"
        onClick={() => setActiveTab("apps")}
      >
        <div className="w-9 h-9 rounded-xl overflow-hidden shadow-sm bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center p-1.5 shrink-0">
          <Image
            src="/icons/logo.svg"
            alt="Android Test Havuzu"
            width={32}
            height={32}
            className="w-full h-full object-contain"
          />
        </div>
        <div>
          <h1 className="font-bold text-slate-900 text-sm tracking-tight leading-none">
            Android Test Havuzu
          </h1>
          <span className="text-[10px] text-slate-500 font-medium">Kapalı Beta Topluluğu</span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* Desktop frame switcher */}
        <button
          onClick={() => setIsMobileFrame(!isMobileFrame)}
          title={isMobileFrame ? "Geniş Ekran Modu" : "Mobil Çerçeve Modu"}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
        >
          {isMobileFrame ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
          <span>{isMobileFrame ? "Genişlet" : "Mobil Simülatör"}</span>
        </button>

        {user ? (
          <>
            {/* Notification bell */}
            <button
              onClick={() => setIsNotificationsOpen(true)}
              className="relative p-2 rounded-full text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
              title="Bildirimler"
            >
              <Bell className="w-5 h-5" />
              {(user.unreadNotifications ?? 0) > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white ring-1 ring-rose-300 animate-pulse" />
              )}
            </button>

            {/* Quick Credit Pill */}
            <div
              onClick={() => setActiveTab("profile")}
              className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/70 px-2.5 py-1 rounded-full cursor-pointer hover:bg-amber-100 transition-colors shadow-2xs"
            >
              <Coins className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-amber-800">{user.credit_balance}</span>
            </div>
          </>
        ) : (
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-sm transition-all active:scale-95"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Giriş Yap</span>
          </button>
        )}
      </div>
    </header>
  );
}
