"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Bot, User } from "lucide-react";

interface Message {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
}

export function ChatInterface({ projectId }: { projectId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Manual State Management
    const [messages, setMessages] = useState<Message[]>([
        { id: "welcome", role: "assistant", content: "Hello! I'm Oracle. Ask me anything about this repository's code quality, security, or architecture." }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input
        };

        // Add user message immediately
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/projects/${projectId}/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messages: [...messages, userMessage],
                    projectId: projectId
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Server responded with ${response.status}`);
            }

            if (!response.body) {
                throw new Error("No response body received");
            }

            // Create placeholder for assistant message
            const assistantMessageId = (Date.now() + 1).toString();
            setMessages(prev => [...prev, {
                id: assistantMessageId,
                role: "assistant",
                content: ""
            }]);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let done = false;

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                const chunkValue = decoder.decode(value, { stream: true });

                setMessages(prev => prev.map(msg =>
                    msg.id === assistantMessageId
                        ? { ...msg, content: msg.content + chunkValue }
                        : msg
                ));
            }

        } catch (err) {
            console.error("Chat Error:", err);
            setError((err as Error).message || "Failed to send message");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    return (
        <div className="fixed bottom-8 right-8 z-50">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="absolute bottom-16 right-0 w-[400px] h-[600px] bg-[#0f111a] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Bot className="w-5 h-5 text-primary" />
                                <span className="font-bold text-white">Project Oracle</span>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans" ref={scrollRef}>
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm mb-4">
                                    <p className="font-bold">Error encountered:</p>
                                    <p>{error}</p>
                                    <p className="text-xs opacity-70 mt-1">Check the server logs or try again.</p>
                                </div>
                            )}
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "assistant" ? "bg-primary/20 text-primary" : "bg-gray-700 text-gray-300"
                                        }`}>
                                        {msg.role === "assistant" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                    </div>
                                    <div className={`rounded-xl p-3 text-sm leading-relaxed max-w-[80%] ${msg.role === "assistant"
                                        ? "bg-white/5 text-gray-200 border border-white/5"
                                        : "bg-primary text-primary-foreground"
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                                        <Bot className="w-4 h-4" />
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75" />
                                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>


                        {/* Input */}
                        <form onSubmit={handleSubmit} className="p-4 border-t border-white/5 bg-white/[0.02]">
                            <div className="relative">
                                <input
                                    value={input}
                                    onChange={handleInputChange}
                                    placeholder="Ask about security, performance..."
                                    className="w-full bg-black/20 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className="absolute right-2 top-2 p-1.5 bg-primary rounded-lg text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="h-14 w-14 rounded-full bg-gradient-to-r from-primary to-purple-600 shadow-lg shadow-primary/20 flex items-center justify-center text-white"
            >
                <MessageSquare className="w-7 h-7" />
            </motion.button>
        </div>
    );
}
