"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Zap, Shield, Layers, Box, Code, Terminal } from "lucide-react";

interface Issue {
    id: string;
    severity: string;
    category: string;
    filePath: string;
    lineNumber: number;
    message: string;
    code?: string;
}

export function IssueList({ analysisId }: { analysisId: string }) {
    const [issues, setIssues] = useState<Issue[]>([]);
    const [filter, setFilter] = useState("ALL");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/analysis/${analysisId}/issues`)
            .then((res) => res.json())
            .then((data) => {
                setIssues(data);
                setLoading(false);
            });
    }, [analysisId]);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading analysis data...</div>;

    const filteredIssues = filter === "ALL"
        ? issues
        : issues.filter(i => i.category === filter);

    const categories = [
        { id: "ALL", label: "All Issues", icon: Box },
        { id: "SECURITY", label: "Security", icon: Shield },
        { id: "PERFORMANCE", label: "Performance", icon: Zap },
        { id: "ARCHITECTURE", label: "Architecture", icon: Layers },
        { id: "BEST_PRACTICE", label: "Best Practices", icon: Code },
    ];

    return (
        <div>
            {/* Tabs */}
            <div className="flex overflow-x-auto border-b border-white/5 px-6">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setFilter(cat.id)}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${filter === cat.id
                                ? "border-primary text-primary"
                                : "border-transparent text-gray-400 hover:text-gray-200"
                            }`}
                    >
                        <cat.icon className="w-4 h-4" />
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="p-6 space-y-4">
                <AnimatePresence mode="popLayout">
                    {filteredIssues.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-12 text-gray-500"
                        >
                            No issues found in this category. Good job!
                        </motion.div>
                    ) : (
                        filteredIssues.map((issue, index) => (
                            <motion.div
                                key={issue.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="group rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden hover:bg-white/[0.04] transition-colors"
                            >
                                <div className="p-4 flex gap-4">
                                    <div className={`mt-1 p-2 rounded-lg ${issue.severity === "CRITICAL" ? "bg-red-500/10 text-red-500" :
                                            issue.severity === "HIGH" ? "bg-orange-500/10 text-orange-500" :
                                                "bg-blue-500/10 text-blue-500"
                                        }`}>
                                        <AlertCircle className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-4 mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${issue.severity === "CRITICAL" ? "border-red-900 bg-red-900/20 text-red-400" :
                                                        issue.severity === "HIGH" ? "border-orange-900 bg-orange-900/20 text-orange-400" :
                                                            "border-blue-900 bg-blue-900/20 text-blue-400"
                                                    }`}>
                                                    {issue.severity}
                                                </span>
                                                <span className="text-xs font-mono text-gray-500">
                                                    {issue.filePath}:{issue.lineNumber}
                                                </span>
                                            </div>
                                            <span className="text-xs font-medium text-gray-500 border border-white/5 rounded px-2 py-1">
                                                {issue.category}
                                            </span>
                                        </div>
                                        <h4 className="text-sm font-medium text-gray-200 mb-2 leading-relaxed">
                                            {issue.message}
                                        </h4>

                                        {issue.code && (
                                            <div className="mt-3 relative rounded-lg bg-black/30 border border-white/5 p-3 font-mono text-xs text-gray-300 overflow-x-auto">
                                                <pre>{issue.code}</pre>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
