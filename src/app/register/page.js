"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { EMAIL_REGEX, PASSWORD_RULES, getPasswordStrength } from "@/lib/validation";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import {
    User,
    Mail,
    Lock,
    ArrowRight,
    Loader2,
    CheckCircle2,
    Sparkles,
    ShieldCheck,
    Star,
    ArrowLeft,
    AlertCircle,
    Check,
    X
} from "lucide-react";

// --- Components ---

// 1. Spotlight Card
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

// --- Password Strength Meter Component ---

function PasswordStrengthMeter({ password }) {
    const strength = getPasswordStrength(password);

    if (!password) return null;

    return (
        <div className="mt-3 space-y-3">
            {/* Strength bar */}
            <div className="flex items-center gap-3">
                <div className="flex-1 flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                        <div
                            key={level}
                            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                                level <= strength.score ? strength.color : "bg-white/10"
                            }`}
                        />
                    ))}
                </div>
                <span className={`text-xs font-medium min-w-[70px] text-right transition-colors duration-300 ${
                    strength.score <= 1 ? "text-red-400" :
                    strength.score === 2 ? "text-orange-400" :
                    strength.score === 3 ? "text-yellow-400" :
                    strength.score === 4 ? "text-blue-400" : "text-green-400"
                }`}>
                    {strength.label}
                </span>
            </div>

            {/* Criteria checklist */}
            <div className="space-y-1.5">
                {PASSWORD_RULES.map((criteria) => {
                    const passed = criteria.test(password);
                    return (
                        <div
                            key={criteria.key}
                            className={`flex items-center gap-2 text-xs transition-colors duration-200 ${
                                passed ? "text-green-400" : "text-slate-500"
                            }`}
                        >
                            {passed ? (
                                <Check className="w-3.5 h-3.5 flex-shrink-0" />
                            ) : (
                                <X className="w-3.5 h-3.5 flex-shrink-0" />
                            )}
                            <span>{criteria.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// --- Main Page Component ---

export default function Register() {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Track which fields the user has interacted with (show errors only after touch)
    const [touched, setTouched] = useState({ fullName: false, email: false, password: false });

    // Animation state
    const [loaded, setLoaded] = useState(false);
    useEffect(() => setLoaded(true), []);

    const router = useRouter();

    // --- Validation logic ---
    const validation = useMemo(() => {
        const fullNameValid = fullName.trim().length >= 3;
        const emailValid = EMAIL_REGEX.test(email);
        const passwordValid = PASSWORD_RULES.every((c) => c.test(password));

        return {
            fullName: {
                valid: fullNameValid,
                message: !fullName.trim()
                    ? "Full name is required"
                    : !fullNameValid
                    ? "Name must be at least 3 characters"
                    : "",
            },
            email: {
                valid: emailValid,
                message: !email.trim()
                    ? "Email is required"
                    : !emailValid
                    ? "Enter a valid email (e.g. name@example.com)"
                    : "",
            },
            password: {
                valid: passwordValid,
                message: !password
                    ? "Password is required"
                    : !passwordValid
                    ? "Password does not meet all requirements"
                    : "",
            },
            isFormValid: fullNameValid && emailValid && passwordValid,
        };
    }, [fullName, email, password]);

    const handleBlur = useCallback((field) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Mark all fields as touched to show any remaining errors
        setTouched({ fullName: true, email: true, password: true });

        // Prevent submission if validation fails
        if (!validation.isFormValid) {
            setError("Please fix the errors above before submitting.");
            return;
        }

        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const response = await axios.post("/api/user/register", {
                fullName: fullName.trim(), email: email.trim().toLowerCase(), password
            });

            if (response.status === 200) {
                setSuccess("Registration successful! Redirecting...");
                const registeredEmail = email.trim().toLowerCase();
                
                // Store 60s cooldown expiry in localStorage
                const expiry = Date.now() + 60 * 1000;
                localStorage.setItem(`otpCooldown_${registeredEmail}`, expiry.toString());

                setFullName("");
                setEmail("");
                setPassword("");
                setTouched({ fullName: false, email: false, password: false });

                // Redirect to verify-otp with email query parameter after 2 seconds
                setTimeout(() => {
                router.push(`/verify-otp?email=${encodeURIComponent(registeredEmail)}`)
                }, 2000);
            }
        } catch (err) {
            if (err?.response?.data?.errors && err.response.data.errors.length > 0) {
                setError(err.response.data.errors[0].messages[0]);
            } else if (err?.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError("An error occurred. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const features = [
        "AI-Powered Resume Analysis",
        "Personalized Career Recommendations",
        "Mock Interview Practice",
        "Personality Prediction",
        "Skill Gap Identifier"
    ];

    return (
        <div className="relative min-h-screen bg-background text-foreground font-sans selection:bg-blue-500/30 overflow-x-hidden transition-colors duration-300">

            <GridBackground />

            <div className="relative z-10 min-h-screen flex flex-col justify-center px-6 py-20">

                {/* Back Link */}
                <div className="max-w-6xl mx-auto w-full mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Homepage
                    </Link>
                </div>

                <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">

                    {/* LEFT SIDE: Marketing Content */}
                    <div className={`transition-all duration-1000 ease-out ${loaded ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'}`}>

                        {/* Animated Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-medium mb-8">
                            <Sparkles className="w-3 h-3" />
                            <span>Join the AI Revolution</span>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6 leading-tight">
                            Accelerate your career <br />
                            with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Intelligence.</span>
                        </h1>

                        <p className="text-lg text-muted-foreground mb-10 leading-relaxed max-w-md">
                            Join thousands of professionals using Rezumix to analyze resumes, practice interviews, and land top-tier roles.
                        </p>

                        {/* Feature List */}
                        <div className="space-y-4 mb-12">
                            {features.map((feature, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-3 text-foreground"
                                >
                                    <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                    <span>{feature}</span>
                                </div>
                            ))}
                        </div>

                        {/* Social Proof */}
                        <div className="flex flex-wrap gap-6 pt-8 border-t border-border">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <ShieldCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                                <span>50,000+ Resumes</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Star className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                                <span>4.9/5 Rating</span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDE: Registration Form */}
                    <div className={`transition-all duration-1000 delay-100 ease-out ${loaded ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}>
                        <SpotlightCard className="rounded-3xl p-8 md:p-10 shadow-2xl bg-card border border-border">

                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-foreground mb-2">Create Account</h2>
                                <p className="text-muted-foreground text-sm">Start your free analysis today.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5" noValidate>

                                {/* Full Name */}
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground ml-1 uppercase tracking-wider">Full Name</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            onBlur={() => handleBlur("fullName")}
                                            placeholder="John Doe"
                                            className={`w-full bg-background border rounded-xl py-3 pl-12 pr-10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 transition-all ${
                                                touched.fullName && !validation.fullName.valid
                                                    ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/50"
                                                    : touched.fullName && validation.fullName.valid
                                                    ? "border-green-500/30 focus:border-green-500/50 focus:ring-green-500/50"
                                                    : "border-border focus:border-blue-500/50 focus:ring-blue-500/50"
                                            }`}
                                        />
                                        {/* Real-time indicator icon */}
                                        {touched.fullName && (
                                            <div className="absolute right-4 top-3.5">
                                                {validation.fullName.valid ? (
                                                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                                                ) : (
                                                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {/* Inline error message */}
                                    {touched.fullName && validation.fullName.message && (
                                        <p className="text-xs text-red-600 dark:text-red-400 ml-1 flex items-center gap-1.5">
                                            <span className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
                                            {validation.fullName.message}
                                        </p>
                                    )}
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground ml-1 uppercase tracking-wider">Email</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            onBlur={() => handleBlur("email")}
                                            placeholder="name@company.com"
                                            className={`w-full bg-background border rounded-xl py-3 pl-12 pr-10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 transition-all ${
                                                touched.email && !validation.email.valid
                                                    ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/50"
                                                    : touched.email && validation.email.valid
                                                    ? "border-green-500/30 focus:border-green-500/50 focus:ring-green-500/50"
                                                    : "border-border focus:border-blue-500/50 focus:ring-blue-500/50"
                                            }`}
                                        />
                                        {touched.email && (
                                            <div className="absolute right-4 top-3.5">
                                                {validation.email.valid ? (
                                                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                                                ) : (
                                                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {touched.email && validation.email.message && (
                                        <p className="text-xs text-red-600 dark:text-red-400 ml-1 flex items-center gap-1.5">
                                            <span className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
                                            {validation.email.message}
                                        </p>
                                    )}
                                </div>

                                {/* Password */}
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground ml-1 uppercase tracking-wider">Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            onBlur={() => handleBlur("password")}
                                            placeholder="Create a secure password"
                                            className={`w-full bg-background border rounded-xl py-3 pl-12 pr-10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 transition-all ${
                                                touched.password && !validation.password.valid
                                                    ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/50"
                                                    : touched.password && validation.password.valid
                                                    ? "border-green-500/30 focus:border-green-500/50 focus:ring-green-500/50"
                                                    : "border-border focus:border-blue-500/50 focus:ring-blue-500/50"
                                            }`}
                                        />
                                        {touched.password && (
                                            <div className="absolute right-4 top-3.5">
                                                {validation.password.valid ? (
                                                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                                                ) : (
                                                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {/* Password Strength Meter */}
                                    <PasswordStrengthMeter password={password} />
                                </div>

                                {/* Status Messages */}
                                {error && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        {error}
                                    </div>
                                )}
                                {success && (
                                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-xs flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                        {success}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading || !validation.isFormValid}
                                    className="w-full py-4 bg-foreground text-background font-bold rounded-xl hover:opacity-90 transition-colors flex items-center justify-center gap-2 mt-6 shadow-lg shadow-black/5 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Creating Account...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Get Started</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Footer */}
                            <div className="mt-8 text-center pt-6 border-t border-border">
                                <p className="text-muted-foreground text-sm">
                                    Already have an account?{" "}
                                    <Link href="/login" className="text-foreground font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                        Sign In
                                    </Link>
                                </p>
                            </div>
                        </SpotlightCard>
                    </div>
                </div>
            </div>
        </div>
    );
}