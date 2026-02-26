// vite.config.ts
import { defineConfig } from "file:///home/runner/workspace/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/runner/workspace/project/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
var __vite_injected_original_dirname = "/home/runner/workspace/project";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: false,
    allowedHosts: true,
    cors: true,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "*",
      "Cache-Control": "no-cache, no-store, must-revalidate"
    },
    hmr: {
      protocol: "wss",
      host: process.env.VITE_HMR_HOST || "localhost",
      port: parseInt(process.env.VITE_HMR_PORT || "443", 10)
    },
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false
      }
    },
    warmup: {
      clientFiles: [
        "./src/pages/Home.tsx",
        "./src/pages/Movies.tsx",
        "./src/pages/TV.tsx",
        "./src/components/Navbar.tsx"
      ]
    }
  },
  plugins: [react()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src"),
      "@assets": path.resolve(__vite_injected_original_dirname, "./attached_assets")
    }
  },
  optimizeDeps: {
    include: [
      "zustand",
      "zustand/middleware",
      "react",
      "react-dom",
      "react-router-dom",
      "framer-motion",
      "lucide-react",
      "@tanstack/react-query",
      "react-markdown",
      "remark-gfm",
      "@supabase/supabase-js"
    ]
  },
  build: {
    outDir: "dist",
    sourcemap: mode === "development",
    target: "esnext",
    minify: "esbuild",
    cssMinify: true,
    cssCodeSplit: true,
    modulePreload: {
      polyfill: true
    },
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-ui": ["framer-motion", "lucide-react"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-markdown": ["react-markdown", "remark-gfm"]
        },
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]"
      }
    },
    chunkSizeWarningLimit: 1e3
  },
  esbuild: {
    legalComments: "none",
    treeShaking: true
  },
  preview: {
    port: 5e3,
    host: "0.0.0.0"
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9ydW5uZXIvd29ya3NwYWNlL3Byb2plY3RcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL3J1bm5lci93b3Jrc3BhY2UvcHJvamVjdC92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29ya3NwYWNlL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+ICh7XG4gIHNlcnZlcjoge1xuICAgIGhvc3Q6IFwiMC4wLjAuMFwiLFxuICAgIHBvcnQ6IDUxNzMsXG4gICAgc3RyaWN0UG9ydDogZmFsc2UsXG4gICAgYWxsb3dlZEhvc3RzOiB0cnVlLFxuICAgIGNvcnM6IHRydWUsXG4gICAgaGVhZGVyczoge1xuICAgICAgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsXG4gICAgICBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU1ldGhvZHNcIjogXCJHRVQsIFBPU1QsIFBVVCwgREVMRVRFLCBQQVRDSCwgT1BUSU9OU1wiLFxuICAgICAgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzXCI6IFwiKlwiLFxuICAgICAgXCJDYWNoZS1Db250cm9sXCI6IFwibm8tY2FjaGUsIG5vLXN0b3JlLCBtdXN0LXJldmFsaWRhdGVcIixcbiAgICB9LFxuICAgIGhtcjoge1xuICAgICAgcHJvdG9jb2w6ICd3c3MnLFxuICAgICAgaG9zdDogcHJvY2Vzcy5lbnYuVklURV9ITVJfSE9TVCB8fCAnbG9jYWxob3N0JyxcbiAgICAgIHBvcnQ6IHBhcnNlSW50KHByb2Nlc3MuZW52LlZJVEVfSE1SX1BPUlQgfHwgJzQ0MycsIDEwKSxcbiAgICB9LFxuICAgIHByb3h5OiB7XG4gICAgICAnL2FwaSc6IHtcbiAgICAgICAgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDo1MDAwJyxcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICBzZWN1cmU6IGZhbHNlLFxuICAgICAgfSxcbiAgICB9LFxuICAgIHdhcm11cDoge1xuICAgICAgY2xpZW50RmlsZXM6IFtcbiAgICAgICAgJy4vc3JjL3BhZ2VzL0hvbWUudHN4JyxcbiAgICAgICAgJy4vc3JjL3BhZ2VzL01vdmllcy50c3gnLFxuICAgICAgICAnLi9zcmMvcGFnZXMvVFYudHN4JyxcbiAgICAgICAgJy4vc3JjL2NvbXBvbmVudHMvTmF2YmFyLnRzeCcsXG4gICAgICBdLFxuICAgIH0sXG4gIH0sXG4gIHBsdWdpbnM6IFtyZWFjdCgpXS5maWx0ZXIoQm9vbGVhbiksXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXG4gICAgICBcIkBhc3NldHNcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL2F0dGFjaGVkX2Fzc2V0c1wiKSxcbiAgICB9LFxuICB9LFxuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBpbmNsdWRlOiBbXG4gICAgICAnenVzdGFuZCcsXG4gICAgICAnenVzdGFuZC9taWRkbGV3YXJlJyxcbiAgICAgICdyZWFjdCcsXG4gICAgICAncmVhY3QtZG9tJyxcbiAgICAgICdyZWFjdC1yb3V0ZXItZG9tJyxcbiAgICAgICdmcmFtZXItbW90aW9uJyxcbiAgICAgICdsdWNpZGUtcmVhY3QnLFxuICAgICAgJ0B0YW5zdGFjay9yZWFjdC1xdWVyeScsXG4gICAgICAncmVhY3QtbWFya2Rvd24nLFxuICAgICAgJ3JlbWFyay1nZm0nLFxuICAgICAgJ0BzdXBhYmFzZS9zdXBhYmFzZS1qcycsXG4gICAgXSxcbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICBvdXREaXI6IFwiZGlzdFwiLFxuICAgIHNvdXJjZW1hcDogbW9kZSA9PT0gXCJkZXZlbG9wbWVudFwiLFxuICAgIHRhcmdldDogJ2VzbmV4dCcsXG4gICAgbWluaWZ5OiAnZXNidWlsZCcsXG4gICAgY3NzTWluaWZ5OiB0cnVlLFxuICAgIGNzc0NvZGVTcGxpdDogdHJ1ZSxcbiAgICBtb2R1bGVQcmVsb2FkOiB7XG4gICAgICBwb2x5ZmlsbDogdHJ1ZSxcbiAgICB9LFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICAndmVuZG9yLXJlYWN0JzogWydyZWFjdCcsICdyZWFjdC1kb20nLCAncmVhY3Qtcm91dGVyLWRvbSddLFxuICAgICAgICAgICd2ZW5kb3ItdWknOiBbJ2ZyYW1lci1tb3Rpb24nLCAnbHVjaWRlLXJlYWN0J10sXG4gICAgICAgICAgJ3ZlbmRvci1xdWVyeSc6IFsnQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5J10sXG4gICAgICAgICAgJ3ZlbmRvci1zdXBhYmFzZSc6IFsnQHN1cGFiYXNlL3N1cGFiYXNlLWpzJ10sXG4gICAgICAgICAgJ3ZlbmRvci1tYXJrZG93bic6IFsncmVhY3QtbWFya2Rvd24nLCAncmVtYXJrLWdmbSddLFxuICAgICAgICB9LFxuICAgICAgICBjaHVua0ZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0tW2hhc2hdLmpzJyxcbiAgICAgICAgZW50cnlGaWxlTmFtZXM6ICdhc3NldHMvW25hbWVdLVtoYXNoXS5qcycsXG4gICAgICAgIGFzc2V0RmlsZU5hbWVzOiAnYXNzZXRzL1tuYW1lXS1baGFzaF0uW2V4dF0nLFxuICAgICAgfSxcbiAgICB9LFxuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMTAwMCxcbiAgfSxcbiAgZXNidWlsZDoge1xuICAgIGxlZ2FsQ29tbWVudHM6ICdub25lJyxcbiAgICB0cmVlU2hha2luZzogdHJ1ZSxcbiAgfSxcbiAgcHJldmlldzoge1xuICAgIHBvcnQ6IDUwMDAsXG4gICAgaG9zdDogJzAuMC4wLjAnLFxuICB9LFxufSkpO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE0USxTQUFTLG9CQUFvQjtBQUN6UyxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBRmpCLElBQU0sbUNBQW1DO0FBSXpDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxPQUFPO0FBQUEsRUFDekMsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sWUFBWTtBQUFBLElBQ1osY0FBYztBQUFBLElBQ2QsTUFBTTtBQUFBLElBQ04sU0FBUztBQUFBLE1BQ1AsK0JBQStCO0FBQUEsTUFDL0IsZ0NBQWdDO0FBQUEsTUFDaEMsZ0NBQWdDO0FBQUEsTUFDaEMsaUJBQWlCO0FBQUEsSUFDbkI7QUFBQSxJQUNBLEtBQUs7QUFBQSxNQUNILFVBQVU7QUFBQSxNQUNWLE1BQU0sUUFBUSxJQUFJLGlCQUFpQjtBQUFBLE1BQ25DLE1BQU0sU0FBUyxRQUFRLElBQUksaUJBQWlCLE9BQU8sRUFBRTtBQUFBLElBQ3ZEO0FBQUEsSUFDQSxPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsUUFDTixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxRQUFRO0FBQUEsTUFDVjtBQUFBLElBQ0Y7QUFBQSxJQUNBLFFBQVE7QUFBQSxNQUNOLGFBQWE7QUFBQSxRQUNYO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUUsT0FBTyxPQUFPO0FBQUEsRUFDakMsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLE1BQ3BDLFdBQVcsS0FBSyxRQUFRLGtDQUFXLG1CQUFtQjtBQUFBLElBQ3hEO0FBQUEsRUFDRjtBQUFBLEVBQ0EsY0FBYztBQUFBLElBQ1osU0FBUztBQUFBLE1BQ1A7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxJQUNSLFdBQVcsU0FBUztBQUFBLElBQ3BCLFFBQVE7QUFBQSxJQUNSLFFBQVE7QUFBQSxJQUNSLFdBQVc7QUFBQSxJQUNYLGNBQWM7QUFBQSxJQUNkLGVBQWU7QUFBQSxNQUNiLFVBQVU7QUFBQSxJQUNaO0FBQUEsSUFDQSxlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUEsVUFDWixnQkFBZ0IsQ0FBQyxTQUFTLGFBQWEsa0JBQWtCO0FBQUEsVUFDekQsYUFBYSxDQUFDLGlCQUFpQixjQUFjO0FBQUEsVUFDN0MsZ0JBQWdCLENBQUMsdUJBQXVCO0FBQUEsVUFDeEMsbUJBQW1CLENBQUMsdUJBQXVCO0FBQUEsVUFDM0MsbUJBQW1CLENBQUMsa0JBQWtCLFlBQVk7QUFBQSxRQUNwRDtBQUFBLFFBQ0EsZ0JBQWdCO0FBQUEsUUFDaEIsZ0JBQWdCO0FBQUEsUUFDaEIsZ0JBQWdCO0FBQUEsTUFDbEI7QUFBQSxJQUNGO0FBQUEsSUFDQSx1QkFBdUI7QUFBQSxFQUN6QjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsZUFBZTtBQUFBLElBQ2YsYUFBYTtBQUFBLEVBQ2Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxFQUNSO0FBQ0YsRUFBRTsiLAogICJuYW1lcyI6IFtdCn0K
