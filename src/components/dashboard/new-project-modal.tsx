"use client"
import { useState, useEffect } from "react"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export function NewProjectModal() {
    const [open, setOpen] = useState(false)
    const [url, setUrl] = useState("")
    const [mounted, setMounted] = useState(false)
    const router = useRouter()

    useEffect(() => {
        setMounted(true)
    }, [])

    const mutation = useMutation({
        mutationFn: async (url: string) => {
            const res = await fetch("/api/projects", {
                method: "POST",
                body: JSON.stringify({ url }),
            })
            if (!res.ok) throw new Error("Failed to create project")
            return res.json()
        },
        onSuccess: (data) => {
            setOpen(false)
            setUrl("")
            router.refresh()
            router.push(`/projects/${data.id}`)
        },
        onError: (error) => {
            console.error(error);
            alert("Failed to connect repository. Make sure the URL is correct and you have access.");
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(url);
    }

    if (!mounted) {
        return (
            <Button variant="default">
                <Plus className="mr-2 h-4 w-4" /> Add Repository
            </Button>
        )
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Repository
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Add Repository</DialogTitle>
                        <DialogDescription>
                            Enter the URL of the GitHub repository you want to analyze.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Input
                                id="url"
                                placeholder="https://github.com/owner/repo"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? "Connecting..." : "Connect Repository"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
