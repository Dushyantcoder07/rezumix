"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "./ui/navigation-menu";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { Menu, MoonStar, SunMedium, X } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

const Navbar = () => {
    const { data: session } = useSession();
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();
    const { theme, toggleTheme, isDark } = useTheme();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Close mobile menu on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuOpen && !event.target.closest("nav")) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, [menuOpen]);

    const navItems = [
        { name: "About", href: "/about" },
        { name: "Contact", href: "/contact" }
    ];

    const dropdownItems = [
        { name: "Resume Analyzer", href: "/login", description: "Fix errors & beat ATS bots" },
        { name: "Resume Builder", href: "/login", description: "Build a standout resume" },
        { name: "Career Path", href: "/login", description: "Find high-paying roles" },
        { name: "Personality Fit", href: "/login", description: "Discover your work style" },
        { name: "Mock Interview", href: "/login", description: "AI Voice practice" },
        { name: "Skill Gaps", href: "/login", description: "Upskill for promotions" }
    ];

    if (session) {
        return;
    }

    return (
        <>
            <nav className={`fixed top-0 left-0 w-full z-[60] transition-all duration-300 ${scrolled
                ? "bg-background/80 backdrop-blur-md border-b border-border py-3"
                : "bg-transparent py-5"
                }`}>
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">

                    {/* Logo */}
                    <Link href="/" className="relative z-50">
                        <Image src={'/rezumix_logo.png'} alt='Rezumix' width={180} height={40} className="w-32 md:w-40 h-auto" />
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-6">

                        {!session && (
                            <div className="flex items-center gap-1 bg-muted/40 border border-border rounded-full px-4 py-1.5 backdrop-blur-sm transition-colors duration-300">
                                {/* Features Dropdown */}
                                <NavigationMenu>
                                    <NavigationMenuList>
                                        <NavigationMenuItem>
                                            <NavigationMenuTrigger className="text-sm font-medium text-muted-foreground hover:text-foreground bg-transparent hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent transition-colors flex items-center gap-1">
                                                Features
                                            </NavigationMenuTrigger>
                                            <NavigationMenuContent>
                                                <div className="w-[300px] p-2 bg-card border border-border rounded-xl shadow-2xl backdrop-blur-xl">
                                                    {dropdownItems.map((item) => (
                                                        <NavigationMenuLink key={item.name} asChild>
                                                            <Link
                                                                href={item.href}
                                                                className="block p-3 rounded-lg hover:bg-muted transition-colors group"
                                                            >
                                                                <div className="text-sm font-medium text-foreground group-hover:text-foreground">
                                                                    {item.name}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground group-hover:text-muted-foreground">
                                                                    {item.description}
                                                                </div>
                                                            </Link>
                                                        </NavigationMenuLink>
                                                    ))}
                                                </div>
                                            </NavigationMenuContent>
                                        </NavigationMenuItem>
                                    </NavigationMenuList>
                                </NavigationMenu>

                                {/* Standard Links */}
                                {navItems.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`text-sm font-medium transition-colors px-3 py-1 ${pathname === item.href ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                                            }`}
                                    >
                                        {item.name}
                                    </Link>
                                ))}

                                <button
                                    type="button"
                                    onClick={toggleTheme}
                                    className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                                    aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
                                >
                                    {isDark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
                                    <span className="hidden lg:inline">{theme === "dark" ? "Light" : "Dark"}</span>
                                </button>
                            </div>
                        )}

                        {/* Auth Buttons */}
                        <div className="flex items-center gap-3">
                            {session ? (
                                <button
                                    onClick={() => signOut()}
                                    className="px-4 py-2 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-full transition-colors"
                                >
                                    Logout
                                </button>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4"
                                    >
                                        Login
                                    </Link>
                                    <Link href="/register">
                                        <button className="px-5 py-2.5 bg-foreground text-background text-sm font-bold rounded-full hover:opacity-90 transition-colors cursor-pointer">
                                            Get Started
                                        </button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <div className="md:hidden flex items-center gap-2">
                        <button
                            type="button"
                            onClick={toggleTheme}
                            className="rounded-full border border-border bg-background p-2 text-foreground transition-colors hover:bg-muted"
                            aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
                        >
                            {isDark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
                        </button>
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="p-2 text-muted-foreground hover:text-foreground transition-colors z-50"
                        >
                            {menuOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}

            </nav>
            <div className={`md:hidden fixed inset-0 bg-background z-40 transition-transform duration-300 pt-24 px-6 ${menuOpen ? "translate-x-0" : "translate-x-full"
                }`}>
                <div className="flex flex-col gap-6">
                    <button
                        type="button"
                        onClick={toggleTheme}
                        className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                        <span>Theme</span>
                        <span className="flex items-center gap-2 text-muted-foreground">
                            {isDark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
                            {theme === "dark" ? "Light mode" : "Dark mode"}
                        </span>
                    </button>

                    {/* Features List for Mobile */}
                    <div className="space-y-4 pb-6 border-b border-border">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Platform</p>
                        {dropdownItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setMenuOpen(false)}
                                className="block"
                            >
                                <div className="text-lg font-medium text-foreground">{item.name}</div>
                                <div className="text-sm text-muted-foreground">{item.description}</div>
                            </Link>
                        ))}
                    </div>

                    {/* Navigation Links */}
                    <div className="space-y-4">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setMenuOpen(false)}
                                className="block text-lg font-medium text-muted-foreground hover:text-foreground"
                            >
                                {item.name}
                            </Link>
                        ))}
                    </div>

                    {/* Mobile Auth */}
                    <div className="pt-6 mt-auto">
                        {session ? (
                            <button
                                onClick={() => signOut()}
                                className="w-full py-3 rounded-xl border border-red-500/20 text-red-500 font-medium"
                            >
                                Logout
                            </button>
                        ) : (
                            <div className="flex flex-col gap-3">
                                <Link href="/register" onClick={() => setMenuOpen(false)}>
                                    <button className="w-full py-3 bg-foreground text-background font-bold rounded-xl">
                                        Get Started Free
                                    </button>
                                </Link>
                                <Link href="/login" onClick={() => setMenuOpen(false)}>
                                    <button className="w-full py-3 text-muted-foreground font-medium">
                                        Log In
                                    </button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Navbar;