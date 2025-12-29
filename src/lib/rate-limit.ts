import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create a new ratelimiter, that allows 10 requests per 10 seconds
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || "http://localhost:8079", // Default for dev/dummy
    token: process.env.UPSTASH_REDIS_REST_TOKEN || "example_token",
});

export const ratelimit = new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(5, "60 s"), // 5 analysis requests per minute per user
    analytics: true,
    prefix: "@upstash/ratelimit",
});
