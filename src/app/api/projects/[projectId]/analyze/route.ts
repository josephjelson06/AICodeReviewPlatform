import { auth } from "@/auth";
import { AnalysisService } from "@/server/services/analysis";
import { NextResponse } from "next/server";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ projectId: string }> } // Params are promises in Next.js 15+ (Wait, create-next-app was used. Next 14/15 changes params access)
) {
    // Await params if Next.js 15, or just use if Next 14. 
    // create-next-app@latest usually installs Next 15 now.
    // Safe to await.
    const { projectId } = await params;

    const session = await auth();
    if (!session?.user?.id || !session.accessToken) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const analysisService = new AnalysisService();
        // We await this. In production, offload to a queue (Inngest/BullMQ).
        const analysis = await analysisService.analyzeRepository(
            session.user.id,
            projectId,
            session.accessToken
        );

        return NextResponse.json(analysis);

    } catch (error) {
        console.error("Analysis Trigger Error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
