"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface MotionWrapperProps {
    children: ReactNode;
    className?: string;
    delay?: number;
}

export function FadeIn({ children, className, delay = 0 }: MotionWrapperProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, delay: delay, ease: "easeOut" }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export function SlideIn({ children, className, delay = 0 }: MotionWrapperProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: delay, ease: "easeOut" }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export function ScaleIn({ children, className, delay = 0 }: MotionWrapperProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: delay, ease: "easeOut" }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
