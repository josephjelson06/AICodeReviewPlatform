import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, Shield, Zap, Box, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { IssueCard } from "./issue-card";
import { ExportButton } from "@/components/ui/export-button";

export default async function AnalysisPage({
    params,
}: {
    params: Promise<{ id: string; analysisId: string }>;
}) {
    const { id, analysisId } = await params;
    const session = await auth();
    if (!session) redirect("/api/auth/signin");

    const analysis = await db.analysis.findUnique({
        where: { id: analysisId },
        include: {
            issues: {
                include: { suggestion: true },
                orderBy: { severity: "asc" } // Critical first (Wait, enum sorting might be alphabetical? Enum: CRITICAL, HIGH... C before H. Actually we want custom order)
                // We can sort in JS
            },
            project: true
        }
    });

    if (!analysis) return <div>Analysis not found</div>;

    // Manual sorting map
    const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    const sortedIssues = [...analysis.issues].sort((a, b) => severityOrder[a.severity as keyof typeof severityOrder] - severityOrder[b.severity as keyof typeof severityOrder]);

    const criticalCount = sortedIssues.filter(i => i.severity === "CRITICAL").length;
    const highCount = sortedIssues.filter(i => i.severity === "HIGH").length;

    return (
        <div className="container py-8 max-w-6xl">
            <div className="flex items-center gap-4 mb-8">
                <Link href={`/projects/${id}`} className="text-muted-foreground hover:text-primary">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Analysis Report</h1>
                    <p className="text-muted-foreground">Scan #{analysis.id.slice(-6)} • {new Date(analysis.createdAt).toLocaleString()}</p>
                </div>
                <div className="ml-auto flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-sm text-muted-foreground">Overall Score</span>
                        <span className="text-4xl font-bold">{analysis.score}/100</span>
                    </div>
                    <ExportButton project={analysis.project} analysis={analysis} issues={analysis.issues} />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-4 mb-8">
                <div className="bg-card border rounded-lg p-4 flex flex-col justify-between">
                    <span className="text-muted-foreground text-sm font-medium">Critical Issues</span>
                    <div className="flex items-center gap-2 mt-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <span className="text-2xl font-bold">{criticalCount}</span>
                    </div>
                </div>
                <div className="bg-card border rounded-lg p-4 flex flex-col justify-between">
                    <span className="text-muted-foreground text-sm font-medium">Improvement Areas</span>
                    <div className="flex items-center gap-2 mt-2">
                        <Zap className="h-5 w-5 text-yellow-600" />
                        <span className="text-2xl font-bold">{highCount}</span>
                    </div>
                </div>
                <div className="bg-card border rounded-lg p-4 flex flex-col justify-between">
                    <span className="text-muted-foreground text-sm font-medium">Files Scanned</span>
                    <div className="flex items-center gap-2 mt-2">
                        <Box className="h-5 w-5 text-blue-600" />
                        <span className="text-2xl font-bold">-</span> {/* Placeholder as we didn't store file count */}
                    </div>
                </div>
                <div className="bg-card border rounded-lg p-4 flex flex-col justify-between">
                    <span className="text-muted-foreground text-sm font-medium">Status</span>
                    <div className="flex items-center gap-2 mt-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-lg font-bold">{analysis.status}</span>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <h2 className="text-xl font-semibold">Detailed Findings</h2>
                {sortedIssues.length === 0 ? (
                    <div className="text-center py-12 border rounded-lg">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold">No issues found!</h3>
                        <p className="text-muted-foreground">Your code looks great.</p>
                    </div>
                ) : (
                    sortedIssues.map(issue => (
                        <IssueCard key={issue.id} issue={issue} />
                    ))
                )}
            </div>
        </div >
    );
}
