"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const Vortex = React.memo(
  ({
    children,
    className,
    containerClassName,
    backgroundColor = "white",
  }: {
    children?: React.ReactNode;
    className?: string;
    containerClassName?: string;
    backgroundColor?: string;
  }) => {
    return (
      <div
        className={cn(
          "relative w-full h-full overflow-hidden bg-black flex items-center justify-center",
          containerClassName,
        )}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 400 400"
          className="absolute inset-0 w-full h-full"
        >
          <defs>
            <linearGradient id="vortex" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(59, 130, 246, 0.8)" />
              <stop offset="50%" stopColor="rgba(168, 85, 247, 0.8)" />
              <stop offset="100%" stopColor="rgba(236, 72, 153, 0.8)" />
            </linearGradient>
          </defs>
          <motion.circle
            cx="200"
            cy="200"
            r="150"
            fill="none"
            stroke="url(#vortex)"
            strokeWidth="2"
            initial={{ opacity: 0.3 }}
            animate={{ opacity: [0.3, 0.6, 0.3], rotate: [0, 360] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.circle
            cx="200"
            cy="200"
            r="100"
            fill="none"
            stroke="url(#vortex)"
            strokeWidth="2"
            initial={{ opacity: 0.2 }}
            animate={{ opacity: [0.2, 0.5, 0.2], rotate: [360, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
          />
        </svg>

        <div
          className={cn(
            "relative z-10 w-full h-full flex items-center justify-center",
            className,
          )}
        >
          {children}
        </div>
      </div>
    );
  },
);

Vortex.displayName = "Vortex";
