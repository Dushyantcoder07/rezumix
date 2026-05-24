"use client";
import React, { useState, useEffect } from "react";
import { UploadCloud, FileText, CheckCircle, AlertCircle, ArrowRight, Zap, Target, TrendingUp, Loader2, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { marked } from "marked";

export default function ResumeAnalyzer() {
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState("");
    const [scrollY, setScrollY] = useState(0);
    const [isVisible, setIsVisible] = useState({ hero: false, upload: false, results: false });

    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "loading") return
        if (!session || status === "unauthenticated") router.push("/");
    }, [session, status, router]);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setTimeout(() => setIsVisible({ hero: true, upload: true, results: false }), 300);
    }, []);

    // ✅ PDF aur DOCX dono accept karo
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        const name = selectedFile.name.toLowerCase();
        if (name.endsWith(".docx") || name.endsWith(".pdf")) {
            setFile(selectedFile);
            setFileName(selectedFile.name);
            setError("");
        } else {
            setFile(null);
            setFileName("");
            setError("Please upload a .docx or .pdf file");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) return setError("Please select a file to upload");

        setLoading(true);
        setResult("");
        setError("");

        try {
            const userEmail = session?.user?.email;
            const isPDF = file.name.toLowerCase().endsWith(".pdf");
            let response;

            if (isPDF) {
                const { extractTextFromPDF } = await import("@/utils/extractPdfText");
                let text;
                try {
                    text = await extractTextFromPDF(file);
                } catch (pdfErr) {
                    console.error("PDF extraction failed:", pdfErr);
                    setError("PDF text extraction failed: " + pdfErr.message);
                    setLoading(false);
                    return;
                }

                if (!text || text.trim().length === 0) {
                    setError("Could not extract text from PDF. Make sure it's not a scanned image.");
                    setLoading(false);
                    return;
                }

                response = await fetch(`/api/analyze-resume?email=${encodeURIComponent(userEmail)}&fileType=pdf`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text })
                });

            } else {
                const formData = new FormData();
                formData.append("file", file);

                response = await fetch(`/api/analyze-resume?email=${encodeURIComponent(userEmail)}&fileType=docx`, {
                    method: "POST",
                    body: formData
                });
            }

            if (!response.ok) {
                const errData = await response.json();
                console.error("API error:", errData);
                setError("Server error: " + (errData.error || errData.details || "Unknown error"));
                setLoading(false);
                return;
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            setIsVisible((prev) => ({ ...prev, results: true }));

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split("\n");

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            setResult((prev) => prev + data.content);
                        } catch (e) { console.error("Parse error:", e); }
                    }
                }
            }

        } catch (err) {
            console.error("Full error:", err);
            setError("Failed to analyze resume: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const renderMarkdown = (markdown) => {
        if (!markdown) return { __html: '' };
        marked.setOptions({ breaks: true, gfm: true });
        return { __html: marked(markdown) };
    };

    return (
        <div className="min-h-screen bg-background text-foreground relative overflow-hidden font-sans selection:bg-primary/30 transition-colors duration-300">
            {/* Background */}
            <div className="inset-0 z-0 fixed pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom_right,rgba(15,23,42,0.04),transparent_40%),linear-gradient(to_top_left,rgba(15,23,42,0.04),transparent_35%)] dark:bg-[linear-gradient(to_bottom_right,rgba(255,255,255,0.03),transparent_40%),linear-gradient(to_top_left,rgba(255,255,255,0.03),transparent_35%)]"></div>
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" style={{ transform: `translateY(${scrollY * 0.1}px)` }}></div>
                <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-secondary/20 rounded-full blur-[100px]" style={{ transform: `translateY(${-scrollY * 0.1}px)` }}></div>
            </div>

            <div className="relative z-10">
                <section className="px-4 sm:px-6 lg:px-8 py-12">
                    <div className="max-w-5xl mx-auto">
                        <div className={`transition-all duration-1000 ease-out ${isVisible.upload ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                            <div className="relative p-8 bg-card border border-border rounded-3xl shadow-2xl">

                                <div className="text-center mb-8">
                                    <h2 className="text-3xl font-bold mb-2">Resume Audit</h2>
                                    <p className="text-muted-foreground">Upload your resume for instant AI scoring and feedback</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {!file ? (
                                        <div className="relative group cursor-pointer">
                                            {/* ✅ PDF aur DOCX dono accept */}
                                            <input type="file" accept=".docx,.pdf" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer" />
                                            <div className="border-2 border-dashed border-border rounded-2xl h-64 flex flex-col items-center justify-center transition-all group-hover:border-primary/50 group-hover:bg-primary/5">
                                                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                                                    <UploadCloud size={32} />
                                                </div>
                                                <h3 className="text-xl font-semibold text-foreground mb-2">Drop your resume here</h3>
                                                {/* ✅ Updated text */}
                                                <p className="text-muted-foreground">Supports .docx and .pdf files</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-card border border-border rounded-xl p-6 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center border border-primary/20">
                                                    <FileText size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-foreground text-lg font-medium">{fileName}</p>
                                                    <p className="text-sm text-primary flex items-center gap-2 mt-1">
                                                        <CheckCircle className="w-4 h-4" /> Ready for scan
                                                    </p>
                                                </div>
                                            </div>
                                            <button type="button" onClick={() => { setFile(null); setFileName(""); setResult(""); }} className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground">
                                                <X size={24} />
                                            </button>
                                        </div>
                                    )}

                                    {error && (
                                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400">
                                            <AlertCircle size={20} />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-center">
                                        <button
                                            type="submit"
                                            disabled={!file || loading}
                                            className="px-10 py-4 bg-foreground text-background hover:opacity-90 font-bold rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-black/10 cursor-pointer"
                                        >
                                            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</> : <>Run Analysis <ArrowRight className="w-5 h-5" /></>}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Results Section */}
                {result && (
                    <section className="px-4 sm:px-6 lg:px-8 pb-16">
                        <div className="max-w-5xl mx-auto">
                            <div className={`transition-all duration-1000 ease-out ${isVisible.results ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                                <div className="relative p-8 bg-card border border-border rounded-3xl shadow-2xl">

                                    <div className="flex items-center gap-4 mb-8 border-b border-border pb-6">
                                        <div className="p-3 bg-primary/10 rounded-xl text-primary border border-primary/20">
                                            <Zap className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-foreground">Analysis Report</h2>
                                            <p className="text-muted-foreground text-sm">Actionable feedback for improvement</p>
                                        </div>
                                    </div>

                                    <div
                                        dangerouslySetInnerHTML={renderMarkdown(result)}
                                        className="
                                            text-muted-foreground text-lg leading-loose
                                            [&>h1]:text-primary [&>h1]:text-4xl [&>h1]:font-bold [&>h1]:mt-10 [&>h1]:mb-6
                                            [&>h2]:text-foreground [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mt-10 [&>h2]:mb-5 [&>h2]:border-l-4 [&>h2]:border-primary [&>h2]:pl-4
                                            [&>h3]:text-foreground [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:mt-8 [&>h3]:mb-4
                                            [&>p]:mb-6 [&>p]:leading-8
                                            [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-8 [&>ul]:space-y-3
                                            [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-8 [&>ol]:space-y-3
                                            [&>li]:pl-2 [&>li]:marker:text-primary
                                            [&>strong]:text-foreground [&>strong]:font-bold
                                            [&>code]:bg-muted [&>code]:text-foreground [&>code]:px-2 [&>code]:py-1 [&>code]:rounded-md
                                            [&>blockquote]:bg-muted/50 [&>blockquote]:border-l-4 [&>blockquote]:border-primary [&>blockquote]:p-6 [&>blockquote]:rounded-r-xl [&>blockquote]:my-8
                                        "
                                    />
                                </div>
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}