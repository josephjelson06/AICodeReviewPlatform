# Deployment Guide

## 1. Prerequisites
*   **GitHub Repository**: Ensure your code is pushed to GitHub.
*   **Vercel Account**: Or any production hosting provider (Netlify, AWS, etc.). Vercel is recommended for Next.js.
*   **Inngest Account**: Sign up at [inngest.com](https://inngest.com) (Free Tier is sufficient).
*   **Supabase Project**: You already have this setup.

---

## 2. Environment Variables (Production)

When deploying to Vercel/Netlify, add these Environment Variables in the project settings.

**DO NOT** copy `INNGEST_BASE_URL` or `NEXTAUTH_URL` from your local `.env`.

| Variable | Value Description |
| :--- | :--- |
| `DATABASE_URL` | Your Supabase Transaction Pooler URL (ending in `?pgbouncer=true`). **Crucial**: Ensure "Transaction Mode" (Port 6543) is used. |
| `AUTH_SECRET` | Run `npx auth secret` locally to generate a new secure string for production. |
| `GITHUB_ID` | From your GitHub OAuth App (ensure Homepage URL is your production domain). |
| `GITHUB_SECRET` | From your GitHub OAuth App. |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Your Gemini API Key. |
| `UPSTASH_REDIS_REST_URL` | Your Upstash Redis URL. |
| `UPSTASH_REDIS_REST_TOKEN` | Your Upstash Redis Token. |
| `INNGEST_EVENT_KEY` | **NEW**: Get this from your Inngest Cloud Dashboard -> "Keys". |
| `INNGEST_SIGNING_KEY` | **NEW**: Get this from Inngest Dashboard -> "Signing Key" (Used to verify events). |

### ⚠️ Important Notes:
1.  **Remove `INNGEST_BASE_URL`**: Do NOT set this in production. It is only for local development.
2.  **Remove `NEXTAUTH_URL`**: Vercel automatically sets this. If using other hosts, set it to your `https://your-domain.com`.

---

## 3. Inngest Cloud Setup
Since we can't use the local dev server in production, we must connect to Inngest Cloud.

1.  **Login to Inngest**: Go to [app.inngest.com](https://app.inngest.com).
2.  **Create an App**: Name it `ai-code-reviewer`.
3.  **Connect Vercel**: If deploying on Vercel, use the Inngest Integration to automatically set env vars.
4.  **Sync**: Once deployed, the Inngest Cloud dashboard will automatically detect your functions (`analysis.start`, etc.) via the `/api/inngest` webhook.

---

## 4. Build Status
✅ **Your project builds successfully.**
We ran `npm run build` locally and verified that all Type errors and Module errors are resolved. You are safe to deploy.
