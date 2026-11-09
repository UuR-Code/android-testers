"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { AppPoolTab } from "@/components/AppPoolTab";
import { MyTestsTab } from "@/components/MyTestsTab";
import { ProfileTab } from "@/components/ProfileTab";
import { AuthModal } from "@/components/AuthModal";
import { AppDetailModal } from "@/components/AppDetailModal";
import { SuccessJoinedModal } from "@/components/SuccessJoinedModal";
import { TestFeedbackModal } from "@/components/TestFeedbackModal";
import { AddAppModal } from "@/components/AddAppModal";
import { TestersManagementModal } from "@/components/TestersManagementModal";
import { CreditHistoryModal } from "@/components/CreditHistoryModal";
import { AdminModal } from "@/components/AdminModal";
import { NotificationsModal } from "@/components/NotificationsModal";

export default function HomePage() {
  const { activeTab, isMobileFrame } = useApp();

  return (
    <div className={`min-h-screen w-full flex items-center justify-center ${isMobileFrame ? "p-4 md:p-8 bg-slate-900" : "bg-slate-100"}`}>
      {/* Mobile Shell / Device Frame */}
      <div
        className={`w-full bg-slate-50 min-h-screen flex flex-col relative transition-all duration-300 ${
          isMobileFrame
            ? "max-w-sm rounded-[48px] shadow-2xl ring-12 ring-slate-800 overflow-hidden min-h-[840px] max-h-[90vh] my-auto border-4 border-slate-700"
            : "max-w-md shadow-2xl"
        }`}
      >
        {/* Device Notch / Speaker for Mobile Simulator */}
        {isMobileFrame && (
          <div className="w-full bg-white pt-3 pb-1 flex justify-center items-center z-40">
            <div className="w-24 h-4 bg-slate-900 rounded-full flex items-center justify-end px-3">
              <div className="w-2 h-2 rounded-full bg-indigo-950" />
            </div>
          </div>
        )}

        {/* Top Navbar */}
        <Navbar />

        {/* Main Tab Screen Content */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === "apps" && <AppPoolTab />}
          {activeTab === "tests" && <MyTestsTab />}
          {activeTab === "profile" && <ProfileTab />}
        </main>

        {/* Bottom Navigation */}
        <BottomNav />

        {/* All Modals & Sub-screens */}
        <AuthModal />
        <AppDetailModal />
        <SuccessJoinedModal />
        <TestFeedbackModal />
        <AddAppModal />
        <TestersManagementModal />
        <CreditHistoryModal />
        <AdminModal />
        <NotificationsModal />
      </div>
    </div>
  );
}
