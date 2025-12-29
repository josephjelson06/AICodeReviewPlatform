import { db } from "@/lib/db";
import { getEmbeddingModel } from "./ai-provider";
import { embed, embedMany } from "ai";

export class VectorStore {
    /**
     * Splits text into chunks and stores embeddings
     */
    async addDocuments(projectId: string, files: { path: string; content: string }[]) {
        const chunks: { projectId: string; fileName: string; content: string; embedding: number[] }[] = [];

        for (const file of files) {
            // Simple chunking by lines for code (approx 100 lines or 1000 chars)
            // Better: use a recursive character text splitter
            const fileChunks = this.chunkText(file.content, 1000); // ~1000 chars per chunk

            // Generate embeddings in batch
            const { embeddings } = await embedMany({
                model: getEmbeddingModel(),
                values: fileChunks,
            });

            fileChunks.forEach((chunk, i) => {
                chunks.push({
                    projectId,
                    fileName: file.path,
                    content: chunk,
                    embedding: embeddings[i],
                });
            });
        }

        // Save to DB using raw query because Prisma doesn't support vector insert fully typed yet
        // ACTUALLY: We can use Prisma.sql for the vector column
        for (const chunk of chunks) {
            // Format vector as string for PostgreSQL: "[0.1, 0.2, ...]"
            const vectorString = `[${chunk.embedding.join(",")}]`;

            await db.$executeRaw`
                INSERT INTO "Embedding" ("id", "projectId", "fileName", "content", "embedding", "createdAt")
                VALUES (gen_random_uuid(), ${chunk.projectId}, ${chunk.fileName}, ${chunk.content}, ${vectorString}::vector, NOW())
            `;
        }
    }

    /**
     * Search for similar code chunks
     */
    async findSimilar(projectId: string, query: string, limit = 5) {
        // 1. Embed the query
        const { embedding } = await embed({
            model: getEmbeddingModel(),
            value: query,
        });

        // 2. Perform similarity search (Cosine Distance <=> operator)
        const vectorString = `[${embedding.join(",")}]`;

        const results = await db.$queryRaw`
            SELECT "fileName", "content", "embedding" <=> ${vectorString}::vector as "_distance"
            FROM "Embedding"
            WHERE "projectId" = ${projectId}
            ORDER BY "_distance" ASC
            LIMIT ${limit}
        `;

        return results as { fileName: string; content: string; _distance: number }[];
    }

    private chunkText(text: string, chunkSize: number): string[] {
        const chunks = [];
        let index = 0;
        while (index < text.length) {
            chunks.push(text.slice(index, index + chunkSize));
            index += chunkSize;
        }
        return chunks;
    }
}
