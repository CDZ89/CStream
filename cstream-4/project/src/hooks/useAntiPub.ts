import { useEffect } from 'react';

export const useAntiPub = (isEnabled: boolean) => {
    useEffect(() => {
        if (!isEnabled) return;

        // 1. Blocage des Popups (Override window.open)
        const originalOpen = window.open;
        window.open = function () {
            console.warn("CStream Protection: Popup bloquée par l'Anti-Pub Beta");
            return null;
        };

        // 2. Blocage des événements de clic qui forcent des redirects dans un nouvel onglet
        const handleGlobalClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // On cherche si on a cliqué sur un lien ou à l'intérieur d'un lien
            const anchor = target.closest('a');
            if (anchor && anchor.target === '_blank') {
                const isInternal = anchor.href.startsWith(window.location.origin);
                if (!isInternal) {
                    console.warn("CStream Protection: Lien externe bloqué par l'Anti-Pub Beta");
                    e.preventDefault();
                }
            }
        };

        window.addEventListener('click', handleGlobalClick, true);

        return () => {
            window.open = originalOpen;
            window.removeEventListener('click', handleGlobalClick, true);
        };
    }, [isEnabled]);
};
