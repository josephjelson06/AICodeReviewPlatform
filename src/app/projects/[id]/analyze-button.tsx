"use client"
import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { Play, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AnalyzeButton({ projectId }: { projectId: string }) {
    const router = useRouter()

    // I need to wait for analysis to complete? 
    // Usually triggering it is enough, but to show progress we might want to poll.
    // For now, I'll just trigger and refresh.

    const mutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/projects/${projectId}/analyze`, { method: "POST" })
            if (!res.ok) throw new Error("Analysis failed")
            return res.json()
        },
        onSuccess: (data) => {
            router.refresh()
            // Redirect to the project root (dashboard style)
            router.push(`/projects/${projectId}`)
        },
        onError: (err) => {
            alert("Failed to start analysis");
            console.error(err);
        }
    })

    return (
        <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="gap-2"
        >
            {mutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Play className="h-4 w-4" />
            )}
            {mutation.isPending ? "Analyzing Project..." : "Run Analysis"}
        </Button>
    )
}
