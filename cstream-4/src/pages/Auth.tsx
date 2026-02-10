import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../integrations/supabase/client";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Mail, Lock, User, Eye, EyeOff, Check, Code as CodeIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DiscordIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 640 512" fill="currentColor">
    <path d="M524.5 69.8a485.1 485.1 0 0 0-120.4-37.1c-1-.2-2 .3-2.5 1.2a337.5 337.5 0 0 0-14.9 30.6 447.8 447.8 0 0 0-134.4 0 309.5 309.5 0 0 0-15.1-30.6c-.5-.9-1.5-1.4-2.5-1.2A483.7 483.7 0 0 0 112 69.9c-.3.1-.6.3-.8.6C39.1 183.7 18.2 294.7 28.4 404.4c.1.5.4 1 .8 1.3A487.7 487.7 0 0 0 176 479.9c.8.2 1.6-.1 2.1-.7a348.2 348.2 0 0 0 29.9-49.5c.5-.9.1-2-.9-2.4a321.2 321.2 0 0 1-45.9-21.9 1.9 1.9 0 0 1-.2-3.1 251 251 0 0 0 9.1-7.1c.6-.5 1.4-.7 2.1-.3 96.2 43.9 200.4 43.9 295.5 0 .7-.3 1.5-.2 2.1.3 3 2.4 6 4.8 9.1 7.2.8.6 1 1.7.2 2.5a301.4 301.4 0 0 1-45.9 21.8c-1 .4-1.4 1.5-.9 2.5a391.1 391.1 0 0 0 30 48.8c.5.8 1.3 1.1 2.1.7a486 486 0 0 0 147.6-74.2c.4-.3.7-.8.8-1.3 12.3-126.8-20.5-236.9-86.9-334.5ZM222.5 337.6c-29 0-52.8-26.6-52.8-59.2s23.4-59.2 52.8-59.2c29.7 0 53.3 26.8 52.8 59.2 0 32.7-23.4 59.2-52.8 59.2Zm195.4 0c-28.9 0-52.8-26.6-52.8-59.2s23.4-59.2 52.8-59.2c29.7 0 53.3 26.8 52.8 59.2 0 32.7-23.2 59.2-52.8 59.2Z" />
  </svg>
);

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showSourceCode, setShowSourceCode] = useState(false);
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const PREMIUM_FEATURES = [
    {
      title: "Historique & Sync",
      description: "Reprenez vos contenus là où vous vous étiez arrêté sur tous vos appareils.",
      icon: <Check className="w-4 h-4" />
    },
    {
      title: "Favoris & Listes",
      description: "Créez votre propre bibliothèque et gérez vos coups de cœur facilement.",
      icon: <Check className="w-4 h-4" />
    },
    {
      title: "Agent IA Illimité",
      description: "Accès complet à notre IA pour des recommandations ultra-précises.",
      icon: <Check className="w-4 h-4" />
    },
    {
      title: "Expérience Premium",
      description: "Badges exclusifs, thèmes personnalisés et aucune publicité.",
      icon: <Check className="w-4 h-4" />
    },
  ];

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("Email ou mot de passe incorrect");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Bon retour parmi nous !");
      navigate("/");
    }
    setLoading(false);
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setResetting(true);
    try {
      if (!resetEmail.trim()) {
        toast.error("Veuillez entrer votre email");
        setResetting(false);
        return;
      }
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth?type=recovery`,
      });
      if (error) throw error;
      toast.success("Email de récupération envoyé !");
      setResetEmail("");
      setShowResetForm(false);
    } catch (error) {
      toast.error(
        "Erreur: " + (error.message || "Impossible d'envoyer l'email"),
      );
    }
    setResetting(false);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      setLoading(false);
      return;
    }
    const { error } = await signUp(email, password, username);
    if (error) {
      if (error.message.includes("already registered")) {
        toast.error("Cet email est déjà utilisé");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Bienvenue ! Vérifiez votre boîte mail pour confirmer.");
    }
    setLoading(false);
  };

  const handleDiscordLogin = async () => {
    setLoading(true);
    try {
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "discord",
        options: {
          redirectTo: origin,
          scopes: "identify email",
        },
      });
      if (error) throw error;
    } catch (error) {
      toast.error("Erreur lors de la connexion Discord");
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Google Auth Error:", error);
      toast.error("Erreur lors de la connexion Google. Assurez-vous que l'authentification Google est configurée dans Supabase.");
      setLoading(false);
    }
  };

  const GoogleIcon = () => (
    <svg viewBox="0 0 48 48" className="w-5 h-5">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      <path fill="none" d="M0 0h48v48H0z"/>
    </svg>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 selection:bg-white selection:text-black overflow-hidden relative font-sans">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px] -translate-y-1/2 opacity-30" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px] translate-y-1/2 opacity-30" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50 contrast-150" />
      </div>

      <div className="w-full max-w-[1200px] grid lg:grid-cols-2 gap-20 items-center relative z-10">
        {/* Left Side - Minimalism Branding & Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="hidden lg:block space-y-16"
        >
          <div className="space-y-10">
            <div className="flex items-center gap-4">
              <motion.div 
                whileHover={{ scale: 1.05, rotate: -2 }}
                className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl shadow-white/5"
              >
                <img src="/logo.svg" alt="CStream" className="w-10 h-10 invert" />
              </motion.div>
              <span className="text-4xl font-bold tracking-tight text-white/90">CStream</span>
            </div>
            
            <h1 className="text-7xl font-semibold leading-[1.05] tracking-tight">
              L'excellence du<br />
              <span className="text-zinc-500">streaming.</span>
            </h1>
            <p className="text-xl text-zinc-400 max-w-md font-light leading-relaxed">
              Une expérience fluide, minimaliste et sans compromis pour les passionnés du septième art.
            </p>
          </div>

          <div className="grid gap-10">
            {PREMIUM_FEATURES.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + 0.1 * i, duration: 0.6 }}
                className="flex items-start gap-6 group"
              >
                <div className="mt-1 w-12 h-12 rounded-full bg-zinc-900/50 border border-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-white group-hover:text-black transition-all duration-500">
                  {feature.icon}
                </div>
                <div className="space-y-1">
                  <h3 className="font-medium text-zinc-100 text-xl group-hover:text-white transition-colors">{feature.title}</h3>
                  <p className="text-zinc-500 leading-relaxed text-base group-hover:text-zinc-400 transition-colors">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right Side - Clean Auth Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <div className="absolute -inset-10 bg-white/5 rounded-[4rem] opacity-20 blur-[100px] -z-10" />
          
          <Card className="bg-[#0A0A0B]/60 border-white/5 rounded-[3rem] p-4 lg:p-12 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.8)] backdrop-blur-3xl overflow-hidden ring-1 ring-white/5">
            <CardHeader className="text-center lg:text-left pt-2 pb-12 space-y-4">
              <div className="lg:hidden flex justify-center mb-8">
                 <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl">
                  <img src="/logo.svg" alt="CStream" className="w-10 h-10 invert" />
                </div>
              </div>
              <CardTitle className="text-4xl font-semibold tracking-tight text-white">Bienvenue</CardTitle>
              <p className="text-zinc-500 text-lg font-light">Accédez à votre bibliothèque premium.</p>
            </CardHeader>

            <CardContent className="space-y-10">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 p-1 bg-zinc-900/40 border border-white/5 rounded-2xl mb-12">
                  <TabsTrigger
                    value="login"
                    className="rounded-xl py-3.5 data-[state=active]:bg-white data-[state=active]:text-black transition-all duration-500 font-medium text-sm"
                  >
                    Connexion
                  </TabsTrigger>
                  <TabsTrigger
                    value="register"
                    className="rounded-xl py-3.5 data-[state=active]:bg-white data-[state=active]:text-black transition-all duration-500 font-medium text-sm"
                  >
                    Inscription
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-8 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-3 duration-700">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="email" className="text-xs font-medium text-zinc-500 ml-1">
                        Adresse E-mail
                      </Label>
                      <div className="relative group">
                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-white transition-colors" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="votre@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="h-14 pl-14 bg-zinc-900/20 border-white/5 rounded-2xl focus:ring-0 focus:border-white/20 transition-all text-base font-light"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between ml-1">
                        <Label htmlFor="password" className="text-xs font-medium text-zinc-500">
                          Mot de passe
                        </Label>
                        <button
                          type="button"
                          onClick={() => setShowResetForm(true)}
                          className="text-[10px] text-zinc-600 hover:text-white transition-colors font-medium"
                        >
                          Mot de passe oublié ?
                        </button>
                      </div>
                      <div className="relative group">
                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-white transition-colors" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="h-14 pl-14 pr-14 bg-zinc-900/20 border-white/5 rounded-2xl focus:ring-0 focus:border-white/20 transition-all text-base font-light"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <Button
                      onClick={handleSignIn}
                      disabled={loading}
                      className="w-full h-15 bg-white text-black hover:bg-zinc-200 rounded-2xl font-semibold text-base transition-all active:scale-[0.99] border-none"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Se connecter"}
                    </Button>

                    <div className="relative py-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/5" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-[#0A0A0B] px-4 text-zinc-600 font-light">ou continuer avec</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      <Button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full h-15 bg-white text-black hover:bg-zinc-100 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.99] font-medium text-sm shadow-xl shadow-black/20 border-none"
                      >
                        <GoogleIcon />
                        <span>Google <span className="text-[10px] text-zinc-400 font-light ml-1">beta</span></span>
                      </Button>

                      <Button
                        type="button"
                        onClick={handleDiscordLogin}
                        disabled={loading}
                        className="w-full h-15 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.99] font-medium text-sm border-none"
                      >
                        <DiscordIcon />
                        <span>Discord</span>
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="register" className="space-y-8 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="space-y-5">
                    <div className="space-y-3">
                      <Label htmlFor="username" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">
                        Nom d'utilisateur
                      </Label>
                      <div className="relative group">
                        <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-white transition-colors" />
                        <Input
                          id="username"
                          type="text"
                          placeholder="Elite_User"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="h-14 pl-14 bg-zinc-900/30 border-zinc-800/50 rounded-2xl focus:ring-2 focus:ring-white/10 focus:border-white transition-all text-base font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="signup-email" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">
                        Adresse E-mail
                      </Label>
                      <div className="relative group">
                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-white transition-colors" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="new@cstream.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="h-14 pl-14 bg-zinc-900/30 border-zinc-800/50 rounded-2xl focus:ring-2 focus:ring-white/10 focus:border-white transition-all text-base font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="signup-password" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">
                        Mot de passe
                      </Label>
                      <div className="relative group">
                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-white transition-colors" />
                        <Input
                          id="signup-password"
                          type={showSignupPassword ? "text" : "password"}
                          placeholder="Complexité requise"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="h-14 pl-14 pr-14 bg-zinc-900/30 border-zinc-800/50 rounded-2xl focus:ring-2 focus:ring-white/10 focus:border-white transition-all text-base font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignupPassword(!showSignupPassword)}
                          className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
                        >
                          {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5 pt-2">
                    <Button
                      onClick={handleSignUp}
                      disabled={loading}
                      className="w-full h-14 bg-white text-black hover:bg-zinc-200 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-[0.98] shadow-2xl shadow-white/5"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Création du compte"}
                    </Button>

                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-zinc-900" />
                      </div>
                      <div className="relative flex justify-center text-[9px] uppercase tracking-[0.3em] font-black">
                        <span className="bg-[#0A0A0B] px-6 text-zinc-700 italic">Direct Join</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      <Button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full h-14 bg-white text-black hover:bg-zinc-100 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] font-black text-xs uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(255,255,255,0.1)] border-none"
                      >
                        <GoogleIcon />
                        <span>Continuer avec Google <span className="text-[8px] opacity-40 lowercase font-normal ml-2">beta</span></span>
                      </Button>

                      <Button
                        type="button"
                        onClick={handleDiscordLogin}
                        disabled={loading}
                        className="w-full h-14 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] font-bold text-xs uppercase tracking-widest shadow-lg shadow-[#5865F2]/10"
                      >
                        <DiscordIcon />
                        <span>Discord Access</span>
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <AnimatePresence>
        {showSourceCode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-3xl"
          >
            <Card className="w-full max-w-4xl bg-zinc-950 border-zinc-800/50 rounded-[2rem] overflow-hidden max-h-[80vh] flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-900/50 p-8 shrink-0">
                <div>
                  <CardTitle className="text-xl font-black tracking-widest uppercase italic">Infrastructure Core</CardTitle>
                  <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mt-1">Authentication Layer Architecture</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setShowSourceCode(false)}
                  className="rounded-xl border-zinc-800 hover:bg-white hover:text-black transition-all font-bold"
                >
                  Fermer
                </Button>
              </CardHeader>
              <CardContent className="p-0 overflow-y-auto scrollbar-none flex-1">
                <div className="p-8 font-mono text-sm leading-relaxed text-zinc-400">
                  <pre className="whitespace-pre-wrap">
                    {`/** 
 * CStream Authentication Controller v4.0 
 * High-Security OAuth & Session Management
 */

const handleSignIn = async (credentials) => {
  const { user, session, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) {
    logger.error('Security Failure:', error.message);
    throw new AuthenticationError(error);
  }

  return {
    authorized: true,
    userId: user.id,
    sessionToken: session.access_token,
    clearance: 'PREMIUM_VVIP'
  };
};

// Discord Integration v2.1
const handleDiscordSync = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: {
      scopes: 'identify email guilds',
      redirectTo: 'https://cstream.app/vault'
    }
  });
};`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={showResetForm} onOpenChange={setShowResetForm}>
        <DialogContent className="bg-[#0A0A0B] border-zinc-900 rounded-[2rem] max-w-md p-8 shadow-2xl">
          <DialogHeader className="space-y-4">
            <DialogTitle className="text-2xl font-black uppercase tracking-widest italic italic">Restaurer</DialogTitle>
            <DialogDescription className="text-zinc-500 font-medium leading-relaxed">
              Entrez l'adresse associée à votre compte pour initier la procédure de récupération.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-6">
            <div className="space-y-3">
              <Label htmlFor="reset-email" className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1">E-mail de récupération</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="client@vault.cstream"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                className="h-14 bg-zinc-900/50 border-zinc-800 rounded-2xl focus:ring-white transition-all font-medium"
              />
            </div>
            <div className="flex gap-4">
              <Button
                onClick={handlePasswordReset}
                disabled={resetting}
                className="flex-1 h-14 bg-white text-black hover:bg-zinc-200 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
              >
                {resetting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Envoyer"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowResetForm(false)}
                className="flex-1 h-14 border-zinc-800 text-zinc-500 hover:text-white rounded-2xl font-bold transition-all"
              >
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
