import { ChatInterface } from "./chat-interface";
import { ReactNode } from "react";

export default async function ProjectLayout({
    children,
    params,
}: {
    children: ReactNode;
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    return (
        <>
            {children}
            <ChatInterface projectId={id} />
        </>
    );
}
