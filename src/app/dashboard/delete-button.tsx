"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function DeleteProjectButton({ projectId }: { projectId: string }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigating to project page
        e.stopPropagation();

        if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
            return;
        }

        setIsDeleting(true);

        try {
            const res = await fetch(`/api/projects/${projectId}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                throw new Error("Failed to delete project");
            }

            router.refresh();
        } catch (error) {
            console.error("Delete failed:", error);
            alert("Failed to delete project");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 mr-2 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded-full transition-colors z-20 relative group"
            title="Delete Project"
        >
            {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <Trash2 className="w-4 h-4" />
            )}
        </button>
    );
}
