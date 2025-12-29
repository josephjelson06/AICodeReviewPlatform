import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await context.params;
        const session = await auth();

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify project ownership
        const project = await db.project.findUnique({
            where: { id: projectId },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        if (project.userId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Manual cleanup for models that might not have Cascade (like FileCache if no relation)
        // Schema shows FileCache has projectId but no relation field.
        await db.fileCache.deleteMany({
            where: { projectId: projectId }
        });

        // Delete Project (Prisma Cascade will handle Analysis, Issues, Embeddings)
        await db.project.delete({
            where: { id: projectId }
        });

        return NextResponse.json({ message: "Project deleted successfully" });

    } catch (error: any) {
        console.error("Delete Project Error:", error);
        return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
    }
}
