
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/app-layout";
import { AnalyzeButton } from "./analyze-button";
// import { ArchitectureViewer } from "@/components/architecture-viewer";

import { ExportButton } from "./export-button";


import { IssueList } from "./issue-list";
import { ArrowLeft, Shield, Zap, Layers, Box, FileCode, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    if (!session) redirect("/api/auth/signin");

    const project = await db.project.findFirst({
        where: { id, userId: session.user.id },
        include: {
            analyses: {
                orderBy: { createdAt: "desc" },
                take: 1
            }
        }
    });

    if (!project) redirect("/dashboard");

    const lastAnalysis = project.analyses[0];

    // Calculate stats
    let criticalCount = 0;
    let highCount = 0;

    // We'll fetch full issues client side or server side for the list, 
    // but for the header summary, let's grab counts if analysis exists.
    if (lastAnalysis?.id) {
        criticalCount = await db.issue.count({ where: { analysisId: lastAnalysis.id, severity: "CRITICAL" } });
        highCount = await db.issue.count({ where: { analysisId: lastAnalysis.id, severity: "HIGH" } });
    }

    return (
        <AppLayout>
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/dashboard"
                    className="inline-flex items-center text-sm text-gray-500 hover:text-white transition-colors mb-6"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                </Link>

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight text-white">{project.repo}</h1>
                            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-gray-400">
                                {project.owner}
                            </span>
                        </div>
                        <a
                            href={project.url}
                            target="_blank"
                            className="text-sm text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1"
                        >
                            {project.url}
                        </a>
                    </div>

                    <div className="flex items-center gap-4">
                        <ExportButton />
                        <AnalyzeButton projectId={project.id} />
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-gray-400">Overall Score</span>
                    </div>
                    <div className="text-4xl font-bold text-white">
                        {lastAnalysis?.score ?? "-"}
                        <span className="text-lg text-gray-600 font-normal ml-1">/100</span>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-gray-400">Critical Issues</span>
                    </div>
                    <div className="text-4xl font-bold text-white">{criticalCount}</div>
                </div>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                            <Shield className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-gray-400">High Severity</span>
                    </div>
                    <div className="text-4xl font-bold text-white">{highCount}</div>
                </div>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                            <Zap className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-gray-400">Status</span>
                    </div>
                    <div className="text-lg font-bold text-white uppercase tracking-wider">
                        {lastAnalysis?.status ?? "READY"}
                    </div>
                </div>
            </div>

            {/* Architecture Blueprint */}
            {/* <div className="mb-8">
                <div className="flex items-center gap-2 mb-4 px-1">
                    <Layers className="w-5 h-5 text-purple-400" />
                    <h2 className="text-xl font-semibold text-white">Project Blueprint</h2>
                </div>
                <ArchitectureViewer projectId={project.id} />
            </div> */}

            {/* Analysis Results */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden min-h-[500px]">
                {lastAnalysis ? (
                    <Suspense fallback={<div className="p-8 text-center">Loading issues...</div>}>
                        <IssueList analysisId={lastAnalysis.id} />
                    </Suspense>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                            <Box className="w-10 h-10 text-gray-500" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No Analysis Yet</h3>
                        <p className="text-gray-500 max-w-sm mb-8">
                            Start your first Deep Scan to uncover security vulnerabilities and performance bottlenecks.
                        </p>
                        <AnalyzeButton projectId={project.id} />
                    </div>
                )}
            </div>

        </AppLayout>
    );
}
