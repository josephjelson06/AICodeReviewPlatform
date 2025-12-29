"use client";

import Link from "next/link";
import { ArrowRight, Shield, Zap, Bot, Code2, GitBranch, Terminal } from "lucide-react";
import { FadeIn, SlideIn, ScaleIn } from "@/components/ui/motion-wrapper";
import { motion } from "framer-motion";

export default function LandingPage() {
    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Aurora Background */}
            <div className="aurora-bg" />

            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-background/50 backdrop-blur-md">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white">
                            <Bot className="w-5 h-5" />
                        </span>
                        <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                            AICodeReview
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link
                            href="/api/auth/signin"
                            className="px-4 py-2 text-sm font-medium hover:text-primary transition-colors"
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/api/auth/signin"
                            className="hidden sm:flex px-4 py-2 rounded-full bg-primary hover:bg-primary/90 text-white text-sm font-medium transition-all shadow-[0_0_20px_-5px_var(--primary)]"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4">
                <div className="container mx-auto text-center max-w-5xl">
                    <FadeIn>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-medium mb-8">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            v2.0 Now Available
                        </div>
                    </FadeIn>

                    <FadeIn delay={0.1}>
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
                            Code Reviews on <br />
                            <span className="bg-gradient-to-r from-primary via-purple-500 to-cyan-500 bg-clip-text text-transparent animate-gradient">
                                Autopilot
                            </span>
                        </h1>
                    </FadeIn>

                    <FadeIn delay={0.2}>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
                            Elevate your code quality with our elite AI engine. Detect security flaws, optimize performance, and refactor instantly—before you push.
                        </p>
                    </FadeIn>

                    <ScaleIn delay={0.3}>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/api/auth/signin"
                                className="w-full sm:w-auto px-8 py-4 rounded-full bg-primary hover:bg-primary/90 text-white font-medium text-lg flex items-center justify-center gap-2 shadow-[0_0_30px_-5px_var(--primary)] transition-all hover:scale-105"
                            >
                                Analyze Repo <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                href="https://github.com/josephjelson06/AICodeReviewPlatform"
                                target="_blank"
                                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium text-lg flex items-center justify-center gap-2 backdrop-blur-sm transition-all"
                            >
                                View on GitHub
                            </Link>
                        </div>
                    </ScaleIn>
                </div>
            </section>

            {/* Feature Grid */}
            <section className="py-20 px-4">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Shield className="w-8 h-8 text-cyan-400" />}
                            title="Bank-Grade Security"
                            description="Identify vulnerabilities, exposed secrets, and injection risks with our deep-scanning engine."
                            delay={0.4}
                        />
                        <FeatureCard
                            icon={<Zap className="w-8 h-8 text-yellow-400" />}
                            title="Performance Profiler"
                            description="Spot memory leaks, unoptimized queries, and slow algorithmic patterns automatically."
                            delay={0.5}
                        />
                        <FeatureCard
                            icon={<Code2 className="w-8 h-8 text-purple-400" />}
                            title="Smart Refactoring"
                            description="Not just complaints—get copy-paste ready code improvements instantly."
                            delay={0.6}
                        />
                    </div>
                </div>
            </section>

            {/* Code Demo Section */}
            <section className="py-20 px-4 border-y border-white/5 bg-white/2">
                <div className="container mx-auto max-w-5xl">
                    <div className="flex flex-col md:flex-row items-center gap-12">
                        <div className="flex-1 space-y-6">
                            <SlideIn delay={0.2}>
                                <h2 className="text-3xl font-bold">Your Personal Senior Engineer</h2>
                                <p className="text-muted-foreground text-lg">
                                    Stop waiting for code reviews. Get instant feedback on your PRs with detailed explanations and fix suggestions.
                                </p>
                                <ul className="space-y-4 pt-4">
                                    {[
                                        "Instant feedback loop",
                                        "Consistency across team",
                                        "Educational insights",
                                        "Time-saving automations"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                                                <ArrowRight className="w-4 h-4 text-green-500" />
                                            </div>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </SlideIn>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                            className="flex-1 w-full"
                        >
                            <div className="glass-card rounded-xl overflow-hidden border border-white/10 relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-black/40">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                        <div className="w-3 h-3 rounded-full bg-green-500/50" />
                                    </div>
                                    <span className="text-xs text-white/40 font-mono ml-2">analysis_result.json</span>
                                </div>
                                <div className="p-6 font-mono text-sm space-y-4 bg-black/40">
                                    <div className="flex gap-4">
                                        <span className="text-white/20">01</span>
                                        <span className="text-purple-400">function optimize() {"{"}</span>
                                    </div>
                                    <div className="flex gap-4 bg-red-500/10 -mx-6 px-6 border-l-2 border-red-500">
                                        <span className="text-white/20">02</span>
                                        <span className="text-red-300">- const data = await fetchAll();</span>
                                    </div>
                                    <div className="flex gap-4 bg-green-500/10 -mx-6 px-6 border-l-2 border-green-500">
                                        <span className="text-white/20">02</span>
                                        <span className="text-green-300">+ const data = await fetchPaged(); // Fix: Pagination</span>
                                    </div>
                                    <div className="flex gap-4">
                                        <span className="text-white/20">03</span>
                                        <span className="text-purple-400">{"}"}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 border-t border-white/5 text-center text-sm text-muted-foreground">
                <p>© 2025 AI Code Review Platform. Built for developers.</p>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            viewport={{ once: true }}
            className="glass-card p-8 rounded-2xl hover:border-primary/50 transition-all group"
        >
            <div className="mb-6 p-4 rounded-xl bg-white/5 w-fit group-hover:bg-primary/20 transition-colors">
                {icon}
            </div>
            <h3 className="text-xl font-semibold mb-3">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">
                {description}
            </p>
        </motion.div>
    );
}
