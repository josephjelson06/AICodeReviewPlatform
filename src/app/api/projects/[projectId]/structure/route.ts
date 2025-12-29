// import { NextRequest, NextResponse } from "next/server";
// import { auth } from "@/auth";
// import { db } from "@/lib/db";
// import { GitHubService } from "@/server/services/github";
// import { ArchitectureService } from "@/server/services/architecture";

// export const maxDuration = 60; // Allow 60s for fetching and analyzing files

// export async function GET(
//     req: NextRequest,
//     context: { params: Promise<{ projectId: string }> }
// ) {
//     const { projectId } = await context.params;
//     const id = projectId;
//     const session = await auth();

//     if (!session || !session.user) {
//         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     try {
//         const project = await db.project.findUnique({
//             where: { id },
//             include: { user: true }
//         });

//         if (!project) {
//             return NextResponse.json({ error: "Project not found" }, { status: 404 });
//         }

//         const account = await db.account.findFirst({
//             where: { userId: session.user.id, provider: "github" },
//         });

//         if (!account?.access_token) {
//             return NextResponse.json({ error: "GitHub token missing" }, { status: 401 });
//         }

//         const github = new GitHubService(account.access_token);
//         const architecture = new ArchitectureService();

//         // 1. Get File Tree
//         const tree = await github.getFileTree(project.owner, project.repo);

//         // 2. Filter relevant source files (limit to 30 to avoid timeout for now)
//         // Focus on high-level architecture: entry points, services, components
//         const sourceFiles = tree
//             .filter(f => f.path && /\.(ts|tsx|js|jsx|py|java|go|php|rb|cs|c|cpp|rs)$/.test(f.path) && !f.path.includes(".test.") && !f.path.includes(".spec.") && !f.path.includes("node_modules"))
//             .slice(0, 50); // Increased limit for better coverage

//         // 3. Fetch Content Concurrently
//         const filesWithContent = await Promise.all(sourceFiles.map(async (file) => {
//             if (!file.path) return null;
//             try {
//                 const content = await github.getFileContent(project.owner, project.repo, file.path);
//                 return { path: file.path, content: content || "" };
//             } catch (e) {
//                 console.error(`Failed to fetch ${file.path}`);
//                 return null;
//             }
//         }));

//         const validFiles = filesWithContent.filter(f => f !== null) as { path: string, content: string }[];

//         // 4. Build Graph
//         const graph = architecture.analyzeStructure(validFiles);

//         return NextResponse.json(graph);

//     } catch (error: any) {
//         console.error("Architecture API Error:", error);
//         return NextResponse.json({ error: error.message }, { status: 500 });
//     }
// }
