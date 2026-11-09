"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useApp } from "@/context/AppContext";
import { X, ShieldCheck, Mail, ArrowRight, Sparkles, RefreshCw } from "lucide-react";

export function AuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen, refreshUser, showToast, loginAsDemo, setUser } = useApp();

  const [step, setStep] = useState<"welcome" | "input" | "otp">("input");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(60);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [debugOtpCode, setDebugOtpCode] = useState<string | null>(null);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === "otp" && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  if (!isAuthModalOpen) return null;

  const handleSendOtp = async (targetEmail?: string) => {
    const emailToSend = targetEmail || email;
    if (!emailToSend || !emailToSend.includes("@gmail.com")) {
      showToast("Lütfen geçerli bir @gmail.com adresi girin.", "error");
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToSend }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast("6 haneli doğrulama kodu gönderildi!", "success");
        setStep("otp");
        setCountdown(60);
        if (data.debugCode) {
          setDebugOtpCode(data.debugCode);
        }
      } else {
        showToast(data.error || "Kod gönderilemedi", "error");
      }
    } catch (e) {
      showToast("Bağlantı hatası", "error");
    } finally {
      setIsSending(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste of whole 6-digit code
      const pasted = value.replace(/\D/g, "").slice(0, 6).split("");
      const newOtp = [...otp];
      pasted.forEach((char, idx) => {
        if (index + idx < 6) newOtp[index + idx] = char;
      });
      setOtp(newOtp);
      const nextIdx = Math.min(5, index + pasted.length);
      otpInputsRef.current[nextIdx]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value.replace(/\D/g, "");
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      showToast("Lütfen 6 haneli kodu eksiksiz girin.", "error");
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        if (data.user) {
          setUser(data.user);
        }
        showToast("Giriş başarılı! Hoş geldiniz.", "success");
        await refreshUser();
        setIsAuthModalOpen(false);
        setStep("input");
        setOtp(["", "", "", "", "", ""]);
      } else {
        showToast(data.error || "Kod doğrulanamadı", "error");
      }
    } catch (e) {
      showToast("Doğrulama hatası", "error");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAutofillDebugCode = () => {
    if (debugOtpCode && debugOtpCode.length === 6) {
      setOtp(debugOtpCode.split(""));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 overflow-hidden">
        {/* Close button */}
        <button
          onClick={() => {
            setIsAuthModalOpen(false);
            setStep("input");
          }}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* STEP 1: WELCOME SCREEN (Matches Mockup Screen 1) */}
        {step === "welcome" && (
          <div className="text-center py-4 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-2 shadow-md mb-4 flex items-center justify-center">
              <Image
                src="/icons/logo.svg"
                alt="Android Test Havuzu"
                width={56}
                height={56}
                className="w-full h-full object-contain"
              />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">Android Test Havuzu</h2>
            <p className="text-xs text-indigo-600 font-semibold mb-6">Kredi Tabanlı Kapalı Beta Platformu</p>

            <div className="bg-indigo-50/60 rounded-2xl p-4 mb-6 border border-indigo-100/80">
              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                Android uygulamalarını test et, kredi kazan, kendi uygulamana testçi bul.
              </p>
            </div>

            <button
              onClick={() => setStep("input")}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl font-semibold text-sm shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              <span>Hemen Başla</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: LOGIN SCREEN (Matches Mockup Screen 2) */}
        {step === "input" && (
          <div className="py-2">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-1.5 shadow-sm mb-3 flex items-center justify-center">
                <Image
                  src="/icons/logo.svg"
                  alt="Android Test Havuzu"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Giriş Yap</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Hesabına hızlı ve güvenli şekilde giriş yap. Şifre gerekmez.
              </p>
            </div>

            {/* Google ile Devam Et button */}
            <button
              onClick={() => loginAsDemo("uur@gmail.com")}
              className="w-full py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl font-medium text-xs flex items-center justify-center gap-2.5 shadow-2xs hover:shadow-xs transition-all active:scale-[0.99] mb-4"
            >
              {/* Google G logo */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Google ile Devam Et</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] text-slate-400 font-medium absolute">veya</span>
            </div>

            {/* Gmail address input */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Gmail Adresin
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@gmail.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Submit button */}
            <button
              onClick={() => handleSendOtp()}
              disabled={isSending || !email}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white rounded-2xl font-semibold text-xs shadow-md shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Kod Gönderiliyor...</span>
                </>
              ) : (
                <span>Doğrulama Kodu Gönder</span>
              )}
            </button>

            {/* Gmail restriction notice badge */}
            <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Sadece Gmail (@gmail.com) hesapları ile katılım kabul edilir.</span>
            </div>

            {/* Fast Demo Accounts Helper */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <p className="text-[10px] text-center font-bold tracking-wider uppercase text-slate-400 mb-2">
                Hızlı Test Girişi
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => loginAsDemo("uur@gmail.com")}
                  className="py-2 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/60 rounded-xl text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
                >
                  <span>👤 Uur (7 Kredi)</span>
                </button>
                <button
                  type="button"
                  onClick={() => loginAsDemo("admin@gmail.com")}
                  className="py-2 px-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/60 rounded-xl text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
                >
                  <span>⚡ Admin (Yönetici)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: OTP VERIFICATION SCREEN (Matches Mockup Screen 3) */}
        {step === "otp" && (
          <div className="py-2 text-center">
            {/* Illustration */}
            <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-3 text-indigo-600 shadow-2xs">
              <Sparkles className="w-7 h-7" />
            </div>

            <h2 className="text-lg font-bold text-slate-900 mb-1">Doğrulama Kodu</h2>
            <p className="text-xs text-slate-500 mb-1 px-2">
              <strong className="text-slate-700 font-semibold">{email}</strong> adresine gönderdiğimiz 6 haneli kodu gir.
            </p>

            {/* Debug helper code if available */}
            {debugOtpCode && (
              <div
                onClick={handleAutofillDebugCode}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-[11px] font-semibold text-amber-800 cursor-pointer hover:bg-amber-100 transition-colors my-2 animate-bounce"
                title="Kodu otomatik doldurmak için tıkla"
              >
                <span>Kod: <strong>{debugOtpCode}</strong> (Doldurmak için tıkla)</span>
              </div>
            )}

            {/* 6 Digit Input Boxes */}
            <div className="flex justify-center gap-2 my-5">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    otpInputsRef.current[index] = el;
                  }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="w-10 h-12 text-center text-lg font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all shadow-2xs"
                />
              ))}
            </div>

            {/* Verify button */}
            <button
              onClick={handleVerifyOtp}
              disabled={isVerifying || otp.join("").length !== 6}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white rounded-2xl font-semibold text-xs shadow-md shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mb-3"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Doğrulanıyor...</span>
                </>
              ) : (
                <span>Doğrula</span>
              )}
            </button>

            {/* Resend timer */}
            <div className="text-xs text-slate-500">
              Kodu almadın mı?{" "}
              {countdown > 0 ? (
                <span className="text-indigo-600 font-semibold">Tekrar Gönder ({countdown} sn)</span>
              ) : (
                <button
                  onClick={() => handleSendOtp()}
                  className="text-indigo-600 font-semibold hover:underline"
                >
                  Tekrar Gönder
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
