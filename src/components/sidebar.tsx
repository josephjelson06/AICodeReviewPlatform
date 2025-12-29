"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogOut, Settings, Github, Code2, Bot } from "lucide-react";
import { motion } from "framer-motion";
import { signOut } from "next-auth/react";

const NAV_ITEMS = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    // { label: "Repositories", href: "/dashboard", icon: Github }, // Future feature
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <motion.aside
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-white/5 bg-black/20 backdrop-blur-xl transition-all"
        >
            <div className="flex h-16 items-center px-6 border-b border-white/5">
                <div className="flex items-center gap-2 font-bold text-xl">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-900/20">
                        <Bot className="w-5 h-5" />
                    </span>
                    <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                        Nebula
                    </span>
                </div>
            </div>

            <div className="flex flex-col justify-between h-[calc(100vh-4rem)] px-4 py-6">
                <nav className="space-y-2">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive
                                    ? "bg-primary/10 text-primary shadow-[0_0_20px_-5px_var(--primary)] border border-primary/20"
                                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                                    }`}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t border-white/5 pt-6 space-y-2">
                    <div className="px-4 py-2">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                            Workspace
                        </div>
                        <div className="space-y-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                AI Engine Online
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => signOut()}
                        className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-all group"
                    >
                        <LogOut className="w-4 h-4 group-hover:rotate-180 transition-transform" />
                        Sign Out
                    </button>
                </div>
            </div>
        </motion.aside>
    );
}
