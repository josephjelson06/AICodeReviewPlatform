import { inngest } from "./client";
import { db } from "@/lib/db";
import { GitHubService } from "@/server/services/github";
import { VectorStore } from "@/server/services/vector-store";
import { createHash } from "crypto";
import { generateText, LanguageModel } from "ai";
import { getModel } from "@/server/services/ai-provider";

// Re-instantiate services inside the function to ensure freshness
// Note: Inngest functions should be idempotent where possible

export const analyzeRepository = inngest.createFunction(
    { id: "analyze-repository" },
    { event: "analysis.start" },
    async ({ event, step }) => {
        const { analysisId, userId, projectId, accessToken } = event.data;
        const vectorStore = new VectorStore();

        // 1. Fetch Project & Files
        const { project, codeFiles } = await step.run("fetch-files", async () => {
            const project = await db.project.findUnique({ where: { id: projectId } });
            if (!project) throw new Error("Project not found");

            const github = new GitHubService(accessToken);
            console.log(`[Job ${analysisId}] Fetching file tree for ${project.owner}/${project.repo}...`);
            const tree = await github.getFileTree(project.owner, project.repo);

            if (!tree || tree.length === 0) {
                throw new Error("No files found or failed to fetch tree");
            }

            // Filter for code files only
            const codeFiles = tree.filter((f) =>
                /\.(ts|tsx|js|jsx|py|java|go|rs|cpp|c|cs|rb|php|json|md)$/.test(f.path || "")
            ).slice(0, 30); // Stick to the limit from before

            return { project, codeFiles };
        });

        // 2. Analyze Code Chunks
        // We'll process files in batches
        let totalIssues = 0;
        const filesToEmbed: { path: string, content: string }[] = [];

        // Note: Inngest can handle steps, but strictly iterating inside a step is often better for performance 
        // unless we want granular retries per file. For now, we keep the batch logic inside a single step 
        // to avoid thousands of step calls for a single repo.
        const analysisResults = await step.run("analyze-files", async () => {
            const github = new GitHubService(accessToken);
            let severityCounts = {
                CRITICAL: 0,
                HIGH: 0,
                MEDIUM: 0,
                LOW: 0,
            };

            // Helper function for AI analysis (internal to this step)
            const analyzeCode = async (projectId: string, filePath: string, content: string) => {
                try {
                    // 1. Check Cache
                    const hash = createHash("sha256").update(content).digest("hex");
                    const cached = await db.fileCache.findUnique({
                        where: {
                            projectId_filePath_hash: { projectId, filePath, hash }
                        }
                    });

                    if (cached) {
                        try {
                            return JSON.parse(cached.issues);
                        } catch (e) {
                            console.error("Cache corrupted, re-analyzing...");
                        }
                    }

                    const systemPrompt = `You are an expert Senior Software Engineer and Code Reviewer.
                    Your task is to provide a "CodeAnt" style deep technical analysis.
                    
                    Analyze the provided code for:
                    1. Security (Injection, Secrets, Auth flaws)
                    2. Performance (Big O complexity, Memory leaks)
                    3. Architecture (Coupling, Cohesion, Design Patterns)
                    4. Testing (Is this code testable? Missing edge cases?)
                    5. Best Practices (Naming, Types, Docstrings)

                    Be strict. Return the result ONLY as a raw JSON object matching this structure:
                    {
                      "issues": [
                        {
                          "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
                          "category": "SECURITY" | "PERFORMANCE" | "ARCHITECTURE" | "MAINTAINABILITY" | "TESTING" | "BEST_PRACTICE",
                          "lineNumber": number,
                          "message": "Detailed technical explanation",
                          "code": "optional code snippet",
                          "suggestion": { "diff": "diff string", "explanation": "technical justification" } (optional)
                        }
                      ]
                    }
                    Do not include markdown. Just JSON.`;

                    const userPrompt = `File: ${filePath}\n\nCode:\n${content}`;

                    // We can reuse the retry logic or let Inngest handle retries for the whole block.
                    // Since this is inside step.run, a failure here fails the step. 
                    // We'll try-catch individually to avoid failing the whole batch.

                    let rawText = "";
                    const isProduction = process.env.NODE_ENV === "production";
                    const useManualOllama = !isProduction && process.env.AI_PROVIDER === "ollama";

                    if (useManualOllama) {
                        // Dynamic import to avoid issues in edge envs if they ever happen, though this is Node
                        const { generateOllamaResponse } = await import("@/server/services/ai-provider");
                        rawText = await generateOllamaResponse(systemPrompt, userPrompt);
                    } else {
                        // Cast the model to any to bypass version mismatch in AI SDK types
                        const model = getModel() as unknown as LanguageModel;
                        const { text } = await generateText({
                            model: model,
                            system: systemPrompt,
                            prompt: userPrompt,
                        });
                        rawText = text;
                    }

                    const cleanText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
                    const parsed = JSON.parse(cleanText);
                    const issues = parsed.issues || [];

                    // Save to cache
                    await db.fileCache.upsert({
                        where: { projectId_filePath_hash: { projectId, filePath, hash } },
                        update: {},
                        create: { projectId, filePath, hash, issues: JSON.stringify(issues) }
                    }).catch((e: any) => console.warn("Cache write skipped:", e.message));

                    return issues;

                } catch (e) {
                    console.error(`Analysis failed for ${filePath}`, e);
                    return [];
                }
            };

            // Process files
            for (const file of codeFiles) {
                if (!file.path) continue;

                try {
                    const content = await github.getFileContent(project.owner, project.repo, file.path);
                    if (!content || content.length > 30000) continue;

                    filesToEmbed.push({ path: file.path, content });

                    // Skip package.json and others for now, just simplified logic
                    if (file.path.endsWith("package.json")) continue;

                    const issues = await analyzeCode(projectId, file.path, content);

                    for (const issue of issues) {
                        const safeSeverity = ["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(issue.severity) ? issue.severity : "LOW";
                        const safeCategory = ["SECURITY", "PERFORMANCE", "ARCHITECTURE", "MAINTAINABILITY", "BEST_PRACTICE", "DEPENDENCY", "TESTING"].includes(issue.category) ? issue.category : "BEST_PRACTICE";

                        if (safeSeverity === "CRITICAL") severityCounts.CRITICAL++;
                        if (safeSeverity === "HIGH") severityCounts.HIGH++;
                        if (safeSeverity === "MEDIUM") severityCounts.MEDIUM++;
                        if (safeSeverity === "LOW") severityCounts.LOW++;

                        await db.issue.create({
                            data: {
                                analysisId,
                                filePath: file.path,
                                severity: safeSeverity,
                                category: safeCategory,
                                lineNumber: issue.lineNumber || 0,
                                message: issue.message || "Issue identified",
                                code: issue.code || "",
                                suggestion: issue.suggestion ? {
                                    create: {
                                        diff: issue.suggestion.diff || "",
                                        explanation: issue.suggestion.explanation || ""
                                    }
                                } : undefined
                            }
                        });
                    }

                } catch (err) {
                    console.error(`Error processing file ${file.path}:`, err);
                }
            }
            return { processedCount: codeFiles.length, severityCounts, filesToEmbed };
        });

        // 3. Generate Embeddings
        await step.run("generate-embeddings", async () => {
            try {
                // Recover filesToEmbed from the previous step result
                const files = analysisResults.filesToEmbed;
                console.log(`[Job ${analysisId}] Generating embeddings for ${files.length} files...`);
                await vectorStore.addDocuments(projectId, files);
            } catch (error) {
                console.error("Embedding generation failed:", error);
                // Non-fatal
            }
        });

        // 4. Update Final Status
        await step.run("update-status", async () => {
            const { CRITICAL, HIGH, MEDIUM, LOW } = analysisResults.severityCounts;
            // Weighted deduction
            // Weighted deduction (Adjusted to be less harsh)
            const deduction = (CRITICAL * 5) + (HIGH * 3) + (MEDIUM * 1) + (LOW * 0.1);
            const finalScore = Math.max(0, Math.round(100 - deduction));

            console.log(`[Job ${analysisId}] Score Calculation Breakdown:`);
            console.log(`- Critical: ${CRITICAL} x 10 = -${CRITICAL * 10}`);
            console.log(`- High:     ${HIGH} x 5 = -${HIGH * 5}`);
            console.log(`- Medium:   ${MEDIUM} x 2 = -${MEDIUM * 2}`);
            console.log(`- Low:      ${LOW} x 1 = -${LOW * 1}`);
            console.log(`- Total Deduction: ${deduction}`);
            console.log(`- Final Score: ${finalScore} (Floor 0)`);

            await db.analysis.update({
                where: { id: analysisId },
                data: { status: "COMPLETED", score: finalScore },
            });
        });

        return { success: true, analysisId };
    }
);
