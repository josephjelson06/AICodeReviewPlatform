"use client"
import { useState } from "react"
import { ChevronDown, ChevronUp, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// Simple Badge component since I didn't create it globally yet
function BadgeUI({ variant, className, children }: { variant: string, className?: string, children: React.ReactNode }) {
    const colors = {
        CRITICAL: "bg-red-100 text-red-800 border-red-200",
        HIGH: "bg-orange-100 text-orange-800 border-orange-200",
        MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-200",
        LOW: "bg-blue-100 text-blue-800 border-blue-200",
        SECURITY: "bg-purple-100 text-purple-800",
        PERFORMANCE: "bg-amber-100 text-amber-800",
        ARCHITECTURE: "bg-indigo-100 text-indigo-800",
    }
    // @ts-expect-error simple mock
    const color = colors[variant] || "bg-gray-100 text-gray-800"
    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${color} ${className}`}>
            {children}
        </span>
    )
}

export function IssueCard({ issue }: { issue: any }) {
    const [expanded, setExpanded] = useState(false)

    return (
        <div className="border rounded-lg bg-card overflow-hidden transition-all duration-200 hover:shadow-md">
            <div
                className="p-4 flex items-start gap-4 cursor-pointer"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="mt-1">
                    <BadgeUI variant={issue.severity}>{issue.severity}</BadgeUI>
                </div>
                <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-base">{issue.message}</h3>
                        <BadgeUI variant={issue.category} className="ml-2 bg-transparent border">{issue.category}</BadgeUI>
                    </div>
                    <p className="text-sm text-muted-foreground font-mono">
                        {issue.filePath}:{issue.lineNumber}
                    </p>
                </div>
                <Button variant="ghost" size="sm" className="ml-auto">
                    {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
            </div>

            {expanded && (
                <div className="border-t bg-muted/30 p-4 space-y-4 animate-in slide-in-from-top-2">
                    {issue.code && (
                        <div>
                            <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Problematic Code</h4>
                            <pre className="p-3 rounded-md bg-muted text-sm font-mono overflow-x-auto border">
                                <code>{issue.code}</code>
                            </pre>
                        </div>
                    )}

                    {issue.suggestion && (
                        <div>
                            <h4 className="text-sm font-semibold mb-2 text-green-600">Suggested Fix</h4>
                            <p className="text-sm mb-3 text-muted-foreground border-l-2 border-green-500 pl-3 italic">
                                {issue.suggestion.explanation}
                            </p>
                            <pre className="p-3 rounded-md bg-black text-green-400 text-sm font-mono overflow-x-auto border block">
                                <code>{issue.suggestion.diff}</code>
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
