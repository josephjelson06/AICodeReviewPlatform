import { db } from "@/lib/db";
import { GitHubService } from "./github";
import { generateText } from "ai";
import { createHash } from "crypto";
import { z } from "zod";
import { getModel } from "./ai-provider";

const IssueSchema = z.object({
    issues: z.array(
        z.object({
            severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
            category: z.enum([
                "SECURITY",
                "PERFORMANCE",
                "ARCHITECTURE",
                "MAINTAINABILITY",
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
    /**
     * Orchestrates the analysis of a repository
     */
    async analyzeRepository(
        userId: string,
        projectId: string,
        accessToken: string
    ) {
        // 1. Get Project
        const project = await db.project.findUnique({ where: { id: projectId } });
        if (!project) throw new Error("Project not found");

        // 2. Init GitHub
        const github = new GitHubService(accessToken);

        // 3. Create Analysis Record
        const analysis = await db.analysis.create({
            data: { projectId, status: "PENDING" },
        });

        try {
            // 4. Get Files
            console.log(`Fetching file tree for ${project.owner}/${project.repo}...`);
            const tree = await github.getFileTree(project.owner, project.repo);

            if (!tree || tree.length === 0) {
                throw new Error("No files found or failed to fetch tree");
            }

            // Filter for code files only (common extensions)
            const codeFiles = tree.filter((f) =>
                /\.(ts|tsx|js|jsx|py|java|go|rs|cpp|c|cs|rb|php)$/.test(f.path || "")
            );

            console.log(`Found ${codeFiles.length} code files. Analyzing sample...`);

            // Limit to 5 files for prototype/demo to save tokens and time
            const batch = codeFiles.slice(0, 5);
            let totalIssues = 0;

            for (const file of batch) {
                if (!file.path) continue;
                console.log(`Analyzing ${file.path}...`);

                try {
                    const content = await github.getFileContent(
                        project.owner,
                        project.repo,
                        file.path
                    );

                    if (!content || content.length > 20000) {
                        console.log(`Skipping ${file.path} (too large or empty)`);
                        continue;
                    }

                    const issues = await this.analyzeCode(projectId, file.path, content);

                    // Save issues
                    for (const issue of issues) {
                        totalIssues++;
                        const issueRecord = await db.issue.create({
                            data: {
                                analysisId: analysis.id,
                                filePath: file.path,
                                severity: issue.severity,
                                category: issue.category,
                                lineNumber: issue.lineNumber || 0,
                                message: issue.message,
                                code: issue.code || "",
                            },
                        });

                        if (issue.suggestion) {
                            await db.suggestion.create({
                                data: {
                                    issueId: issueRecord.id,
                                    diff: issue.suggestion.diff,
                                    explanation: issue.suggestion.explanation || "No explanation provided",
                                },
                            });
                        }
                    }
                } catch (err) {
                    console.error(`Failed to analyze ${file.path}:`, err);
                }
            }

            // 6. Complete
            await db.analysis.update({
                where: { id: analysis.id },
                data: { status: "COMPLETED", score: Math.max(0, 100 - (totalIssues * 5)) }, // Naive scoring logic
            });

            return analysis;

        } catch (e) {
            console.error("Analysis failed:", e);
            await db.analysis.update({
                where: { id: analysis.id },
                data: { status: "FAILED" },
            });
            throw e;
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
            Analyze the provided code for critical issues including:
            1. Security Vulnerabilities (Injection, Secrets, etc.)
            2. Performance Bottlenecks (N+1 queries, expensive loops)
            3. Architecture Flaws (bad patterns, spaghetti code)
            4. Maintainability (Cognitive complexity)
            
            Be strict but constructive. 
            
            IMPORTANT: Return the result ONLY as a raw JSON object matching this structure:
            {
              "issues": [
                {
                  "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
                  "category": "SECURITY" | "PERFORMANCE" | "ARCHITECTURE" | "MAINTAINABILITY",
                  "lineNumber": number,
                  "message": "description of issue",
                  "code": "optional code snippet",
                  "suggestion": { "diff": "diff string", "explanation": "string" } (optional)
                }
              ]
            }
            Do not include markdown formatting like \`\`\`json. Just the raw JSON string.`;

            const userPrompt = `File: ${filePath}\n\nCode:\n${content}`;

            let rawText = "";
            const isProduction = process.env.NODE_ENV === "production";
            // Check if we specifically want Ollama manual fetch (Local Env)
            // If in production, even if AI_PROVIDER is "ollama", force Groq SDK (handled in getModel, but we must skip this block)
            const useManualOllama = !isProduction && process.env.AI_PROVIDER === "ollama";

            if (useManualOllama) {
                // Use manual fetcher for Ollama
                const { generateOllamaResponse } = await import("./ai-provider");
                rawText = await generateOllamaResponse(systemPrompt, userPrompt);
            } else {
                // Use SDK for others (Groq/OpenAI) + Production
                const { text } = await generateText({
                    model: getModel(),
                    system: systemPrompt,
                    prompt: userPrompt,
                });
                rawText = text;
            }

            // Clean data (remove markdown code blocks if present)
            const cleanText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

            try {
                const parsed = JSON.parse(cleanText);
                const issues = parsed.issues || [];

                // 2. Save to Cache
                await db.fileCache.create({
                    data: {
                        projectId,
                        filePath,
                        hash,
                        issues: JSON.stringify(issues)
                    }
                }).catch((e: any) => console.error("Failed to save cache:", e));

                return issues;
            } catch (e) {
                console.error("Failed to parse AI JSON:", cleanText);
                return [];
            }
        } catch (error) {
            console.error("AI Generation failed:", error);
            return [];
        }
    }
}
