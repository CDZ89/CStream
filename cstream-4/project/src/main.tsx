import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { initializeTheme } from "./lib/themes";

initializeTheme();

// Loader fade-out timing (purely visual, no scroll lock)
const LOADER_MIN_TIME = 3500; // 3.5s for animation to complete
const startLoadTime = Date.now();

window.addEventListener('load', () => {
  const elapsedTime = Date.now() - startLoadTime;
  const remainingTime = Math.max(0, LOADER_MIN_TIME - elapsedTime);

  setTimeout(() => {
    const loader = document.getElementById('initial-loader');

    if (loader) {
      loader.style.opacity = '0';
      loader.style.pointerEvents = 'none';
      loader.style.transition = 'opacity 0.6s ease-out';

      setTimeout(() => {
        loader.remove();
      }, 600);
    }
  }, remainingTime);
});

// Safety: Remove loader after max 5s no matter what
setTimeout(() => {
  const loader = document.getElementById('initial-loader');
  if (loader) loader.remove();
}, 5000);

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
