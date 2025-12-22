import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Github } from "lucide-react";
import { NewProjectModal } from "@/components/dashboard/new-project-modal";

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
        <div className="container py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Manage your repositories and view analysis reports.</p>
                </div>
                <NewProjectModal />
            </div>

            {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent">
                        <Github className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">No repositories added</h3>
                    <p className="mb-4 mt-2 text-sm text-muted-foreground max-w-sm">
                        Connect a GitHub repository to start analyzing your code quality.
                    </p>
                    <NewProjectModal />
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => {
                        const lastAnalysis = project.analyses[0];
                        return (
                            <Link
                                key={project.id}
                                href={`/projects/${project.id}`}
                                className="block group"
                            >
                                <div className="rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow p-6 h-full">
                                    <div className="flex flex-col space-y-1.5">
                                        <h3 className="text-lg font-semibold leading-none tracking-tight group-hover:text-primary transition-colors">
                                            {project.owner}/{project.repo}
                                        </h3>
                                        <p className="text-sm text-muted-foreground truncate">{project.url}</p>
                                    </div>
                                    <div className="p-0 pt-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Last Analysis</span>
                                            {lastAnalysis ? (
                                                <div className={`text-sm font-bold ${lastAnalysis.score && lastAnalysis.score > 80 ? "text-green-500" :
                                                    lastAnalysis.score && lastAnalysis.score > 50 ? "text-yellow-500" : "text-red-500"
                                                    }`}>
                                                    {lastAnalysis.score ? `${lastAnalysis.score}/100` : lastAnalysis.status}
                                                </div>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">None</span>
                                            )}
                                        </div>
                                        <div className="mt-2 text-xs text-muted-foreground">
                                            {lastAnalysis ? new Date(lastAnalysis.createdAt).toLocaleDateString() : "Never"}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
