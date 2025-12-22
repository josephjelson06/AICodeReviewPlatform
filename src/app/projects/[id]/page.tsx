import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, FileText, CheckCircle, AlertTriangle, XCircle, ArrowRight } from "lucide-react";
import { AnalyzeButton } from "./analyze-button"; // Need to create this client component

export const dynamic = "force-dynamic";

export default async function ProjectPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const session = await auth();
    if (!session) redirect("/api/auth/signin");

    const project = await db.project.findUnique({
        where: { id },
        include: {
            analyses: {
                orderBy: { createdAt: "desc" }
            }
        }
    });

    if (!project) return <div>Project not found</div>;

    return (
        <div className="container py-8 max-w-5xl">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard" className="text-muted-foreground hover:text-primary">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">{project.owner}/{project.repo}</h1>
                <div className="ml-auto">
                    <AnalyzeButton projectId={project.id} />
                </div>
            </div>

            <div className="grid gap-6">
                <h2 className="text-xl font-semibold">Analysis History</h2>
                {project.analyses.length === 0 ? (
                    <div className="text-center py-12 border rounded-lg bg-muted/10">
                        <p className="text-muted-foreground">No analyses run yet. Click "Analyze Layout" to start.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {project.analyses.map((analysis) => (
                            <Link
                                key={analysis.id}
                                href={`/projects/${project.id}/analysis/${analysis.id}`}
                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    {analysis.status === "COMPLETED" && <CheckCircle className="h-5 w-5 text-green-500" />}
                                    {analysis.status === "FAILED" && <XCircle className="h-5 w-5 text-red-500" />}
                                    {analysis.status === "PENDING" && <Play className="h-5 w-5 text-blue-500 animate-pulse" />}

                                    <div>
                                        <div className="font-medium">
                                            Scan #{analysis.id.slice(-6)}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {new Date(analysis.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    {analysis.score !== null && (
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm text-muted-foreground">Score</span>
                                            <span className={`font-bold ${analysis.score > 80 ? "text-green-600" : analysis.score > 50 ? "text-yellow-600" : "text-red-600"
                                                }`}>
                                                {analysis.score}/100
                                            </span>
                                        </div>
                                    )}
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
