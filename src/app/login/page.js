"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { EMAIL_REGEX } from "@/lib/validation";
import { apiClient } from "@/lib/api-client";

// --- Components ---

// 1. Spotlight Card (Visual Wrapper)
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

// 2. Background Pattern
const GridBackground = () => (
    <div className="fixed inset-0 z-0 pointer-events-none bg-background">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute top-0 left-0 w-full h-[60vh] bg-primary/5 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-0 right-0 w-full h-[60vh] bg-secondary/20 blur-[120px] rounded-full mix-blend-screen" />
    </div>
);

// --- Main Page Component ---

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [emailTouched, setEmailTouched] = useState(false);

    const { data: session } = useSession();
    const router = useRouter();

    // Redirect if already logged in
    useEffect(() => {
        if (session?.user) {
            const roleRedirects = {
                "admin": "/admindashboard",
                "user": "/dashboard",
            };
            router.push(roleRedirects[session.user.role] || "/");
        }
    }, [session, router]);

    // Email validation state
    const isEmailValid = useMemo(() => {
        return EMAIL_REGEX.test(email);
    }, [email]);

    const handleEmailBlur = useCallback(() => {
        setEmailTouched(true);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setEmailTouched(true);

        if (!isEmailValid) {
            setError("Please enter a valid email address.");
            return;
        }

        setLoading(true);
        setError("");

        const result = await signIn("credentials", {
            email: email.trim().toLowerCase(),
            password,
            redirect: false,
        });

        if (result?.error) {
            if (result.error.includes("verified")) {
                const trimmedEmail = email.trim().toLowerCase();
                try {
                    const response = await apiClient.resendOTP(trimmedEmail);
                    if (response?.data?.success) {
                        const expiry = Date.now() + (response.data.cooldownSeconds || 60) * 1000;
                        localStorage.setItem(`otpCooldown_${trimmedEmail}`, expiry.toString());
                        setError("Account not verified. A new OTP has been sent. Redirecting to verification...");
                        setTimeout(() => {
                            router.push(`/verify-otp?email=${encodeURIComponent(trimmedEmail)}`);
                        }, 2500);
                    }
                } catch (err) {
                    if (err?.response?.status === 429) {
                        const remaining = err.response.data?.cooldownRemaining || 60;
                        const expiry = Date.now() + remaining * 1000;
                        localStorage.setItem(`otpCooldown_${trimmedEmail}`, expiry.toString());
                        setError(`Account not verified. An OTP was already sent recently (${remaining}s remaining). Redirecting...`);
                        setTimeout(() => {
                            router.push(`/verify-otp?email=${encodeURIComponent(trimmedEmail)}`);
                        }, 2500);
                    } else {
                        setError("Account not verified. Failed to send OTP. Please try again.");
                        setLoading(false);
                    }
                }
                return;
            }

            setError("Invalid credentials. Please try again.");
            setLoading(false);
            return;
        }

        // Handle Role Redirects logic
        const roleRedirects = {
            "admin": "/admindashboard",
            "user": "/dashboard",
        };

        if (result?.user?.role && roleRedirects[result.user.role]) {
            router.push(roleRedirects[result.user.role]);
        } else {
            router.push("/dashboard");
        }

        setLoading(false);
    };

    if (session) return null; // Prevent flash of login screen while redirecting

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
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
                        <p className="text-muted-foreground text-sm">
                            Enter your credentials to access your <br />
                            <span className="text-blue-600 dark:text-blue-400 font-medium">Rezumix Intelligence Dashboard</span>
                        </p>
                    </div>

                    {/* Error Message */}
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
                    <form onSubmit={handleSubmit} className="space-y-5" noValidate>

                        {/* Email Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground ml-1 uppercase tracking-wider">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onBlur={handleEmailBlur}
                                    placeholder="name@company.com"
                                    className={`w-full bg-background border rounded-xl py-3 pl-12 pr-10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 transition-all ${
                                        emailTouched && !isEmailValid
                                            ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/50"
                                            : emailTouched && isEmailValid
                                            ? "border-green-500/30 focus:border-green-500/50 focus:ring-green-500/50"
                                            : "border-border focus:border-blue-500/50 focus:ring-blue-500/50"
                                    }`}
                                />
                                {emailTouched && (
                                    <div className="absolute right-4 top-3.5">
                                        {isEmailValid ? (
                                            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                                        ) : (
                                            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                        )}
                                    </div>
                                )}
                            </div>
                            {emailTouched && !isEmailValid && (
                                <p className="text-xs text-red-600 dark:text-red-400 ml-1 flex items-center gap-1.5 animate-fadeIn">
                                    <span className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
                                    Enter a valid email address (e.g. name@example.com)
                                </p>
                            )}
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground ml-1 uppercase tracking-wider">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full bg-background border border-border rounded-xl py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || !email || !password || (emailTouched && !isEmailValid)}
                            className="w-full py-4 bg-foreground text-background font-bold rounded-xl hover:opacity-90 transition-colors flex items-center justify-center gap-2 mt-6 shadow-lg shadow-black/5 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Signing In...</span>
                                </>
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 text-center pt-6 border-t border-border">
                        <p className="text-muted-foreground text-sm">
                            Don&apos;t have an account?{" "}
                            <Link href="/register" className="text-foreground font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                Create Account
                            </Link>
                        </p>
                    </div>

                    {/* Spotlight Card Inner Wrapper */}
                </SpotlightCard>
            </motion.div>
        </div>
    );
}