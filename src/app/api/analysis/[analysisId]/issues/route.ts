import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string; analysisId: string }> }
) {
    const session = await auth();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const { analysisId } = await params;

    const issues = await db.issue.findMany({
        where: { analysisId },
        orderBy: { severity: "asc" }, // Critical first usually (lexicographically C < H? No. C comes before H? Wait. CRITICAL vs HIGH. C < H. So asc is good? No. C-R-I vs H-I-G. C < H. So Critical is first.)
        // Actually lets fix sort order manually if needed, but strings are ok for now.
    });

    // Custom sort: CRITICAL > HIGH > MEDIUM > LOW
    const severityWeight = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    issues.sort((a, b) => severityWeight[a.severity as keyof typeof severityWeight] - severityWeight[b.severity as keyof typeof severityWeight]);

    return NextResponse.json(issues);
}
