import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { ToastContainer } from "@/components/ToastContainer";

export const metadata: Metadata = {
  title: "Android Test Havuzu — Kapalı Beta Test Platformu",
  description: "Android uygulamalarını test et, kredi kazan, kendi uygulamana testçi bul.",
  icons: {
    icon: "/icons/logo.svg",
    apple: "/icons/logo.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className="h-full antialiased bg-slate-100">
      <body className="min-h-full flex flex-col font-sans text-slate-800 select-none selection:bg-indigo-500 selection:text-white">
        <AppProvider>
          <ToastContainer />
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
