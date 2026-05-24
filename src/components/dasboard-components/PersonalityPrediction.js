"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, CheckCircle2, ArrowLeft, Brain, Star, Clock, Target, Sparkles, User, ArrowRight } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { marked } from "marked";
import { Button } from "../ui/button";
import { useTheme } from "@/components/ThemeProvider";

const questions = [
    { id: 1, text: "Do you prefer structured routines?" },
    { id: 2, text: "Do you enjoy socializing in large groups?" },
    { id: 3, text: "Do you make decisions based on logic?" },
    { id: 4, text: "Do you enjoy working in a team?" },
    { id: 5, text: "Do you enjoy working independently?" },
    { id: 6, text: "Are you comfortable taking risks in decision-making?" },
    { id: 7, text: "Are you highly organized and detail-oriented?" },
    { id: 8, text: "Do you find it easy to empathize with others?" },
    { id: 9, text: "Do you enjoy learning new skills and concepts?" },
    { id: 10, text: "Do you prefer working under pressure?" },
    { id: 11, text: "Are you more of a leader in group settings?" },
    { id: 12, text: "Do you handle unexpected changes well?" },
    { id: 13, text: "Do you rely on data and facts when making decisions?" },
    { id: 14, text: "Do you prefer working on long-term projects?" },
    { id: 15, text: "Are you comfortable speaking in front of large audiences?" },
    { id: 16, text: "Do you often reflect on your thoughts and emotions?" },
    { id: 17, text: "Do you enjoy collaborating with others on complex problems?" },
    { id: 18, text: "Do you prefer a fast-paced work environment?" },
    { id: 19, text: "Are you more motivated by personal growth?" },
    { id: 20, text: "Do you find it easy to adapt to new situations?" },
];

const options = ["Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"];

// Background Component
const GridBackground = ({ isDark }) => (
    <div className={isDark ? "fixed inset-0 z-0 pointer-events-none bg-[#050505]" : "fixed inset-0 z-0 pointer-events-none bg-slate-50"}>
        <div className={isDark ? "absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px]" : "absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] bg-[size:32px_32px]"} />
        <div className={isDark ? "absolute top-0 left-0 w-full h-[60vh] bg-purple-600/5 blur-[120px] rounded-full mix-blend-screen" : "absolute top-0 left-0 w-full h-[60vh] bg-purple-400/10 blur-[120px] rounded-full mix-blend-screen"} />
        <div className={isDark ? "absolute bottom-0 right-0 w-full h-[60vh] bg-pink-600/5 blur-[120px] rounded-full mix-blend-screen" : "absolute bottom-0 right-0 w-full h-[60vh] bg-pink-400/10 blur-[120px] rounded-full mix-blend-screen"} />
    </div>
);

export default function PersonalityPrediction() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { isDark } = useTheme();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/");
        }
    }, [status, router]);

    const [answers, setAnswers] = useState({});
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [personalityResult, setPersonalityResult] = useState('');
    const [name, setName] = useState("");
    const [quizStarted, setQuizStarted] = useState(false);

    const handleAnswer = (value) => {
        setAnswers({ ...answers, [questions[currentQuestion].text]: value });
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            submitAnswers();
        }
    };

    const submitAnswers = async () => {
        setSubmitted(true);
        try {
            const response = await fetch(`/api/personality-prediction`, {
                method: "POST",
                body: JSON.stringify({ answers, name })
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split("\n");
                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const data = JSON.parse(line.slice(6));
                        setPersonalityResult((prev) => prev + data.content);
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching AI analysis:", error);
            setPersonalityResult("Failed to analyze personality.");
        }
    };

    const progressPercentage = (currentQuestion / questions.length) * 100;

    const startQuiz = () => {
        if (name.trim() !== "") setQuizStarted(true);
    };

    const retakeQuiz = () => {
        setSubmitted(false);
        setCurrentQuestion(0);
        setAnswers({});
        setPersonalityResult('');
        setQuizStarted(false);
        setName("");
    };

    const renderMarkdown = (markdown) => {
        if (!markdown) return { __html: '' };
        marked.setOptions({ breaks: true, gfm: true });
        return { __html: marked(markdown) };
    };

    const pageClassName = isDark ? "relative min-h-screen bg-[#050505] text-slate-200" : "relative min-h-screen bg-slate-50 text-slate-900";
    const heroCardClassName = isDark ? "bg-[#0A0A0A] border border-white/10" : "bg-white border border-slate-200 shadow-xl shadow-slate-200/70";
    const inputClassName = isDark
        ? "w-full bg-[#111] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-purple-500/50 transition-all"
        : "w-full bg-white border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-slate-900 focus:outline-none focus:border-purple-500/50 transition-all placeholder:text-slate-400";
    const labelTextClassName = isDark ? "text-slate-400" : "text-slate-600";
    const mutedTextClassName = isDark ? "text-slate-400" : "text-slate-500";
    const titleClassName = isDark ? "text-white" : "text-slate-900";
    const optionTextClassName = isDark ? "text-slate-300" : "text-slate-700";
    const optionButtonClassName = isDark
        ? "w-full p-4 text-left bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/30 rounded-xl transition-all duration-200 flex items-center justify-between group"
        : "w-full p-4 text-left bg-white hover:bg-slate-50 border border-slate-200 hover:border-purple-400/40 rounded-xl transition-all duration-200 flex items-center justify-between group shadow-sm";
    const resultCardClassName = isDark ? "bg-[#0A0A0A] border border-white/10" : "bg-white border border-slate-200 shadow-xl shadow-slate-200/70";
    const resultTextClassName = isDark
        ? "text-slate-300 leading-relaxed space-y-6"
        : "text-slate-700 leading-relaxed space-y-6";
    const spinnerClassName = isDark ? "w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-6" : "w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-6";

    if (status === "loading") return null;

    return (
        <div className={`${pageClassName} font-sans selection:bg-purple-500/30 overflow-x-hidden`}>
            <GridBackground isDark={isDark} />

            <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
                
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium mb-6">
                        <Brain className="w-3 h-3" />
                        <span>Psychometric AI</span>
                    </div>
                    <h1 className={`text-3xl md:text-5xl font-bold ${titleClassName} mb-6 tracking-tight`}>
                        Personality <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Assessment</span>
                    </h1>
                    <p className={`text-lg ${mutedTextClassName} max-w-2xl mx-auto leading-relaxed`}>
                        Discover your professional archetype. We analyze 20 data points to find the work environment where you&apos;ll thrive.
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {!quizStarted ? (
                        <motion.div
                            key="start"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={`${heroCardClassName} rounded-3xl p-8 md:p-12 shadow-2xl max-w-2xl mx-auto relative`}
                        >
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto bg-purple-500/10 rounded-full flex items-center justify-center mb-6 text-purple-400">
                                    <Sparkles className="w-8 h-8" />
                                </div>
                                <h2 className={`text-2xl font-bold ${titleClassName} mb-4`}>Ready to begin?</h2>
                                <div className="max-w-xs mx-auto space-y-6">
                                    <div className="space-y-2 text-left">
                                        <label className={`text-sm font-medium ${labelTextClassName} ml-1`}>Your Full Name</label>
                                        <div className="relative">
                                            <User className={`absolute left-4 top-3.5 w-5 h-5 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="John Doe"
                                                className={inputClassName}
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        onClick={startQuiz}
                                        disabled={!name}
                                        className="w-full py-6 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-all text-base shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] cursor-pointer"
                                    >
                                        Start Assessment <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ) : !submitted ? (
                        <motion.div
                            key="quiz"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className={`${heroCardClassName} rounded-3xl p-8 md:p-12 shadow-2xl max-w-3xl mx-auto relative`}
                        >
                            {/* Progress Bar */}
                            <div className="mb-8">
                                <div className={`flex justify-between text-xs ${mutedTextClassName} mb-2 font-mono`}>
                                    <span>QUESTION {currentQuestion + 1} / {questions.length}</span>
                                    <span>{Math.round(progressPercentage)}%</span>
                                </div>
                                <div className={isDark ? "h-1 bg-white/5 rounded-full overflow-hidden" : "h-1 bg-slate-200 rounded-full overflow-hidden"}>
                                    <motion.div 
                                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressPercentage}%` }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </div>
                            </div>

                            <h2 className={`text-2xl md:text-3xl font-bold ${titleClassName} mb-10 text-center leading-snug`}>
                                {questions[currentQuestion].text}
                            </h2>

                            <div className="space-y-3">
                                {options.map((option, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleAnswer(option)}
                                        className={optionButtonClassName}
                                    >
                                        <span className={`${optionTextClassName} group-hover:text-white font-medium`}>{option}</span>
                                        <div className={`w-5 h-5 rounded-full ${isDark ? "border border-slate-600 group-hover:border-purple-400" : "border border-slate-400 group-hover:border-purple-500"} flex items-center justify-center`}>
                                            <div className="w-2.5 h-2.5 rounded-full bg-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`${resultCardClassName} rounded-3xl p-8 md:p-12 shadow-2xl relative`}
                        >
                            <div className={`flex items-center gap-4 mb-8 ${isDark ? "border-b border-white/5" : "border-b border-slate-200"} pb-6`}>
                                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                                    <Target className="w-6 h-6 text-purple-400" />
                                </div>
                                <div>
                                    <h2 className={`text-2xl font-bold ${titleClassName}`}>Personality Profile</h2>
                                    <p className={`text-sm ${mutedTextClassName}`}>Analysis for {name}</p>
                                </div>
                            </div>

                            {personalityResult ? (
                                <div 
                                    className={`
                                        ${resultTextClassName}
                                        [&>h1]:text-purple-400 [&>h1]:text-3xl [&>h1]:font-bold [&>h1]:mt-8 [&>h1]:mb-6
                                        [&>h2]:text-purple-400 [&>h2]:text-2xl [&>h2]:font-semibold [&>h2]:mt-8 [&>h2]:mb-4
                                        [&>h3]:text-purple-400 [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:mt-6 [&>h3]:mb-3
                                        [&>h4]:text-purple-300 [&>h4]:text-lg [&>h4]:font-medium [&>h4]:mt-5 [&>h4]:mb-3
                                        [&>p]:text-slate-300 [&>p]:leading-7 [&>p]:mb-5
                                        [&>ul]:text-slate-300 [&>ul]:pl-6 [&>ul]:mb-6 [&>ul]:space-y-3 [&>ul]:list-disc
                                        [&>ol]:text-slate-300 [&>ol]:pl-6 [&>ol]:mb-6 [&>ol]:space-y-3
                                        [&>li]:mb-2 [&>li]:leading-7 [&>li]:marker:text-purple-500
                                        [&>strong]:text-white [&>strong]:font-semibold
                                        [&>blockquote]:bg-white/5 [&>blockquote]:border-l-4 [&>blockquote]:border-purple-500 [&>blockquote]:pl-6 [&>blockquote]:py-4 [&>blockquote]:rounded-r-xl [&>blockquote]:my-8 [&>blockquote]:italic
                                        [&>hr]:border-white/10 [&>hr]:my-8
                                    `}
                                    dangerouslySetInnerHTML={renderMarkdown(personalityResult)} 
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <div className={spinnerClassName}></div>
                                    <p className="text-purple-300 text-lg animate-pulse">Analyzing your traits...</p>
                                </div>
                            )}

                            {personalityResult && (
                                <div className={`mt-12 pt-8 ${isDark ? "border-t border-white/10" : "border-t border-slate-200"}`}>
                                    <button
                                        onClick={retakeQuiz}
                                        className={isDark ? "px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-medium transition-all flex items-center gap-2 cursor-pointer" : "px-8 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-300 text-white rounded-xl font-medium transition-all flex items-center gap-2 cursor-pointer"}
                                    >
                                        <ArrowLeft className="w-4 h-4" /> Retake Assessment
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}