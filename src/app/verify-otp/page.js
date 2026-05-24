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
    className={`relative border border-border bg-card/80 overflow-hidden group ${className}`}
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
    <div className="fixed inset-0 z-0 pointer-events-none bg-background">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute top-0 left-0 w-full h-[60vh] bg-primary/5 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-0 right-0 w-full h-[60vh] bg-secondary/20 blur-[120px] rounded-full mix-blend-screen" />
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

    // Prefill email from query parameter if available
    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const emailParam = params.get("email");
            if (emailParam) {
                setEmail(emailParam.trim().toLowerCase());
            }
        }
    }, []);

    // Local countdown timer and sync with localStorage absolute expiry
    useEffect(() => {
        if (!email) return;

        const updateTimer = () => {
            const stored = localStorage.getItem(`otpCooldown_${email}`);
            if (stored) {
                const expiry = parseInt(stored, 10);
                const remaining = Math.max(0, Math.ceil((expiry - Date.now()) / 1000));
                setCooldown(remaining);
                if (remaining <= 0) {
                    localStorage.removeItem(`otpCooldown_${email}`);
                }
            } else {
                setCooldown(0);
            }
        };

        // Run immediately on email change
        updateTimer();

        // Run countdown every second
        const interval = setInterval(updateTimer, 1000);

        // Listen for changes from other tabs to instantly synchronize
        const handleStorageChange = (e) => {
            if (e.key === `otpCooldown_${email}`) {
                updateTimer();
            }
        };

        window.addEventListener("storage", handleStorageChange);

        return () => {
            clearInterval(interval);
            window.removeEventListener("storage", handleStorageChange);
        };
    }, [email]);

    // Start cooldown helper (stores absolute expiry in localStorage)
    const startCooldown = useCallback((seconds) => {
        if (!email) return;
        const remainingSeconds = seconds || COOLDOWN_SECONDS;
        setCooldown(remainingSeconds);
        const expiry = Date.now() + remainingSeconds * 1000;
        localStorage.setItem(`otpCooldown_${email.trim().toLowerCase()}`, expiry.toString());
    }, [email]);

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

        // Clear cooldown from localStorage on successful verification
        if (response.status === 200) {
            setSuccess("Verified! Redirecting to login...");
            setEmail("");
            setOTP("");
            // Remove stored cooldown
            if (email) localStorage.removeItem(`otpCooldown_${email}`);
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
                // Update cooldown sync after successful resend
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
        <div className="relative min-h-screen bg-background text-foreground font-sans selection:bg-blue-500/30 flex items-center justify-center p-6 transition-colors duration-300">
            
            <GridBackground />

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-md"
            >
                <SpotlightCard className="rounded-3xl p-8 md:p-10 shadow-2xl bg-card border border-border">
                    
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 mb-4">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">Verify Account</h1>
                        <p className="text-muted-foreground text-sm">
                            Enter the OTP sent to your email to verify your identity.
                        </p>
                    </div>

                    {/* Messages */}
                    {success && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 text-green-600 dark:text-green-400 text-sm"
                        >
                            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                            {success}
                        </motion.div>
                    )}

                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm"
                        >
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            {error}
                        </motion.div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleVerify} className="space-y-5">
                        
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground ml-1 uppercase tracking-wider">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@example.com"
                                    required
                                    className="w-full bg-background border border-border rounded-xl py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground ml-1 uppercase tracking-wider">One-Time Password</label>
                            <div className="relative group">
                                <KeyRound className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
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
                                    className="w-full bg-background border border-border rounded-xl py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all tracking-widest"
                                />
                            </div>
                        </div>

                        {/* Verify Button */}
                        <button
                            type="submit"
                            disabled={loading || !email || !otp || otp.length < 6}
                            className="w-full py-4 bg-foreground text-background font-bold rounded-xl hover:opacity-90 transition-colors flex items-center justify-center gap-2 mt-6 shadow-lg shadow-black/5 disabled:opacity-40 disabled:cursor-not-allowed"
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
                    <div className="mt-6 pt-6 border-t border-border">
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                                Didn&apos;t receive the code?
                            </p>

                            {cooldown > 0 ? (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Timer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                    <span>Resend in <span className="text-blue-600 dark:text-blue-400 font-mono font-medium">{formatTime(cooldown)}</span></span>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleResendOTP}
                                    disabled={resending || !email}
                                    className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
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
                        <p className="text-xs text-muted-foreground">
                            Check your spam folder if you don&apos;t see the email.
                        </p>
                    </div>

                </SpotlightCard>
            </motion.div>
        </div>
    );
}