import { auth } from "@/auth";
import { db } from "@/lib/db";
import { GitHubService } from "@/server/services/github";
import { NextResponse } from "next/server";
import { z } from "zod";

const CreateProjectSchema = z.object({
    url: z.string().url(),
});

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id || !session.accessToken) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const json = await req.json();
        const { url } = CreateProjectSchema.parse(json);

        // Extract owner/repo from URL
        // e.g. https://github.com/owner/repo
        const regex = /github\.com\/([^\/]+)\/([^\/]+)/;
        const match = url.match(regex);
        if (!match) {
            return new NextResponse("Invalid GitHub URL", { status: 400 });
        }
        const [, owner, repo] = match;

        // Verify access
        const github = new GitHubService(session.accessToken);
        const repoDetails = await github.getRepository(owner, repo);

        // Create Project
        const project = await db.project.create({
            data: {
                name: repoDetails.name,
                owner: repoDetails.owner.login,
                repo: repoDetails.name,
                url: repoDetails.html_url,
                userId: session.user.id,
            }
        });

        return NextResponse.json(project);

    } catch (error) {
        console.error("Project creation error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const projects = await db.project.findMany({
        where: { userId: session.user.id },
        orderBy: { updatedAt: 'desc' },
        include: { analyses: { orderBy: { createdAt: 'desc' }, take: 1 } }
    });

    return NextResponse.json(projects);
}
