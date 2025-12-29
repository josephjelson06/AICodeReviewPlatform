
import { handleChatRequest } from "@/app/api/chat/route";
import { type NextRequest } from "next/server";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    const { projectId } = await params;
    return handleChatRequest(req, projectId);
}
