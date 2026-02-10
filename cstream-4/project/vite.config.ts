import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 5000,
    strictPort: true,
    allowedHosts: true,
    cors: true,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  },
  plugins: [react()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@assets": path.resolve(__dirname, "./attached_assets"),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'use-sync-external-store', 'zustand', 'framer-motion', 'lucide-react'],
    exclude: ['zustand/middleware', '@tanstack/react-query'],
    esbuildOptions: {
      target: 'esnext',
      supported: { bigint: true },
    }
  },
  build: {
    outDir: "dist",
    sourcemap: mode === "development",
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    cssCodeSplit: true,
    reportCompressedSize: false,
    modulePreload: {
      polyfill: false,
    },
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // React core - explicit paths to avoid catching @emotion/react etc.
            if (id.includes('/node_modules/react/') || 
                id.includes('/node_modules/react-dom/') || 
                id.includes('/node_modules/react-router') ||
                id.includes('/node_modules/scheduler/')) {
              return 'vendor-react';
            }
            // UI component libraries
            if (id.includes('/node_modules/@radix-ui/') || 
                id.includes('/node_modules/lucide-react/')) {
              return 'vendor-ui';
            }
            // Framer motion is often large
            if (id.includes('/node_modules/framer-motion/')) {
              return 'vendor-framer';
            }
            // Query & state management
            if (id.includes('/node_modules/@tanstack/') || 
                id.includes('/node_modules/zustand/')) {
              return 'vendor-state';
            }
            // Charts - often large, cache separately
            if (id.includes('/node_modules/recharts/') || 
                id.includes('/node_modules/d3')) {
              return 'vendor-charts';
            }
          }
          // Don't group all remaining node_modules - let Vite split naturally
        },
      },
    },
    chunkSizeWarningLimit: 2000,
  },
  esbuild: {
    legalComments: 'none',
    treeShaking: true,
  },
  preview: {
    port: 5000,
    host: '0.0.0.0',
  },
}));
