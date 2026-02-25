import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, ExternalLink, X, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { InstallButton } from '@/components/InstallButton';

export const VPNOverlay = () => {
    const { language, t } = useI18n();
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

    const vpnName = "NordVPN";
    const vpnLink = "https://nordvpn.com/fr/risk-free-vpn/";
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(vpnLink).hostname}&sz=32`;

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[100]"
                >
                    <div className="bg-[#1a1b26]/95 backdrop-blur-xl border border-red-500/20 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />

                        <button
                            onClick={handleDismiss}
                            className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-full bg-red-500/10 text-red-500 shrink-0 animate-pulse">
                                <ShieldAlert className="w-6 h-6" />
                            </div>

                            <div className="space-y-4 w-full">
                                <div>
                                    <h3 className="font-bold text-white text-base mb-1">{t("protection.title")}</h3>
                                    <p className="text-[10px] text-slate-300 leading-relaxed">
                                        {t("protection.desc")}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-2.5">
                                    {/* VPN Link */}
                                    <button
                                        onClick={() => window.open('https://chromewebstore.google.com/detail/majdfhpaihoncoakbjgbdhglocklcgno?utm_source=item-share-cb', '_blank', 'noopener,noreferrer')}
                                        className="flex items-center gap-3 w-full bg-white/[0.05] hover:bg-white/[0.1] text-white p-2 rounded-xl transition-all group border border-white/10 text-left cursor-pointer"
                                    >
                                        <div className="bg-white p-1 rounded-lg shrink-0">
                                            <img src="https://lh3.googleusercontent.com/Rm5hcKXvm9Prc-vyHzNGRpRVPxZAKQiiKPDNWW4Sn-MOm_-TxDOcKqNDpHUOYZBVidpnqWt22Wjwz9vtgW8nq-9Mrw=s120" alt="VPN" className="w-5 h-5 object-contain" />
                                        </div>
                                        <span className="text-xs font-bold flex-1">{t("protection.vpn")}</span>
                                        <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                                    </button>

                                    {/* uBlock Link */}
                                    <button
                                        onClick={() => window.open('https://chromewebstore.google.com/detail/ddkjiahejlhfcafbddmgiahcphecmpfh?utm_source=item-share-cb', '_blank', 'noopener,noreferrer')}
                                        className="flex items-center gap-3 w-full bg-white/[0.05] hover:bg-white/[0.1] text-white p-2 rounded-xl transition-all group border border-white/10 text-left cursor-pointer"
                                    >
                                        <div className="bg-white p-1 rounded-lg shrink-0">
                                            <img src="https://lh3.googleusercontent.com/lsanoOfx5N_t-7gh5Qg9FGIirVEjdCqalZXyLZYRd5d7Fydm83FQhu4Oq0JmlRyMtyF_LfwuQQZyKRTHs6emnFirsA=s120" alt="uBlock" className="w-5 h-5 object-contain" />
                                        </div>
                                        <span className="text-xs font-bold flex-1">{t("protection.ublock")}</span>
                                        <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                                    </button>

                                    {/* Adblock Link */}
                                    <button
                                        onClick={() => window.open('https://chromewebstore.google.com/detail/cfhdojbkjhnklbpkdaibdccddilifddb', '_blank', 'noopener,noreferrer')}
                                        className="flex items-center gap-3 w-full bg-white/[0.05] hover:bg-white/[0.1] text-white p-2 rounded-xl transition-all group border border-white/10 text-left cursor-pointer"
                                    >
                                        <div className="bg-white p-1 rounded-lg shrink-0">
                                            <img src="https://lh3.googleusercontent.com/nnMASpwJY4U5ukhKl4PfIdaOpuKXNrVvfIc9n8-NJOJIY7m3RLgsazN6ATmDkXyaMll8zADOXuBR574MwC7T71kJcQ=s120" alt="Adblock" className="w-5 h-5 object-contain" />
                                        </div>
                                        <span className="text-xs font-bold flex-1">{t("protection.adblock")}</span>
                                        <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                </div>

                                {/* PWA Install Option */}
                                <div className="pt-2 border-t border-white/5">
                                    <InstallButton variant="overlay" />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
