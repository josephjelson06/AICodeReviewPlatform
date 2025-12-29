"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center bg-background border rounded-lg shadow-sm">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
                        <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
                    <p className="text-muted-foreground max-w-md mb-8">
                        We encountered an unexpected error. Our team has been notified.
                        {this.state.error?.message && (
                            <span className="block mt-2 font-mono text-xs bg-muted p-2 rounded">
                                {this.state.error.message}
                            </span>
                        )}
                    </p>
                    <div className="flex gap-4">
                        <Button onClick={() => window.location.reload()} variant="outline">
                            Reload Page
                        </Button>
                        <Button onClick={() => window.location.href = "/"}>
                            Return Home
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
