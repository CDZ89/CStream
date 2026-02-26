"use client";
import React from "react";
import { SparklesCore } from "@/components/ui/sparkles";
import { motion } from "framer-motion";

export default function SparklesDemo() {
  return (
    <div className="relative w-full h-screen bg-black flex flex-col items-center justify-center overflow-hidden rounded-2xl">
      {/* Animated background gradients */}
      <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-[2px] w-3/4 blur-sm" />
      <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-px w-3/4" />
      <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-[5px] w-1/4 blur-sm" />
      <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-px w-1/4" />

      {/* Sparkles core component */}
      <div className="absolute inset-0 w-full h-full">
        <SparklesCore
          background="transparent"
          minSize={0.4}
          maxSize={1}
          particleDensity={1200}
          className="w-full h-full"
          particleColor="#FFFFFF"
          responsiveDensity
        />
      </div>

      {/* Title with animation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative z-20 text-center"
      >
        <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-9xl font-bold text-white relative z-20 text-center">
          Sparkles
        </h1>
        <p className="text-sm sm:text-base md:text-lg mt-4 text-gray-300">
          Beautiful particle effects for your content
        </p>
      </motion.div>

      {/* Radial gradient mask to prevent sharp edges */}
      <div className="absolute inset-0 w-full h-full bg-black [mask-image:radial-gradient(350px_200px_at_top,transparent_20%,white)]"></div>
    </div>
  );
}
