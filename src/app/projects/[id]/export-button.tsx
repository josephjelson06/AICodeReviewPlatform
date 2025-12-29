"use client";

import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";

export function ExportButton() {
    return (
        <Button
            variant="outline"
            className="gap-2 border-white/10 hover:bg-white/5"
            onClick={() => window.print()}
        >
            <Download className="w-4 h-4" />
            Export Report
        </Button>
    );
}
