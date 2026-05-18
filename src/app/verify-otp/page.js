"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { Mail, KeyRound, ArrowRight, Loader2, ShieldCheck, AlertCircle, CheckCircle2, RefreshCw, Timer } from "lucide-react";

// 1. Spotlight Card Component
function SpotlightCard({ children, className = "" }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      className={`relative border border-white/10 bg-[#0A0A0A] overflow-hidden group ${className}`}
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(59, 130, 246, 0.1),
              transparent 80%
            )
          `,
        }}
      />
      <div className="relative h-full z-10">{children}</div>
    </div>
  );
}

// 2. Background Component
const GridBackground = () => (
  <div className="fixed inset-0 z-0 pointer-events-none bg-[#050505]">
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px]" />
    <div className="absolute top-0 left-0 w-full h-[60vh] bg-blue-600/5 blur-[120px] rounded-full mix-blend-screen" />
    <div className="absolute bottom-0 right-0 w-full h-[60vh] bg-purple-600/5 blur-[120px] rounded-full mix-blend-screen" />
  </div>
);

// Cooldown duration in seconds (must match backend OTP_COOLDOWN_SECONDS)
const COOLDOWN_SECONDS = 60;

export default function VerifyOTP() {
    const [email, setEmail] = useState("");
    const [otp, setOTP] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [cooldown, setCooldown] = useState(0);
    const cooldownRef = useRef(null);
    const router = useRouter();

    // Cooldown countdown timer
    useEffect(() => {
        if (cooldown <= 0) {
            if (cooldownRef.current) {
                clearInterval(cooldownRef.current);
                cooldownRef.current = null;
            }
            return;
        }

        cooldownRef.current = setInterval(() => {
            setCooldown((prev) => {
                if (prev <= 1) {
                    clearInterval(cooldownRef.current);
                    cooldownRef.current = null;
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (cooldownRef.current) {
                clearInterval(cooldownRef.current);
            }
        };
    }, [cooldown]);

    // Start cooldown helper
    const startCooldown = useCallback((seconds) => {
        setCooldown(seconds || COOLDOWN_SECONDS);
    }, []);

    // Format seconds as mm:ss
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const response = await apiClient.verifyOTP(email.trim().toLowerCase(), otp.trim());

            if (response.status === 200) {
                setSuccess("Verified! Redirecting to login...");
                setEmail("");
                setOTP("");

                setTimeout(() => {
                    router.push("/login");
                }, 2000);
            }
        } catch (err) {
            if (err?.response?.data?.errors && err.response.data.errors.length > 0) {
                setError(err.response.data.errors[0].messages[0]);
            } else if (err.response?.status === 400) {
                setError("Invalid OTP. Please try again.");
            } else if (err?.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError("Verification failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        const trimmedEmail = email.trim().toLowerCase();

        if (!trimmedEmail) {
            setError("Please enter your email address first.");
            return;
        }

        setResending(true);
        setError("");
        setSuccess("");

        try {
            const response = await apiClient.resendOTP(trimmedEmail);

            if (response?.data?.success) {
                setSuccess("A new OTP has been sent to your email!");
                startCooldown(response.data.cooldownSeconds || COOLDOWN_SECONDS);
            }
        } catch (err) {
            // Handle cooldown response from backend (429)
            if (err?.response?.status === 429) {
                const remaining = err.response.data?.cooldownRemaining || COOLDOWN_SECONDS;
                startCooldown(remaining);
                setError(`Please wait ${remaining}s before requesting a new OTP.`);
            } else if (err?.response?.data?.errors && err.response.data.errors.length > 0) {
                setError(err.response.data.errors[0].messages[0]);
            } else if (err?.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError("Failed to resend OTP. Please try again.");
            }
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-[#050505] text-slate-200 font-sans selection:bg-blue-500/30 flex items-center justify-center p-6">
            
            <GridBackground />

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-md"
            >
                <SpotlightCard className="rounded-3xl p-8 md:p-10 shadow-2xl">
                    
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-4">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">Verify Account</h1>
                        <p className="text-slate-400 text-sm">
                            Enter the OTP sent to your email to verify your identity.
                        </p>
                    </div>

                    {/* Messages */}
                    {success && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 text-green-400 text-sm"
                        >
                            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                            {success}
                        </motion.div>
                    )}

                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm"
                        >
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            {error}
                        </motion.div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleVerify} className="space-y-5">
                        
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-300 ml-1 uppercase tracking-wider">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@example.com"
                                    required
                                    className="w-full bg-[#050505] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-300 ml-1 uppercase tracking-wider">One-Time Password</label>
                            <div className="relative group">
                                <KeyRound className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => {
                                        // Only allow digits, max 6 characters
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                        setOTP(val);
                                    }}
                                    placeholder="Enter 6-digit code"
                                    required
                                    maxLength={6}
                                    className="w-full bg-[#050505] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all tracking-widest"
                                />
                            </div>
                        </div>

                        {/* Verify Button */}
                        <button
                            type="submit"
                            disabled={loading || !email || !otp || otp.length < 6}
                            className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 mt-6 shadow-lg shadow-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Verifying...</span>
                                </>
                            ) : (
                                <>
                                    <span>Verify & Continue</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Resend OTP Section */}
                    <div className="mt-6 pt-6 border-t border-white/5">
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-slate-500">
                                Didn&apos;t receive the code?
                            </p>

                            {cooldown > 0 ? (
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Timer className="w-3.5 h-3.5 text-blue-400" />
                                    <span>Resend in <span className="text-blue-400 font-mono font-medium">{formatTime(cooldown)}</span></span>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleResendOTP}
                                    disabled={resending || !email}
                                    className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                                >
                                    {resending ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="w-3.5 h-3.5" />
                                            Resend OTP
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Footer tip */}
                    <div className="mt-4 text-center">
                        <p className="text-xs text-slate-500">
                            Check your spam folder if you don&apos;t see the email.
                        </p>
                    </div>

                </SpotlightCard>
            </motion.div>
        </div>
    );
}