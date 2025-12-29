"use client";

import { Sidebar } from "./sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen relative overflow-hidden bg-[#030712] text-white">
            {/* Dynamic Background */}
            <div className="fixed inset-0 z-[-1]">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[128px]" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[128px]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
            </div>

            <Sidebar />

            <main className="pl-64 min-h-screen">
                <div className="container mx-auto p-8 max-w-7xl animate-in fade-in duration-500">
                    {children}
                </div>
            </main>
        </div>
    );
}
