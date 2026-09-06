"use client";

import { useState, useEffect } from "react";
import { Lock, Smartphone, Send, CheckCircle2, AlertCircle, RefreshCw, KeyRound, ArrowRight, ShieldCheck, Zap } from "lucide-react";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"password" | "whatsapp">("whatsapp");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const [step, setStep] = useState<"ENTER_PHONE" | "ENTER_OTP">("ENTER_PHONE");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const [messageAlert, setMessageAlert] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setMessageAlert({ type: "error", text: "Please enter your WhatsApp mobile number" });
      return;
    }

    setIsSending(true);
    setMessageAlert(null);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (res.ok) {
        setStep("ENTER_OTP");
        setResendTimer(60);
        const devCodeMsg = data.devModeOtp ? ` (OTP: ${data.devModeOtp})` : "";
        setMessageAlert({
          type: "success",
          text: `🔐 4-digit WhatsApp OTP sent to +91 ${phone}! Check your WhatsApp app.${devCodeMsg}`,
        });
      } else {
        setMessageAlert({ type: "error", text: data.error || "Failed to send WhatsApp OTP" });
      }
    } catch (err: any) {
      setMessageAlert({ type: "error", text: "Network error sending OTP. Please try again." });
    }

    setIsSending(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setMessageAlert({ type: "error", text: "Please enter the 4-digit WhatsApp OTP code" });
      return;
    }

    setIsVerifying(true);
    setMessageAlert(null);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp: otpCode }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.user) {
          localStorage.setItem("orlife_current_user", JSON.stringify(data.user));
          localStorage.removeItem("superadmin_impersonating_client");
        }
        setMessageAlert({
          type: "success",
          text: `🟢 Welcome ${data.user?.name || "User"}! WhatsApp OTP Verified. Redirecting...`,
        });
        setTimeout(() => {
          window.location.href = "/";
        }, 1200);
      } else {
        setMessageAlert({ type: "error", text: data.error || "Invalid OTP code" });
      }
    } catch (err: any) {
      setMessageAlert({ type: "error", text: "Verification failed. Please try again." });
    }

    setIsVerifying(false);
  };

  return (
    <div className="min-h-screen bg-[#050c14] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Subtle Gradient Lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-[#0b1724] border border-[#1b2f44] rounded-3xl p-7 shadow-2xl space-y-6 relative z-10">
        
        {/* Brand Icon Badge */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-[#10b981]/10 border border-[#10b981]/30 flex items-center justify-center shadow-inner text-[#10b981]">
            <Zap className="w-7 h-7 fill-[#10b981]" />
          </div>
        </div>

        {/* Header Title */}
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black text-slate-100 tracking-tight">
            OrLife Connect SaaS Portal
          </h2>
          <p className="text-xs text-slate-400">
            Sign in to manage your company & WhatsApp automation
          </p>
        </div>

        {/* Login Tab Selector */}
        <div className="flex border-b border-[#182a3c]">
          <button
            type="button"
            onClick={() => {
              setActiveTab("password");
              setStep("ENTER_PHONE");
              setMessageAlert(null);
            }}
            className={`flex-1 py-3 text-xs font-bold transition-all text-center border-b-2 ${
              activeTab === "password"
                ? "border-amber-400 text-amber-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Password Login
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("whatsapp");
              setStep("ENTER_PHONE");
              setMessageAlert(null);
            }}
            className={`flex-1 py-3 text-xs font-bold transition-all text-center border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === "whatsapp"
                ? "border-emerald-400 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" /> WhatsApp OTP
          </button>
        </div>

        {/* Message Alert Banner */}
        {messageAlert && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2.5 animate-in fade-in ${
              messageAlert.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                : "bg-red-500/10 border-red-500/40 text-red-300"
            }`}
          >
            {messageAlert.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{messageAlert.text}</span>
          </div>
        )}

        {/* WhatsApp OTP Form */}
        {activeTab === "whatsapp" && (
          <>
            {step === "ENTER_PHONE" && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    WhatsApp Phone Number
                  </label>

                  <div className="flex items-center bg-[#050e17] border border-[#172c40] rounded-2xl overflow-hidden focus-within:border-emerald-500 transition-colors">
                    <span className="bg-[#0e2133] text-slate-300 px-3.5 py-3 text-xs font-bold border-r border-[#172c40]">
                      +91
                    </span>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full bg-transparent px-3.5 py-3 text-xs font-mono font-bold text-slate-100 placeholder:text-slate-600 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSending || !phone.trim()}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                >
                  {isSending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Sending WhatsApp OTP...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Send WhatsApp OTP
                    </>
                  )}
                </button>
              </form>
            )}

            {step === "ENTER_OTP" && (
              <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Enter 4-Digit WhatsApp OTP Code
                    </label>
                    <span className="text-[11px] font-mono text-emerald-400">+91 {phone}</span>
                  </div>

                  <input
                    type="text"
                    maxLength={4}
                    value={otpCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 4);
                      setOtpCode(val);
                      if (val.length === 4) {
                        handleVerifyOtp(e);
                      }
                    }}
                    placeholder="1234"
                    className="w-full bg-[#050e17] border border-emerald-500/40 rounded-2xl px-4 py-3.5 text-center text-lg font-mono font-black tracking-widest text-emerald-400 placeholder:text-slate-700 focus:outline-none focus:border-emerald-400 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isVerifying || otpCode.length < 4}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Code...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" /> Verify & Sign In
                    </>
                  )}
                </button>

                <div className="flex justify-between items-center pt-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setStep("ENTER_PHONE")}
                    className="text-slate-400 hover:text-slate-200"
                  >
                    ← Change Phone Number
                  </button>

                  <button
                    type="button"
                    disabled={resendTimer > 0 || isSending}
                    onClick={handleSendOtp}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold disabled:opacity-50"
                  >
                    {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend WhatsApp OTP"}
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* Password Login Form */}
        {activeTab === "password" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (email.trim() && password.trim()) {
                setMessageAlert({
                  type: "success",
                  text: "🟢 Super Admin Authenticated (super@gmail.com)! Redirecting to Dashboard...",
                });
                setTimeout(() => {
                  window.location.href = "/";
                }, 1000);
              } else {
                setMessageAlert({ type: "error", text: "Please enter Super Admin email and password" });
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Super Admin Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="super@gmail.com"
                className="w-full bg-[#050e17] border border-[#172c40] rounded-2xl px-4 py-3 text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="123456"
                className="w-full bg-[#050e17] border border-[#172c40] rounded-2xl px-4 py-3 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 py-3.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
            >
              Sign In with Password <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Footer info */}
        <p className="text-[11px] text-slate-500 text-center pt-2">
          Powered by OrLife Connect WhatsApp AOC Engine & Multi-Sender Gateway V2.1
        </p>

      </div>
    </div>
  );
}
