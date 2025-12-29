import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Github, ArrowRight, Activity, Clock } from "lucide-react";
import { NewProjectModal } from "@/components/dashboard/new-project-modal";
import { DeleteProjectButton } from "./delete-button";
import { AppLayout } from "@/components/app-layout";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
    const session = await auth();
    if (!session) redirect("/api/auth/signin");

    const projects = await db.project.findMany({
        where: { userId: session.user.id },
        orderBy: { updatedAt: "desc" },
        include: {
            analyses: {
                orderBy: { createdAt: "desc" },
                take: 1
            }
        }
    });

    return (
        <AppLayout>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        Dashboard
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Manage your repositories and view deep analysis reports.
                    </p>
                </div>
                <div className="bg-primary/10 p-1 rounded-xl border border-primary/20 backdrop-blur-md">
                    <NewProjectModal />
                </div>
            </div>

            {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm p-16 text-center animate-in fade-in-50">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20 mb-6">
                        <Github className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">No repositories added yet</h3>
                    <p className="mb-8 text-gray-400 max-w-md text-lg">
                        Connect a GitHub repository to start analyzing your code quality with our deep scan engine.
                    </p>
                    <div className="bg-primary hover:bg-primary/90 rounded-lg transition-colors">
                        <NewProjectModal />
                    </div>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => {
                        const lastAnalysis = project.analyses[0];
                        const score = lastAnalysis?.score;

                        let scoreColor = "text-gray-400";
                        let borderColor = "border-white/5";

                        if (score) {
                            if (score >= 90) { scoreColor = "text-emerald-400"; borderColor = "hover:border-emerald-500/50"; }
                            else if (score >= 70) { scoreColor = "text-blue-400"; borderColor = "hover:border-blue-500/50"; }
                            else if (score >= 50) { scoreColor = "text-yellow-400"; borderColor = "hover:border-yellow-500/50"; }
                            else { scoreColor = "text-red-400"; borderColor = "hover:border-red-500/50"; }
                        }

                        return (
                            <Link
                                key={project.id}
                                href={`/projects/${project.id}`}
                                className="group relative block transition-all"
                            >
                                <div className={`h-full rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-md transition-all duration-300 hover:bg-white/[0.05] hover:shadow-2xl hover:-translate-y-1 hover:z-50 relative ${borderColor}`}>

                                    <div className="flex items-start justify-between mb-6">
                                        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                            <Github className="h-6 w-6 text-gray-300" />
                                        </div>
                                        {lastAnalysis ? (
                                            <div className={`flex flex-col items-end ${scoreColor}`}>
                                                <span className="text-3xl font-bold tracking-tighter">
                                                    {lastAnalysis.score ?? "0"}
                                                </span>
                                                <span className="text-xs font-medium uppercase tracking-wider opacity-70">
                                                    Score
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="px-3 py-1 rounded-full bg-white/5 text-xs text-gray-400 border border-white/5">
                                                New
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between mb-6">
                                        <div className="space-y-1">
                                            <h3 className="font-semibold text-xl truncate pr-2 group-hover:text-primary transition-colors">
                                                {project.repo}
                                            </h3>
                                            <p className="text-sm text-gray-500 truncate font-mono">
                                                {project.owner}
                                            </p>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                            <DeleteProjectButton projectId={project.id} />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <div className="flex items-center text-xs text-gray-500 gap-2">
                                            <Clock className="w-3 h-3" />
                                            {lastAnalysis
                                                ? new Date(lastAnalysis.createdAt).toLocaleDateString()
                                                : "Never scanned"}
                                        </div>
                                        <div className="flex items-center text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                                            View Report <ArrowRight className="ml-1 w-3 h-3" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}
        </AppLayout>
    )
}
