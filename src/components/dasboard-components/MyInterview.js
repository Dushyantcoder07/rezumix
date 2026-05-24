"use client";
import React, { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Briefcase,
    Target,
    Code,
    Search,
    Calendar,
    Trophy,
    Play,
    ArrowRight,
    BookOpen
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";

// 1. Grid Background
const GridBackground = ({ isDark }) => (
    <div className={isDark ? "fixed inset-0 z-0 pointer-events-none bg-[#050505]" : "fixed inset-0 z-0 pointer-events-none bg-slate-50"}>
        <div className={isDark ? "absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px]" : "absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] bg-[size:32px_32px]"} />
        <div className={isDark ? "absolute top-0 left-0 w-full h-[60vh] bg-violet-600/5 blur-[120px] rounded-full mix-blend-screen" : "absolute top-0 left-0 w-full h-[60vh] bg-violet-400/10 blur-[120px] rounded-full mix-blend-screen"} />
        <div className={isDark ? "absolute bottom-0 right-0 w-full h-[60vh] bg-fuchsia-600/5 blur-[120px] rounded-full mix-blend-screen" : "absolute bottom-0 right-0 w-full h-[60vh] bg-fuchsia-400/10 blur-[120px] rounded-full mix-blend-screen"} />
    </div>
);

// 2. Spotlight Card for Interviews
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
              rgba(139, 92, 246, 0.15),
              transparent 80%
            )
          `,
                }}
            />
            <div className="relative h-full z-10">{children}</div>
        </div>
    );
}

const MyInterview = () => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { isDark } = useTheme();

    const [interviewDetails, setInterviewDetails] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const pageClassName = isDark ? "relative min-h-screen bg-[#050505] text-slate-200" : "relative min-h-screen bg-slate-50 text-slate-900";
    const cardClassName = isDark ? "relative border border-white/10 bg-[#0A0A0A] overflow-hidden group" : "relative border border-slate-200 bg-white overflow-hidden group shadow-xl shadow-slate-200/70";
    const titleClassName = isDark ? "text-white" : "text-slate-900";
    const mutedTextClassName = isDark ? "text-slate-500" : "text-slate-500";
    const bodyTextClassName = isDark ? "text-slate-400" : "text-slate-600";
    const searchInputClassName = isDark
        ? "pl-12 bg-[#0A0A0A] border-white/10 text-white focus:border-violet-500/50 h-12 rounded-xl w-full"
        : "pl-12 bg-white border-slate-200 text-slate-900 focus:border-violet-500/50 h-12 rounded-xl w-full placeholder:text-slate-400";

    const filteredInterviews = useMemo(() => {
        return interviewDetails.filter((interview) => {
            return interview.jobRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
                interview.jobDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
                interview.techStack.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [interviewDetails, searchQuery]);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/");
        }
    }, [status, router]);

    useEffect(() => {
        const fetchInterview = async () => {
            try {
                const userEmail = session?.user?.email;
                if (!userEmail) return;
                setIsLoading(true);
                const response = await apiClient.getMockInterviewDetails(userEmail);
                if (response.data?.data) {
                    setInterviewDetails(response.data.data);
                } else if (response.data && Array.isArray(response.data)) {
                    setInterviewDetails(response.data);
                } else {
                    setInterviewDetails([]);
                }
            } catch (error) {
                console.error("Failed to fetch interviews:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (status === "authenticated" && session?.user?.email) {
            fetchInterview();
        }
    }, [session, status]);

    if (status === "loading" || isLoading) {
        return (
            <div className={isDark ? "min-h-screen bg-[#050505] flex items-center justify-center" : "min-h-screen bg-slate-50 flex items-center justify-center"}>
                <div className={mutedTextClassName}>Loading interviews...</div>
            </div>
        );
    }

    return (
        <div className={`${pageClassName} font-sans selection:bg-violet-500/30 overflow-x-hidden`}>
            <GridBackground isDark={isDark} />

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">

                {/* Header */}
                <div className="mb-12">
                    <h1 className={`text-3xl md:text-5xl font-bold ${titleClassName} mb-6`}>
                        Your Mock Interviews
                    </h1>

                    {/* Search Bar */}
                    <div className="relative max-w-xl">
                        <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                        <Input
                            type="text"
                            placeholder="Search by role or tech stack..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={searchInputClassName}
                        />
                    </div>
                </div>

                {/* Content Grid */}
                {filteredInterviews.length === 0 ? (
                    <div className={isDark ? "flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-3xl bg-white/[0.02]" : "flex flex-col items-center justify-center py-20 border border-dashed border-slate-300 rounded-3xl bg-white shadow-sm"}>
                        <BookOpen className="w-16 h-16 text-slate-700 mb-4" />
                        <h3 className={`text-xl font-bold ${titleClassName} mb-2`}>No Interviews Found</h3>
                        <p className={`${bodyTextClassName} mb-6`}>Create a new session to get started.</p>
                        <Link href="/mock-interview">
                            <Button className="bg-white text-black hover:bg-slate-200 rounded-xl px-6 cursor-pointer">
                                Create New
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredInterviews.map((details, index) => (
                            <SpotlightCard key={details._id || index} className={`${isDark ? "rounded-2xl p-6 flex flex-col h-full hover:-translate-y-1 transition-transform duration-300" : "rounded-2xl p-6 flex flex-col h-full hover:-translate-y-1 transition-transform duration-300"}`}>

                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center border border-violet-500/20">
                                            <Briefcase className="w-6 h-6 text-violet-400" />
                                        </div>
                                        <div>
                                            <h3 className={`text-lg font-bold ${titleClassName} leading-tight line-clamp-1`}>
                                                {details.jobRole}
                                            </h3>
                                            <div className={`flex items-center gap-1 text-xs ${mutedTextClassName} mt-1`}>
                                                <Calendar className="w-3 h-3" />
                                                {new Date(details.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 flex-grow mb-6">
                                    <div>
                                        <div className="text-xs font-medium text-slate-500 uppercase mb-1 flex items-center gap-1">
                                            <Target className="w-3 h-3" /> Description
                                        </div>
                                        <p className={`text-sm ${bodyTextClassName} line-clamp-2`}>
                                            {details.jobDescription}
                                        </p>
                                    </div>

                                    <div>
                                        <div className="text-xs font-medium text-slate-500 uppercase mb-2 flex items-center gap-1">
                                            <Code className="w-3 h-3" /> Stack
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {details.techStack.split(",").slice(0, 3).map((tech, i) => (
                                                <span key={i} className={isDark ? "px-2 py-1 bg-white/5 border border-white/5 rounded-md text-xs text-slate-300" : "px-2 py-1 bg-slate-100 border border-slate-200 rounded-md text-xs text-slate-700"}>
                                                    {tech.trim()}
                                                </span>
                                            ))}
                                            {details.techStack.split(",").length > 3 && (
                                                <span className="px-2 py-1 text-xs text-slate-500">
                                                    +{details.techStack.split(",").length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <Link href={`/interview/${details._id}`} className="w-full mt-auto">
                                    <Button className="w-full bg-violet-600 hover:bg-violet-500 text-white rounded-xl py-6 border-0 shadow-lg shadow-violet-900/20 cursor-pointer">
                                        <Play className="w-4 h-4 mr-2 fill-current" /> Start Practice
                                    </Button>
                                </Link>
                            </SpotlightCard>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyInterview;