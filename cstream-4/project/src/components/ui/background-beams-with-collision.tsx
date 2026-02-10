"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const BackgroundBeamsWithCollision = React.memo(
  ({ children, className }: { children?: React.ReactNode; className?: string }) => {
    return (
      <div className={cn("relative w-full h-full overflow-hidden", className)}>
        <svg
          width="100%"
          height="100%"
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 400 400"
        >
          <defs>
            <linearGradient id="beam1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(168, 85, 247, 0)" />
              <stop offset="50%" stopColor="rgba(168, 85, 247, 0.8)" />
              <stop offset="100%" stopColor="rgba(236, 72, 153, 0)" />
            </linearGradient>
          </defs>

          <motion.line
            x1="0"
            y1="0"
            x2="400"
            y2="400"
            stroke="url(#beam1)"
            strokeWidth="2"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.8, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <motion.line
            x1="400"
            y1="0"
            x2="0"
            y2="400"
            stroke="url(#beam1)"
            strokeWidth="2"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ duration: 3, repeat: Infinity, delay: 1 }}
          />
        </svg>

        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10" />

        <div className="relative z-10 w-full h-full flex items-center justify-center">
          {children}
        </div>
      </div>
    );
  },
);

BackgroundBeamsWithCollision.displayName = "BackgroundBeamsWithCollision";
