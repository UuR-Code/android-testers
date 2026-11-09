"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  credit_balance: number;
  email_notifications?: boolean;
  unreadNotifications?: number;
  ownedAppsCount?: number;
  participatedTestsCount?: number;
}

export interface AppItem {
  id: string;
  name: string;
  category: string;
  description: string | null;
  icon_url: string;
  opt_in_url: string;
  store_url?: string | null;
  status: string;
  target_tester_count: number;
  current_tester_count: number;
  is_full: boolean;
  is_owner: boolean;
  note_for_testers?: string | null;
  created_at: string;
  my_participation?: {
    id: string;
    status: string;
    claimed_tested_at?: string | null;
    approved_at?: string | null;
  } | null;
  owner_stats?: {
    approvedCount: number;
    pendingCount: number;
    totalCount: number;
  } | null;
}

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoadingUser: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  loginAsDemo: (email: string) => Promise<boolean>;
  activeTab: "apps" | "tests" | "profile";
  setActiveTab: (tab: "apps" | "tests" | "profile") => void;
  // Modals & Sub-screens
  openedApp: AppItem | null;
  setOpenedApp: (app: AppItem | null) => void;
  isAddAppOpen: boolean;
  setIsAddAppOpen: (open: boolean) => void;
  isFeedbackModalOpen: boolean;
  setIsFeedbackModalOpen: (open: boolean) => void;
  selectedParticipationApp: AppItem | null;
  setSelectedParticipationApp: (app: AppItem | null) => void;
  isTestersModalOpen: boolean;
  setIsTestersModalOpen: (open: boolean) => void;
  managingAppId: string | null;
  setManagingAppId: (id: string | null) => void;
  isCreditsModalOpen: boolean;
  setIsCreditsModalOpen: (open: boolean) => void;
  isAdminModalOpen: boolean;
  setIsAdminModalOpen: (open: boolean) => void;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isSuccessModalOpen: boolean;
  setIsSuccessModalOpen: (open: boolean) => void;
  successModalData: { appName: string; optInUrl: string } | null;
  setSuccessModalData: (data: { appName: string; optInUrl: string } | null) => void;
  // Toasts
  toasts: Toast[];
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  triggerConfetti: () => void;
  // View mode
  isMobileFrame: boolean;
  setIsMobileFrame: (val: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [activeTab, setActiveTab] = useState<"apps" | "tests" | "profile">("apps");

  // Modals
  const [openedApp, setOpenedApp] = useState<AppItem | null>(null);
  const [isAddAppOpen, setIsAddAppOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [selectedParticipationApp, setSelectedParticipationApp] = useState<AppItem | null>(null);
  const [isTestersModalOpen, setIsTestersModalOpen] = useState(false);
  const [managingAppId, setManagingAppId] = useState<string | null>(null);
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successModalData, setSuccessModalData] = useState<{ appName: string; optInUrl: string } | null>(null);

  // View frame (mobile simulator on desktop or responsive)
  const [isMobileFrame, setIsMobileFrame] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const triggerConfetti = useCallback(async () => {
    try {
      const confetti = (await import("canvas-confetti")).default;
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#6366F1", "#8B5CF6", "#10B981", "#F59E0B"],
      });
    } catch (e) {
      // ignore
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch(`/api/auth/me?_t=${Date.now()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    } finally {
      setIsLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      showToast("Başarıyla çıkış yapıldı.", "info");
      setActiveTab("apps");
    } catch (e) {
      showToast("Çıkış yapılırken bir hata oluştu.", "error");
    }
  };

  const loginAsDemo = async (email: string) => {
    try {
      const res = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.user) {
          setUser(data.user);
        }
        await refreshUser();
        showToast(`Giriş yapıldı: ${email}`, "success");
        setIsAuthModalOpen(false);
        return true;
      } else {
        showToast(data.error || "Giriş başarısız", "error");
        return false;
      }
    } catch (e) {
      showToast("Bağlantı hatası", "error");
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        isLoadingUser,
        refreshUser,
        logout,
        loginAsDemo,
        activeTab,
        setActiveTab,
        openedApp,
        setOpenedApp,
        isAddAppOpen,
        setIsAddAppOpen,
        isFeedbackModalOpen,
        setIsFeedbackModalOpen,
        selectedParticipationApp,
        setSelectedParticipationApp,
        isTestersModalOpen,
        setIsTestersModalOpen,
        managingAppId,
        setManagingAppId,
        isCreditsModalOpen,
        setIsCreditsModalOpen,
        isAdminModalOpen,
        setIsAdminModalOpen,
        isNotificationsOpen,
        setIsNotificationsOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isSuccessModalOpen,
        setIsSuccessModalOpen,
        successModalData,
        setSuccessModalData,
        toasts,
        showToast,
        triggerConfetti,
        isMobileFrame,
        setIsMobileFrame,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
