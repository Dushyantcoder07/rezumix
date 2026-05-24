"use client";

import AdminSidebar from "./admin-sidebar/page";
import { useTheme } from "@/components/ThemeProvider";
import { MoonStar, SunMedium } from "lucide-react";


// Global Background for Dashboard
const GridBackground = () => (
    <div className="fixed inset-0 z-0 pointer-events-none bg-background transition-colors duration-300">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:32px_32px]" />
    </div>
);

export default function DashboardLayout({ children }) {
    const { theme, toggleTheme, isDark } = useTheme();

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">

            <button
                type="button"
                onClick={toggleTheme}
                className="fixed right-4 top-4 z-50 inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-4 py-2 text-sm font-medium text-foreground shadow-lg shadow-black/10 backdrop-blur transition-colors hover:bg-muted md:right-6 md:top-6"
                aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
            >
                {isDark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
                <span className="hidden sm:inline">{theme === "dark" ? "Light" : "Dark"} mode</span>
            </button>

            <GridBackground />

            {/* Sidebar Component */}
            <AdminSidebar />

            {/* Main Content Area 
                - md:pl-20: Desktop par left padding 80px (Collapsed Sidebar width).
                - pt-16: Mobile par top padding header ke liye.
                - md:pt-0: Desktop par top padding hata di.
            */}
            <main className="relative z-10 transition-all duration-300 ease-in-out md:pl-20 pt-16 md:pt-0">
                <div className="p-4 md:p-8 min-h-screen max-w-[1600px] mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}