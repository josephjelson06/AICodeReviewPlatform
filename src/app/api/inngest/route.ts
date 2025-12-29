import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { analyzeRepository } from "@/inngest/functions";

// Create an API that serves zero-serverless functions
export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
        analyzeRepository
    ],
});
