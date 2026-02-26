import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { initializeTheme } from "./lib/themes";

initializeTheme();

// Loader fade-out timing (purely visual)
const LOADER_MIN_TIME = 0;
const startLoadTime = Date.now();

const removeLoader = () => {
  const loader = document.getElementById('initial-loader');
  if (loader && !loader.getAttribute('data-removing')) {
    loader.setAttribute('data-removing', 'true');
    loader.style.opacity = '0';
    loader.style.pointerEvents = 'none';
    loader.style.transition = 'opacity 0.5s ease-out';
    setTimeout(() => loader.remove(), 500);
  }
};

window.addEventListener('load', () => {
  const remainingTime = Math.max(0, LOADER_MIN_TIME - (Date.now() - startLoadTime));
  setTimeout(removeLoader, remainingTime);
});

// Safety: Remove loader after max 4s no matter what
setTimeout(removeLoader, 4000);

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
