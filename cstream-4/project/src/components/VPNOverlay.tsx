import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, ExternalLink, X, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

export const VPNOverlay = () => {
    const { language } = useI18n();
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Check if user is in France using timezone
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const isFrance = timezone === 'Europe/Paris';
        const isFrench = language === 'fr';

        if (isFrance && isFrench) {
            const dismissed = localStorage.getItem('vpn-warning-dismissed');
            if (!dismissed) {
                setShow(true);
            }
        }
    }, [language]);

    const handleDismiss = () => {
        setShow(false);
        localStorage.setItem('vpn-warning-dismissed', 'true');
    };

    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative max-w-lg w-full bg-zinc-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
                    >
                        {/* Decorative background lueur */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 blur-[80px] rounded-full pointer-events-none" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                    <ShieldAlert className="w-8 h-8 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white tracking-tight uppercase italic underline decoration-primary/50 underline-offset-8">
                                        Accès Limité ?
                                    </h2>
                                    <p className="text-primary font-bold text-xs mt-2 uppercase tracking-widest">Information Importante</p>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                <p className="text-white/80 leading-relaxed">
                                    Il semblerait que certains fournisseurs d'accès Internet en France bloquent l'accès à nos serveurs de streaming.
                                </p>

                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                                    <div className="flex items-start gap-3">
                                        <ShieldCheck className="w-5 h-5 text-green-500 mt-1 shrink-0" />
                                        <p className="text-sm text-white/90">
                                            Utilisez un <strong>VPN</strong> (Chrome Extension ou application) pour contourner ces blocages.
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <ShieldCheck className="w-5 h-5 text-green-500 mt-1 shrink-0" />
                                        <p className="text-sm text-white/90">
                                            Ou changez vos DNS pour ceux de Cloudflare (<strong>1.1.1.1</strong>).
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <Button
                                    className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-tight gap-2 text-lg shadow-[0_0_20px_rgba(var(--theme-primary-rgb),0.3)] transition-all hover:scale-[1.02]"
                                    onClick={handleDismiss}
                                >
                                    J'ai compris
                                </Button>

                                <Button
                                    variant="ghost"
                                    className="w-full text-white/40 hover:text-white/60 hover:bg-transparent text-xs uppercase font-bold tracking-widest"
                                    onClick={handleDismiss}
                                >
                                    Ne plus afficher
                                </Button>
                            </div>
                        </div>

                        <button
                            onClick={handleDismiss}
                            className="absolute top-6 right-6 p-2 rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
