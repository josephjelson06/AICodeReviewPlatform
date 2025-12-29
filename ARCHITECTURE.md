# System Architecture

## 1. Technology Stack

### Backend & Cloud Infrastructure (Modernized V2)
| Component | Technology | Optimization Role |
| :--- | :--- | :--- |
| **Background Jobs** | **Inngest** | Handles long-running AI code analysis asynchronously, preventing server timeouts and ensuring reliability (retries, logging). |
| **Rate Limiting** | **Upstash Redis** | Protects API routes (specifically analysis endpoints) from abuse and ensuring fair usage limits. |
| **AI Models** | **Google Gemini** | **Gemini 1.5 Flash / Pro** (via Google AI SDK) used for code analysis and embeddings. Replaced OpenAI for improved cost-efficiency (Free Tier). |
| **Database** | **Prisma ORM** | Type-safe database interactions. |
| **DB Provider** | **Supabase (PostgreSQL)** | Cloud-hosted PostgreSQL database. |
| **Connection Pooling** | **PgBouncer** | Manages database connections via Transaction Mode (Port 6543) to prevent connection limit exhaustion in serverless environments. |
| **Vector Search** | **pgvector** | PostgreSQL extension for storing and searching code embeddings. |

### Core Application Stack
*   **Framework**: Next.js 15 (App Router)
*   **Language**: TypeScript
*   **Authentication**: NextAuth.js v5 (GitHub OAuth)
*   **API Client**: Octokit (GitHub Data Fetching)
*   **Validation**: Zod (Schema Validation)
*   **Styling**: Tailwind CSS
*   **Client State**: TanStack Query (React Query)
*   **UI Components**: Radix UI + Lucide React
*   **Visualization**: React Flow (Architecture Diagrams)

---

## 2. Background Processing Evolution

### Phase 1: The "Fire and Forget" Pattern (Legacy)
*   **Mechanism**: The API would trigger an async function (`analysisService.processAnalysis`) and immediately return `200 OK` to the client without waiting for completion.
*   **Critical Flaws**:
    1.  **Serverless Freezing**: On Vercel, once the response is sent, the runtime freezes effectively "pausing" or killing any background CPU tasks.
    2.  **Memory Leaks**: Concurrent analyses would consume server RAM unchecked, leading to crashes.
    3.  **No Reliability**: If the server restarted or the AI API timed out, the job was lost forever. No retries.
    4.  **Race Conditions**: Manual function calls conflicted with subsequent attempts to modernize, causing database locking issues.

### Phase 2: Event-Driven Architecture (Current)
*   **Mechanism**: The API now pushes an event `analysis.start` to **Inngest**.
*   **Workflow**:
    1.  User clicks "Analyze".
    2.  API creates a `PENDING` database record.
    3.  API sends event to Inngest.
    4.  Inngest acknowledges receipt.
    5.  Inngest spins up a background worker (serverless function) to execute the job.
*   **Benefits**:
    *   **Guaranteed Execution**: Inngest automatically retries failed steps (e.g., AI API timeout).
    *   **Flow Control**: Concurrency is managed preventing database overload.
    *   **Serverless Compatible**: Functions can run for minutes (unlike standard API routes).
    *   **Observability**: Full logs and history of every job step.

---

## 3. Scoring System Logic

The Analysis Scoring engine is weighted based on issue severity to provide a fair assessment of code quality.

**Formula**:
```typescript
Total Deduction = (CRITICAL * 10) + (HIGH * 5) + (MEDIUM * 2) + (LOW * 1)
Final Score     = Math.max(0, 100 - Total Deduction)
```

*   **Range**: 0 - 100 (Cannot go negative)
*   **Baseline**: All projects start at 100.
*   **Persistence**: Scores are recalculated and saved to the database only upon completing a fresh analysis.

---

## 4. Environment Configuration
*   **Database**: Requires `?pgbouncer=true` in `DATABASE_URL` for Transaction Mode compatibility.
*   **Inngest (Local)**: Requires `INNGEST_BASE_URL="http://127.0.0.1:8288"` to bypass SSL verification issues with local/corporate networks.
*   **Inngest (Production)**: Automatically connects to Inngest Cloud via standard HTTPS.
