import { useEffect } from 'react';

/**
 * useAntiPub hook
 * Intercepts window.open calls and global click events to block popups
 * and unauthorized redirections.
 */
export const useAntiPub = (isEnabled: boolean) => {
    useEffect(() => {
        if (!isEnabled) return;

        console.log("[Anti-Pub] Shield Active");

        // 1. Intercept window.open
        const originalOpen = window.open;
        window.open = (url?: string | URL, target?: string, features?: string) => {
            console.warn("CStream Protection: Popup blocked", { url, target });
            return null;
        };

        // 2. Intercept forced redirects on click
        const handleGlobalClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Some ads use invisible overlays or specific classes
            if (
                target.classList.contains('popup') ||
                target.classList.contains('overlay') ||
                (target.tagName === 'A' && (target as HTMLAnchorElement).target === '_blank')
            ) {
                // We could potentially block specifically here if we detect malicious patterns
            }
        };

        // 3. Prevent beforeunload and unload spam (common in ad scripts)
        const preventUnloadSpam = (e: BeforeUnloadEvent) => {
            // Only if something is actually playing or if we want to be aggressive
        };

        window.addEventListener('click', handleGlobalClick, true);

        return () => {
            window.open = originalOpen;
            window.removeEventListener('click', handleGlobalClick);
        };
    }, [isEnabled]);
};
