
import { streamText } from "ai";
import { getModel } from "@/server/services/ai-provider";
import { db } from "@/lib/db";
import { VectorStore } from "@/server/services/vector-store";
import { auth } from "@/auth";

export const maxDuration = 60;

export async function handleChatRequest(req: Request, explicitProjectId?: string) {
    try {
        const session = await auth();

        if (!session) {
            return new Response("Unauthorized", { status: 401 });
        }

        // Debug logging for API Keys (Redacted)
        // const hasOpenAI = !!process.env.OPENAI_API_KEY;
        // const hasGroq = !!process.env.GROQ_API_KEY;
        // const provider = process.env.AI_PROVIDER || "openai";

        // console.log(`[Chat API] Provider: ${provider}, HasOpenAI: ${hasOpenAI}, HasGroq: ${hasGroq}`);
        // console.log(`[Chat API] Headers:`, [...req.headers.keys()]);
        // console.log(`[Chat API] URL:`, req.url);

        // Read body (might be empty if only headers are used, but typically messages are in body)
        let messages, bodyProjectId;
        try {
            const rawBody = await req.text();
            // console.log(`[Chat API] Raw Body: ${rawBody.substring(0, 500)}...`); // Log first 500 chars
            if (rawBody) {
                const body = JSON.parse(rawBody);
                messages = body.messages;
                bodyProjectId = body.projectId;
                // console.log(`[Chat API] Body parsed. ProjectId: ${bodyProjectId}, Messages count: ${messages?.length}`);
            }
        } catch (e) {
            console.error("[Chat API] Body parsing failed/empty:", (e as Error).message);
        }

        let projectId = explicitProjectId || bodyProjectId;

        // Fallback to headers for projectId
        if (!projectId) {
            projectId = req.headers.get("x-project-id");
        }

        // Fallback to query params for projectId
        if (!projectId) {
            const url = new URL(req.url);
            projectId = url.searchParams.get("projectId");
        }

        // console.log(`[Chat API] Final ProjectId: ${projectId}, Messages: ${!!messages}`);

        if (!messages || !projectId) {
            return new Response("Missing messages or projectId", { status: 400 });
        }

        // 1. Fetch Project Context (Safe)
        const project = await db.project.findUnique({
            where: { id: projectId },
            select: { name: true, repo: true, owner: true }
        });

        if (!project) {
            return new Response("Project not found", { status: 404 });
        }

        // 2. Fetch Analysis Context (Safe)
        let issuesContext = "No specific issues found.";
        try {
            const issues = await db.issue.findMany({
                where: { analysis: { projectId: projectId } },
                orderBy: { severity: "asc" },
                take: 5
            });
            if (issues.length > 0) {
                issuesContext = issues.map(i =>
                    `[${i.severity}] ${i.filePath}:${i.lineNumber} - ${i.message}`
                ).join("\n");
            }
        } catch (e) {
            console.error("Failed to fetch issues for chat:", e);
        }

        // 3. RAG Context (Safe)
        let codeContext = "No relevant code snippets available.";
        try {
            const lastMessage = messages[messages.length - 1];
            // Only search if user message and no attachments (assuming text only for now)
            if (lastMessage && lastMessage.role === 'user') {
                const vectorStore = new VectorStore();
                // console.log(`[Chat API] Searching for context: "${lastMessage.content}" in Project: ${projectId}`);
                const docs = await vectorStore.findSimilar(projectId, lastMessage.content);
                // console.log(`[Chat API] Found ${docs.length} relevant documents.`);
                if (docs.length > 0) {
                    codeContext = docs.map(d =>
                        `File: ${d.fileName}\n\`\`\`\n${d.content}\n\`\`\``
                    ).join("\n\n");
                }
            }
        } catch (e) {
            console.error("Vector search failed for chat (likely no embeddings/pgvector):", (e as Error).message);
        }

        // 4. Construct Prompt (Simplified System Prompt)
        const systemPrompt = `You are Oracle, an expert AI Code Reviewer for the project "${project.owner}/${project.repo}".
        Your goal is to answer questions about the codebase using the context provided in the user's message.
        `;

        // 5. Inject Context into User Message (Force Attention)
        let finalMessages = [...messages];
        if (codeContext && codeContext.length > 0 && finalMessages.length > 0) {
            const lastMsg = finalMessages[finalMessages.length - 1];
            if (lastMsg.role === 'user') {
                const augmentedContent = `
=== REPOSITORY CONTEXT START ===
${codeContext}

=== KNOWN ISSUES START ===
${issuesContext}
=== CONTEXT END ===

USER QUESTION:
${lastMsg.content}

INSTRUCTIONS:
1. Answer the user's question using ONLY the context above.
2. If the answer is in the context, give a detailed technical response.
3. If the answer is NOT in the context, state that you don't have that information.
`;
                // Create a new object to avoid mutating the original if it matters, though here it's fine
                finalMessages[finalMessages.length - 1] = {
                    ...lastMsg,
                    content: augmentedContent
                };
            }
        }

        // console.log("----- AUGMENTED USER MESSAGE -----");
        // console.log(finalMessages[finalMessages.length - 1].content);
        // console.log("----------------------------------");

        // 6. Stream Response
        try {
            const model = getModel();
            const result = await streamText({
                model: model,
                system: systemPrompt,
                messages: finalMessages, // Use the modified messages
            });

            return result.toTextStreamResponse();
        } catch (streamingError) {
            console.error("StreamText Error:", streamingError);
            return new Response(`AI Provider Error: ${(streamingError as Error).message}`, { status: 500 });
        }

    } catch (error) {
        console.error("Chat API Fatal Error:", error);
        return new Response(`Internal Server Error: ${(error as Error).message}`, { status: 500 });
    }
}

export async function POST(req: Request) {
    return handleChatRequest(req);
}
