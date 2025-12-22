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
    compatibility: "compatible",
    name: "ollama",
});

export function getModel() {
    const provider = process.env.AI_PROVIDER || "openai";

    switch (provider) {
        case "ollama":
            // Use the 'ollama' instance configured above
            return ollama(process.env.OLLAMA_MODEL || "llama3.1");
        case "groq":
            return groq("llama-3.3-70b-versatile");
        case "openai":
        default:
            return openai("gpt-4o");
    }
}

// Manual Ollama fetcher to bypass SDK validation issues
export async function generateOllamaResponse(system: string, prompt: string) {
    const baseUrl = (process.env.OLLAMA_BASE_URL || "http://localhost:11434").replace("/v1", ""); // Strip /v1 if present for standard API

    try {
        const response = await fetch(`${baseUrl}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: process.env.OLLAMA_MODEL || "llama3.1",
                system: system,
                prompt: prompt,
                stream: false,
                format: "json"
            })
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
