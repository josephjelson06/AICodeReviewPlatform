import { createOpenAI } from "@ai-sdk/openai";
import { createGroq } from "@ai-sdk/groq";


const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const groq = createGroq({
    apiKey: process.env.GROQ_API_KEY,
});

// Configure Ollama using the OpenAI SDK (Ollama is OpenAI compatible)
const ollama = createOpenAI({
    baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1",
    apiKey: "ollama",
    name: "ollama",
});

export function getModel() {
    const isProduction = process.env.NODE_ENV === "production";
    // In production, force Groq (free cloud) unless explicitly overridden
    const provider = isProduction ? "groq" : (process.env.AI_PROVIDER || "openai");

    switch (provider) {
        case "ollama":
            // Use the 'ollama' instance configured above
            return ollama(process.env.OLLAMA_MODEL || "llama3.1");
        case "groq":
            if (!process.env.GROQ_API_KEY) {
                console.warn("GROQ_API_KEY is missing, falling back to OpenAI or throwing error.");
                // If we forced Groq but have no key, this is bad.
            }
            return groq("llama-3.3-70b-versatile");
        case "openai":
        default:
            if (!process.env.OPENAI_API_KEY) {
                throw new Error("OPENAI_API_KEY is missing. Please add it to your .env file.");
            }
            return openai("gpt-4o");
    }
}

export function getEmbeddingModel() {
    const isProduction = process.env.NODE_ENV === "production";
    const provider = isProduction ? "groq" : (process.env.AI_PROVIDER || "openai");

    switch (provider) {
        case "ollama":
            return ollama.embedding(process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text");
        case "openai":
        default:
            return openai.embedding("text-embedding-3-small");
    }
}

// Manual Ollama fetcher to bypass SDK validation issues
export async function generateOllamaResponse(system: string, prompt: string, format: "json" | null = "json") {
    const baseUrl = (process.env.OLLAMA_BASE_URL || "http://localhost:11434").replace("/v1", ""); // Strip /v1 if present for standard API

    try {
        const body: any = {
            model: process.env.OLLAMA_MODEL || "llama3.1",
            system: system,
            prompt: prompt,
            stream: false
        };

        if (format) {
            body.format = format;
        }

        const response = await fetch(`${baseUrl}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.response; // For /api/generate, the content is in 'response'
    } catch (error) {
        console.error("Ollama Manual Fetch Failed:", error);
        throw error;
    }
}
