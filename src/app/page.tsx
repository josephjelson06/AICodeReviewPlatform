import Link from "next/link";
import { ArrowRight, Bot, Shield, Zap } from "lucide-react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] text-center px-4">
      <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight lg:text-7xl mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
        AI-Powered Code Review
      </h1>
      <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
        Automate your code analysis. Detect bugs, security vulnerabilities, and logic flaws instantly with our advanced AI engine.
      </p>

      <div className="flex gap-4">
        <Link
          href="/api/auth/signin"
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 rounded-md inline-flex items-center justify-center text-sm font-medium transition-colors"
        >
          Get Started <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
        <Link
          href="https://github.com"
          className="border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-8 rounded-md inline-flex items-center justify-center text-sm font-medium transition-colors"
        >
          View on GitHub
        </Link>
      </div>

      <div className="mt-24 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl">
        <div className="flex flex-col items-center p-6 bg-card rounded-lg border shadow-sm">
          <Shield className="h-12 w-12 text-blue-500 mb-4" />
          <h3 className="text-xl font-bold mb-2">Security Scanning</h3>
          <p className="text-muted-foreground">Find vulnerabilities before they reach production. Check for exposed secrets, injection risks, and more.</p>
        </div>
        <div className="flex flex-col items-center p-6 bg-card rounded-lg border shadow-sm">
          <Zap className="h-12 w-12 text-amber-500 mb-4" />
          <h3 className="text-xl font-bold mb-2">Performance Optimization</h3>
          <p className="text-muted-foreground">Identify slow queries, memory leaks, and unoptimized algorithms automatically.</p>
        </div>
        <div className="flex flex-col items-center p-6 bg-card rounded-lg border shadow-sm">
          <Bot className="h-12 w-12 text-purple-500 mb-4" />
          <h3 className="text-xl font-bold mb-2">Smart Refactoring</h3>
          <p className="text-muted-foreground">Get AI-generated code suggestions and refactorings with one-click explanations.</p>
        </div>
      </div>
    </div>
  );
}
