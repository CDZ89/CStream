"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const BackgroundBeams = React.memo(
  ({ className }: { className?: string }) => {
    const paths = [
      "M-380 -189C-380 -189 -312 216 152 343C616 470 684 875 684 875",
      "M-373 -197C-373 -197 -305 208 159 335C623 462 691 867 691 867",
      "M-366 -205C-366 -205 -298 200 166 327C630 454 698 859 698 859",
      "M-359 -213C-359 -213 -291 192 173 319C637 446 705 851 705 851",
      "M-352 -221C-352 -221 -284 184 180 311C644 438 712 843 712 843",
    ];

    return (
      <div
        className={cn(
          "absolute inset-0 flex h-full w-full items-center justify-center [mask-repeat:no-repeat]",
          className,
        )}
      >
        <svg
          className="pointer-events-none absolute z-0 h-full w-full"
          width="100%"
          height="100%"
          viewBox="0 0 696 316"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {paths.map((path, index) => (
            <motion.path
              key={`path-${index}`}
              d={path}
              stroke={`url(#linearGradient-${index})`}
              strokeOpacity="0.4"
              strokeWidth="0.5"
            />
          ))}
          <defs>
            {paths.map((path, index) => (
              <motion.linearGradient
                id={`linearGradient-${index}`}
                key={`gradient-${index}`}
                initial={{ x1: "0%", x2: "0%", y1: "0%", y2: "0%" }}
                animate={{
                  x1: ["0%", "100%"],
                  x2: ["0%", "95%"],
                  y1: ["0%", "100%"],
                  y2: ["0%", "93%"],
                }}
                transition={{
                  duration: 10,
                  ease: "easeInOut",
                  repeat: Infinity,
                  delay: index * 0.5,
                }}
              >
                <stop stopColor="#18CCFC" stopOpacity="0" />
                <stop stopColor="#18CCFC" />
                <stop offset="32.5%" stopColor="#6344F5" />
                <stop offset="100%" stopColor="#AE48FF" stopOpacity="0" />
              </motion.linearGradient>
            ))}
          </defs>
        </svg>
      </div>
    );
  },
);

BackgroundBeams.displayName = "BackgroundBeams";
