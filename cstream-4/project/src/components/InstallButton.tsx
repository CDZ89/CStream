import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X, Smartphone, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallButtonProps {
    variant?: 'default' | 'footer' | 'overlay';
    className?: string;
}

export function InstallButton({ variant = 'default', className = '' }: InstallButtonProps) {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Listen for beforeinstallprompt event
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            const promptEvent = e as BeforeInstallPromptEvent;
            setDeferredPrompt(promptEvent);
            setIsInstallable(true);

            // Auto-show prompt for footer variant after 5 seconds
            if (variant === 'footer') {
                setTimeout(() => setShowPrompt(true), 5000);
            }
        };

        // Listen for app installed event
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setIsInstallable(false);
            setDeferredPrompt(null);
            console.log('PWA installed successfully');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, [variant]);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        try {
            await deferredPrompt.prompt();
            const choiceResult = await deferredPrompt.userChoice;

            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }

            setDeferredPrompt(null);
            setIsInstallable(false);
            setShowPrompt(false);
        } catch (error) {
            console.error('Error showing install prompt:', error);
        }
    };

    // Don't show if already installed or not installable
    if (isInstalled || !isInstallable) return null;

    // Footer variant - static section at bottom
    if (variant === 'footer') {
        // Don't show anything if not installable
        if (!isInstallable) return null;

        return (
            <div className="w-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-6">
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="p-4 bg-primary/20 rounded-2xl">
                        <Download className="w-8 h-8 text-primary" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h3 className="font-bold text-xl mb-1">Installer CStream</h3>
                        <p className="text-sm text-muted-foreground">
                            Accédez rapidement à vos films et séries préférés depuis votre écran d'accueil
                        </p>
                    </div>
                    <Button
                        onClick={handleInstallClick}
                        size="lg"
                        className="bg-primary hover:bg-primary/90 font-bold px-8"
                    >
                        <Download className="w-5 h-5 mr-2" />
                        Installer l'application
                    </Button>
                </div>
            </div>
        );
    }

    // Overlay variant (for VPN menu)
    if (variant === 'overlay') {
        return (
            <button
                onClick={handleInstallClick}
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors rounded-lg w-full text-left"
            >
                <div className="p-2 bg-primary/20 rounded-lg">
                    <Download className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                    <div className="font-medium">Installer l'application</div>
                    <div className="text-xs text-muted-foreground hidden sm:block">
                        Accès rapide depuis votre écran d'accueil
                    </div>
                    <div className="text-xs text-muted-foreground sm:hidden">
                        Ajouter à l'écran d'accueil
                    </div>
                </div>
                <div className="hidden sm:block">
                    <Monitor className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="sm:hidden">
                    <Smartphone className="w-5 h-5 text-muted-foreground" />
                </div>
            </button>
        );
    }

    // Default variant (simple button)
    return (
        <Button
            onClick={handleInstallClick}
            variant="outline"
            className={`gap-2 ${className}`}
        >
            <Download className="w-4 h-4" />
            Installer l'application
        </Button>
    );
}
