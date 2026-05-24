"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Video, Briefcase, User, Clock, ArrowRight, Target, Zap, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { apiClient } from "@/lib/api-client";
import { useTheme } from "@/components/ThemeProvider";

// Reuse GridBackground
const GridBackground = ({ isDark }) => (
    <div className={isDark ? "fixed inset-0 z-0 pointer-events-none bg-[#050505]" : "fixed inset-0 z-0 pointer-events-none bg-slate-50"}>
        <div className={isDark ? "absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px]" : "absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] bg-[size:32px_32px]"} />
        <div className={isDark ? "absolute top-0 left-0 w-full h-[60vh] bg-indigo-600/5 blur-[120px] rounded-full mix-blend-screen" : "absolute top-0 left-0 w-full h-[60vh] bg-indigo-400/10 blur-[120px] rounded-full mix-blend-screen"} />
        <div className={isDark ? "absolute bottom-0 right-0 w-full h-[60vh] bg-purple-600/5 blur-[120px] rounded-full mix-blend-screen" : "absolute bottom-0 right-0 w-full h-[60vh] bg-purple-400/10 blur-[120px] rounded-full mix-blend-screen"} />
    </div>
);

export default function MockInterview({ onCreateSuccess }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { isDark } = useTheme();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/");
        }
    }, [status, router]);

    const [formData, setFormData] = useState({
        jobRole: "",
        jobDescription: "",
        experience: "",
        techStack: "",
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const userEmail = session?.user?.email;
            const response = await apiClient.createMockInterview(formData, userEmail);

            if (response.status === 200) {
                setFormData({
                    jobRole: "",
                    jobDescription: "",
                    experience: "",
                    techStack: "",
                });

                if (onCreateSuccess) {
                    onCreateSuccess();
                } else {
                    router.push("/my-interview");
                }
            }
        } catch (error) {
            console.log("Error creating mock interview:", error);
        } finally {
            setLoading(false);
        }
    };

    if (status === "loading") return null;

    const pageClassName = isDark ? "relative min-h-screen bg-[#050505] text-slate-200" : "relative min-h-screen bg-slate-50 text-slate-900";
    const cardClassName = isDark ? "bg-[#0A0A0A] border border-white/10" : "bg-white border border-slate-200 shadow-xl shadow-slate-200/70";
    const headingClassName = isDark ? "text-white" : "text-slate-900";
    const mutedTextClassName = isDark ? "text-slate-400" : "text-slate-500";
    const labelClassName = isDark ? "text-slate-300" : "text-slate-700";
    const inputClassName = isDark
        ? "bg-[#111] border-white/10 text-white focus:border-indigo-500/50 focus:ring-indigo-500/20 h-12 rounded-xl"
        : "bg-white border-slate-200 text-slate-900 focus:border-indigo-500/50 focus:ring-indigo-500/20 h-12 rounded-xl placeholder:text-slate-400";

    return (
        <div className={`${pageClassName} font-sans selection:bg-indigo-500/30 overflow-x-hidden`}>
            <GridBackground isDark={isDark} />

            <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">

                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-6">
                        <Video className="w-3 h-3" />
                        <span>AI Interview Simulator</span>
                    </div>
                    <h1 className={`text-3xl md:text-5xl font-bold ${headingClassName} mb-6 tracking-tight`}>
                        Create Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Interview Session</span>
                    </h1>
                    <p className={`text-lg ${mutedTextClassName} max-w-2xl mx-auto leading-relaxed`}>
                        Tell us about your target role so we can generate realistic interview questions and provide real-time feedback.
                    </p>
                </div>

                {/* Main Card */}
                <div className={`${cardClassName} rounded-3xl p-8 md:p-12 shadow-2xl relative`}>
                    <form onSubmit={handleSubmit} className="space-y-8">

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <Label className={`${labelClassName} font-medium flex items-center gap-2`}>
                                    <Briefcase className="w-4 h-4 text-indigo-400" /> Job Role / Position
                                </Label>
                                <Input
                                    required
                                    name="jobRole"
                                    placeholder="e.g. Full Stack Developer"
                                    value={formData.jobRole}
                                    onChange={handleChange}
                                    className={inputClassName}
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className={`${labelClassName} font-medium flex items-center gap-2`}>
                                    <Clock className="w-4 h-4 text-indigo-400" /> Years of Experience
                                </Label>
                                <Input
                                    required
                                    name="experience"
                                    placeholder="e.g. 2-3 years"
                                    value={formData.experience}
                                    onChange={handleChange}
                                    className={inputClassName}
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className={`${labelClassName} font-medium flex items-center gap-2`}>
                                    <Target className="w-4 h-4 text-indigo-400" /> Job Description
                                </Label>
                                <Input
                                    required
                                    name="jobDescription"
                                    placeholder="Brief description of the role"
                                    value={formData.jobDescription}
                                    onChange={handleChange}
                                    className={inputClassName}
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className={`${labelClassName} font-medium flex items-center gap-2`}>
                                    <Zap className="w-4 h-4 text-indigo-400" /> Technical Skills
                                </Label>
                                <Input
                                    required
                                    name="techStack"
                                    placeholder="e.g. React, Node.js, AWS"
                                    value={formData.techStack}
                                    onChange={handleChange}
                                    className={inputClassName}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full py-6 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-all shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] mt-4 text-base cursor-pointer"
                        >
                            {loading ? (
                                <>Setting up Interview...</>
                            ) : (
                                <>Create Mock Interview <ArrowRight className="w-5 h-5 ml-2" /></>
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}