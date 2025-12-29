import { db } from "@/lib/db";
import { inngest } from "@/inngest/client";
import { GitHubService } from "./github";
import { generateText } from "ai";
import { createHash } from "crypto";
import { z } from "zod";
import { getModel } from "./ai-provider";
// import { ASTAnalysisService } from "./ast-analysis";
// import { DependencyAnalysisService } from "./dependency-analysis";
import { VectorStore } from "./vector-store";

const IssueSchema = z.object({
    issues: z.array(
        z.object({
            severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
            category: z.enum([
                "SECURITY",
                "PERFORMANCE",
                "ARCHITECTURE",
                "MAINTAINABILITY",
                "BEST_PRACTICE",
                "DEPENDENCY",
                "TESTING"
            ]),
            lineNumber: z.number(),
            message: z.string(),
            code: z.string().optional(),
            suggestion: z
                .object({
                    diff: z.string(),
                    explanation: z.string(),
                })
                .optional(),
        })
    ),
});

export class AnalysisService {
    // private astAnalysis = new ASTAnalysisService();
    // private dependencyAnalysis = new DependencyAnalysisService();
    private vectorStore = new VectorStore();

    /**
     * Orchestrates the analysis of a repository
     */
    /**
     * Starts the analysis job (Async/Fire-and-Forget pattern)
     * Returns the PENDING analysis record immediately.
     */
    async startAnalysis(userId: string, projectId: string, accessToken: string) {
        // 1. Create Analysis Record (PENDING)
        const analysis = await db.analysis.create({
            data: {
                projectId,
                status: "PENDING",
            },
        });

        // 2. Trigger Inngest Event (Background Job)
        await inngest.send({
            name: "analysis.start",
            data: {
                analysisId: analysis.id,
                userId,
                projectId,
                accessToken
            },
        });

        // REMOVED: this.processAnalysis(...) manual call.
        // We rely 100% on Inngest now.

        return analysis;
    }

    /**
     * The heavy lifting function (runs in background)
     */
    private async processAnalysis(
        analysisId: string,
        userId: string,
        projectId: string,
        accessToken: string
    ) {
        try {
            // 1. Get Project
            const project = await db.project.findUnique({ where: { id: projectId } });
            if (!project) throw new Error("Project not found");

            // 2. Init GitHub
            const github = new GitHubService(accessToken);

            // 3. Get Files
            console.log(`[Job ${analysisId}] Fetching file tree for ${project.owner}/${project.repo}...`);
            const tree = await github.getFileTree(project.owner, project.repo);

            if (!tree || tree.length === 0) {
                throw new Error("No files found or failed to fetch tree");
            }

            // Filter for code files only
            const codeFiles = tree.filter((f) =>
                /\.(ts|tsx|js|jsx|py|java|go|rs|cpp|c|cs|rb|php|json|md)$/.test(f.path || "")
            );

            console.log(`[Job ${analysisId}] Found ${codeFiles.length} files. Analyzing...`);

            // Limit files
            const batch = codeFiles.slice(0, 30);
            let totalIssues = 0;

            // Collect files for vector embedding
            const filesToEmbed: { path: string, content: string }[] = [];

            const CONCURRENCY_LIMIT = 3;
            const chunks = [];
            for (let i = 0; i < batch.length; i += CONCURRENCY_LIMIT) {
                chunks.push(batch.slice(i, i + CONCURRENCY_LIMIT));
            }

            for (const chunk of chunks) {
                await Promise.all(chunk.map(async (file) => {
                    if (!file.path) return;
                    console.log(`[Job ${analysisId}] Analyzing ${file.path}...`);

                    try {
                        const content = await github.getFileContent(
                            project.owner,
                            project.repo,
                            file.path
                        );

                        if (!content || content.length > 30000) {
                            console.log(`Skipping ${file.path} (too large or empty)`);
                            return;
                        }

                        // Add to embedding list
                        filesToEmbed.push({ path: file.path, content });

                        let issues: any[] = [];

                        if (file.path.endsWith("package.json")) {
                            // issues = this.dependencyAnalysis.analyzePackageJson(content);
                        } else {
                            // 1. Static AST Scan (High Precision)
                            // const staticIssues = this.astAnalysis.analyzeContent(file.path!, content);

                            // 2. AI Scan (Deep Context)
                            const aiIssues = await this.retryWithBackoff(() =>
                                this.analyzeCode(projectId, file.path!, content)
                            );
                            issues = [...aiIssues];
                        }

                        // Save issues
                        for (const issue of issues) {
                            // Sanitize Issue Data (Prevent Prisma Crash)
                            const safeSeverity = ["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(issue.severity)
                                ? issue.severity
                                : "LOW";

                            const safeCategory = [
                                "SECURITY", "PERFORMANCE", "ARCHITECTURE", "MAINTAINABILITY",
                                "BEST_PRACTICE", "DEPENDENCY", "TESTING"
                            ].includes(issue.category)
                                ? issue.category
                                : "BEST_PRACTICE"; // Default fallback

                            const safeLineNumber = typeof issue.lineNumber === 'number' ? issue.lineNumber : 0;
                            const safeMessage = issue.message || "Issue identified";

                            totalIssues++;
                            try {
                                const issueRecord = await db.issue.create({
                                    data: {
                                        analysisId: analysisId,
                                        filePath: file.path!,
                                        severity: safeSeverity,
                                        category: safeCategory,
                                        lineNumber: safeLineNumber,
                                        message: safeMessage,
                                        code: issue.code || "",
                                    },
                                });

                                if (issue.suggestion) {
                                    await db.suggestion.create({
                                        data: {
                                            issueId: issueRecord.id,
                                            diff: issue.suggestion.diff || "",
                                            explanation: issue.suggestion.explanation || "No explanation provided",
                                        },
                                    });
                                }
                            } catch (insertError) {
                                console.error(`Failed to insert issue for ${file.path}:`, insertError);
                                // Continue to next issue instead of crashing job
                            }
                        }
                    } catch (err) {
                        console.error(`Failed to analyze ${file.path}:`, err);
                    }
                }));
            }

            // 5. Generate Embeddings (Background)
            try {
                console.log(`[Job ${analysisId}] Generating embeddings for ${filesToEmbed.length} files...`);
                await this.vectorStore.addDocuments(projectId, filesToEmbed);
                console.log(`[Job ${analysisId}] Embeddings generated.`);
            } catch (error) {
                console.error("Embedding generation failed:", error);
                // Don't fail the whole analysis just for this
            }

            // 6. Complete
            await db.analysis.update({
                where: { id: analysisId },
                data: { status: "COMPLETED", score: Math.max(0, 100 - (totalIssues * 2)) },
            });
            console.log(`[Job ${analysisId}] Completed successfully.`);

        } catch (e) {
            console.error(`[Job ${analysisId}] Failed:`, e);
            await db.analysis.update({
                where: { id: analysisId },
                data: { status: "FAILED" },
            });
        }
    }

    /**
     * Helper: Exponential Backoff for AI calls
     */
    async retryWithBackoff<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
        try {
            return await fn();
        } catch (error) {
            if (retries === 0) throw error;
            console.warn(`Retrying operation... (${retries} attempts left)`);
            await new Promise(res => setTimeout(res, delay));
            return this.retryWithBackoff(fn, retries - 1, delay * 2);
        }
    }

    /**
     * Calls LLM to analyze a single file
     */
    async analyzeCode(projectId: string, filePath: string, content: string) {
        try {
            // 1. Check Cache
            const hash = createHash("sha256").update(content).digest("hex");
            const cached = await db.fileCache.findUnique({
                where: {
                    projectId_filePath_hash: { projectId, filePath, hash }
                }
            });

            if (cached) {
                console.log(`Cache Hit for ${filePath}`);
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

            Be strict. If you see O(n^2), flag it. If you see code without types, flag it.
            
            IMPORTANT: Return the result ONLY as a raw JSON object matching this structure:
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

            let rawText = "";
            const isProduction = process.env.NODE_ENV === "production";
            const useManualOllama = !isProduction && process.env.AI_PROVIDER === "ollama";

            if (useManualOllama) {
                const { generateOllamaResponse } = await import("./ai-provider");
                rawText = await generateOllamaResponse(systemPrompt, userPrompt);
            } else {
                const { text } = await generateText({
                    model: getModel(),
                    system: systemPrompt,
                    prompt: userPrompt,
                });
                rawText = text;
            }

            const cleanText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

            try {
                const parsed = JSON.parse(cleanText);
                const issues = parsed.issues || [];

                // 2. Save to Cache (Upsert to prevent race conditions)
                await db.fileCache.upsert({
                    where: {
                        projectId_filePath_hash: { projectId, filePath, hash }
                    },
                    update: {}, // Already exists, do nothing
                    create: {
                        projectId,
                        filePath,
                        hash,
                        issues: JSON.stringify(issues)
                    }
                }).catch((e: any) => console.warn("Cache write skipped:", e.message));

                return issues;
            } catch (e) {
                console.error("Failed to parse AI JSON:", cleanText);
                return [];
            }
        } catch (error) {
            console.error("AI Generation failed:", error);
            throw error;
        }
    }
}
