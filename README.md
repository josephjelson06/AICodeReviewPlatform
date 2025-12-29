# 🤖 AI Code Review Platform

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-4.0-cyan)

**AICodeReview Platform** is an elite, open-source tool that acts as your personal Senior Software Engineer. It recursively scans your repositories, analyzes code for security, performance, and architecture issues using state-of-the-art LLMs (OpenAI, Groq, or Ollama), and provides instant, actionable refactoring suggestions.

![Dashboard Preview](./public/dashboard-preview.png)
*(Note: Add a screenshot here)*

## ✨ Features

- **🚀 Deep Scanning Engine**: Recursively fetches and analyzes entire file trees.
- **🛡️ Bank-Grade Security**: Detects injection attacks, exposed secrets, and unsafe patterns.
- **⚡ Performance Profiler**: Identifies N+1 queries, memory leaks, and expensive loops.
- **🧠 Local & Cloud AI**: Support for **OpenAI (GPT-4)**, **Groq (Llama 3)**, and **Ollama (Local Models)**.
- **🎨 Glassmorphism UI**: A stunning, deep-space themed interface built with Framer Motion.
- **💾 Caching & Optimization**: Smart hashing prevents re-analyzing unchanged files to save costs.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL (or Supabase/Neon)
- GitHub Account (for OAuth)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/josephjelson06/AICodeReviewPlatform.git
    cd AICodeReviewPlatform
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory:
    ```env
    DATABASE_URL="postgresql://..."
    AUTH_SECRET="your_generated_secret" # run `npx auth secret`
    GITHUB_ID="your_github_client_id"
    GITHUB_SECRET="your_github_client_secret"
    OPENAI_API_KEY="sk-..."    # Optional if using Groq/Ollama
    GROQ_API_KEY="gsk-..."     # Optional
    AI_PROVIDER="openai"       # Options: "openai", "groq", "ollama"
    ```

4.  **Initialize Database**
    ```bash
    npx prisma db push
    ```

5.  **Run Development Server**
    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) to see the app.

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + Framer Motion
- **Database**: PostgreSQL (via Prisma ORM)
- **Auth**: NextAuth.js (v5)
- **AI**: Vercel AI SDK

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to submit pull requests, report issues, and request features.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
