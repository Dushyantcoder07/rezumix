"use client";
import { useState } from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import {
    Mail,
    Clock,
    Headphones,
    Send,
    User,
    AtSign,
    MessageSquare,
    CheckCircle2,
    AlertCircle,
    Zap
} from "lucide-react";
import axios from "axios";

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
    <div className="fixed inset-0 z-0 pointer-events-none bg-background transition-colors duration-300">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute top-0 left-0 w-full h-[60vh] bg-primary/5 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-0 right-0 w-full h-[60vh] bg-secondary/20 blur-[120px] rounded-full mix-blend-screen" />
    </div>
);

// --- Main Component ---

export default function ContactPage() {
    const [name, setName] = useState("");
    const [useremail, setUserEmail] = useState("");
    const [message, setMessage] = useState("");
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post("/api/user/contact", { name, useremail, message });
            if (res.status === 200) {
                setStatus("success");
                setName("");
                setUserEmail("");
                setMessage("");
            }
        } catch (error) {
            setStatus("error");
        } finally {
            setLoading(false);
            setTimeout(() => setStatus(""), 5000); // ✅ Auto-clear status after 5s
        }
    };

    const contactInfo = [
        {
            title: "Email Support",
            content: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "support@rezumix.com",
            icon: Mail,
            color: "text-blue-400"
        },
        {
            title: "Response Time",
            content: "Within 24 hours",
            icon: Clock,
            color: "text-purple-400"
        },
        {
            title: "Availability",
            content: "24/7 AI Support",
            icon: Headphones,
            color: "text-green-400"
        }
    ];

    return (
        <div className="relative min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 overflow-x-hidden transition-colors duration-300">

            <GridBackground />

            <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20">

                {/* Header */}
                <div className="text-center lg:text-left mb-16">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-bold text-foreground mb-6 tracking-tight"
                    >
                        Let&apos;s start a <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                            Conversation.
                        </span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-muted-foreground max-w-2xl mx-auto lg:mx-0"
                    >
                        Whether you need technical support, have feature requests, or just want
                        to discuss your career path, our team and AI agents are ready.
                    </motion.p>
                </div>

                <div className="grid lg:grid-cols-2 gap-12 items-start">

                    {/* LEFT COLUMN: Info Cards */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-6"
                    >
                        {contactInfo.map((info, idx) => (
                            <SpotlightCard key={idx} className="p-6 rounded-2xl flex items-center gap-6">
                                <div className={`w-12 h-12 rounded-xl bg-muted/50 border border-border flex items-center justify-center ${info.color}`}>
                                    <info.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">
                                        {info.title}
                                    </h3>
                                    <p className="text-xl font-semibold text-foreground">
                                        {info.content}
                                    </p>
                                </div>
                            </SpotlightCard>
                        ))}

                        {/* Mini FAQ */}
                        <div className="mt-12 p-8 border border-border rounded-3xl bg-card/60">
                            <h3 className="text-foreground font-bold mb-6 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-yellow-400" /> Quick Answers
                            </h3>
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-sm font-semibold text-foreground mb-1">How fast is the analysis?</h4>
                                    <p className="text-xs text-muted-foreground">Usually under 30 seconds for a full resume audit.</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* RIGHT COLUMN: Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-card border border-border rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />

                        <form onSubmit={handleSubmit} className="relative z-10 space-y-6">

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground ml-1">Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
                                        <input
                                            type="text"
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="John Doe"
                                            className="w-full bg-background border border-border rounded-xl py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground ml-1">Email</label>
                                    <div className="relative">
                                        <AtSign className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
                                        <input
                                            type="email"
                                            required
                                            value={useremail}
                                            onChange={(e) => setUserEmail(e.target.value)}
                                            placeholder="john@example.com"
                                            className="w-full bg-background border border-border rounded-xl py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground ml-1">Message</label>
                                <div className="relative">
                                    <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-muted-foreground" />
                                    <textarea
                                        required
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="How can we help you today?"
                                        rows={5}
                                        className="w-full bg-background border border-border rounded-xl py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all resize-none"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-foreground text-background font-bold rounded-xl hover:opacity-90 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span className="animate-pulse">Sending...</span>
                                ) : (
                                    <>
                                        Send Message <Send className="w-4 h-4" />
                                    </>
                                )}
                            </button>

                            {/* Status Messages */}
                            {status === "success" && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 text-green-600 dark:text-green-400"
                                >
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span className="text-sm font-medium">Message sent! We&apos;ll be in touch soon.</span>
                                </motion.div>
                            )}

                            {status === "error" && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400"
                                >
                                    <AlertCircle className="w-5 h-5" />
                                    <span className="text-sm font-medium">Something went wrong. Please try again.</span>
                                </motion.div>
                            )}

                        </form>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}