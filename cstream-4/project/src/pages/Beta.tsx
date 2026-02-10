import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Beaker, Lock, Sparkles, Rocket, Code, Zap, 
  Shield, Eye, Bug, Wrench, Users, Bell,
  CheckCircle, Clock, AlertCircle, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface BetaFeature {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'testing' | 'coming_soon';
  icon: React.ReactNode;
  category: 'ui' | 'performance' | 'feature' | 'security';
}

const betaFeatures: BetaFeature[] = [
  {
    id: 'new-player',
    title: 'Nouveau lecteur vidéo v4',
    description: 'Lecteur repensé avec contrôles avancés et multi-sources automatiques',
    status: 'testing',
    icon: <Zap className="w-5 h-5" />,
    category: 'feature',
  },
  {
    id: 'ai-recommendations',
    title: 'Recommandations IA',
    description: 'Suggestions personnalisées basées sur vos habitudes de visionnage',
    status: 'coming_soon',
    icon: <Sparkles className="w-5 h-5" />,
    category: 'feature',
  },
  {
    id: 'offline-mode',
    title: 'Mode hors-ligne',
    description: 'Sauvegardez vos médias préférés pour les regarder sans connexion',
    status: 'coming_soon',
    icon: <Shield className="w-5 h-5" />,
    category: 'feature',
  },
  {
    id: 'new-animations',
    title: 'Animations fluides v2',
    description: 'Transitions et micro-interactions repensées pour plus de fluidité',
    status: 'active',
    icon: <Rocket className="w-5 h-5" />,
    category: 'ui',
  },
  {
    id: 'fast-loading',
    title: 'Chargement ultra-rapide',
    description: 'Optimisations du cache et préchargement intelligent des données',
    status: 'active',
    icon: <Zap className="w-5 h-5" />,
    category: 'performance',
  },
  {
    id: 'debug-tools',
    title: 'Outils de débogage',
    description: 'Console de diagnostic pour les créateurs et développeurs',
    status: 'testing',
    icon: <Bug className="w-5 h-5" />,
    category: 'security',
  },
];

const Beta = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const checkAccess = () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      const allowedRoles = ['admin', 'creator', 'moderator', 'beta_tester'];
      const userHasAccess = allowedRoles.includes(role || '');
      
      setHasAccess(userHasAccess);
      setLoading(false);
    };

    checkAccess();
  }, [user, role, navigate]);

  const getStatusBadge = (status: BetaFeature['status']) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 gap-1">
            <CheckCircle className="w-3 h-3" />
            Actif
          </Badge>
        );
      case 'testing':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 gap-1">
            <Clock className="w-3 h-3" />
            En test
          </Badge>
        );
      case 'coming_soon':
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 gap-1">
            <AlertCircle className="w-3 h-3" />
            Bientôt
          </Badge>
        );
    }
  };

  const getCategoryColor = (category: BetaFeature['category']) => {
    switch (category) {
      case 'ui': return 'from-pink-500/10 to-pink-600/5 border-pink-500/20';
      case 'performance': return 'from-green-500/10 to-green-600/5 border-green-500/20';
      case 'feature': return 'from-purple-500/10 to-purple-600/5 border-purple-500/20';
      case 'security': return 'from-orange-500/10 to-orange-600/5 border-orange-500/20';
    }
  };

  const filteredFeatures = selectedCategory === 'all' 
    ? betaFeatures 
    : betaFeatures.filter(f => f.category === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent"
          />
          <p className="text-muted-foreground">Vérification des accès...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[80vh] gap-6 px-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="p-6 rounded-full bg-red-500/10 border border-red-500/20"
          >
            <Lock className="w-16 h-16 text-red-400" />
          </motion.div>
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Accès restreint</h1>
            <p className="text-muted-foreground max-w-md">
              Cette page est réservée aux administrateurs, créateurs et testeurs beta.
            </p>
          </div>
          <Button 
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-primary to-accent"
          >
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="relative overflow-hidden py-20 bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.2),transparent_60%)]" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" />
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="inline-flex items-center gap-2 mb-6 px-5 py-2.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full border border-primary/30"
            >
              <Beaker className="w-5 h-5 text-primary animate-bounce" />
              <span className="text-sm font-bold text-primary uppercase tracking-wider">
                Accès Beta Exclusif
              </span>
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-black mb-6">
              <span className="gradient-text">Fonctionnalités Beta</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Découvrez en avant-première les nouvelles fonctionnalités en développement. 
              Votre feedback nous aide à améliorer CStream !
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-500/20">
                <Beaker className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-400">{betaFeatures.length}</p>
                <p className="text-sm text-muted-foreground">Fonctionnalités</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-400">
                  {betaFeatures.filter(f => f.status === 'active').length}
                </p>
                <p className="text-sm text-muted-foreground">Actives</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-yellow-500/20">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-400">
                  {betaFeatures.filter(f => f.status === 'testing').length}
                </p>
                <p className="text-sm text-muted-foreground">En test</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/20">
                <Rocket className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-400">
                  {betaFeatures.filter(f => f.status === 'coming_soon').length}
                </p>
                <p className="text-sm text-muted-foreground">À venir</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2 mb-8"
        >
          {[
            { key: 'all', label: 'Toutes', icon: <Eye className="w-4 h-4" /> },
            { key: 'feature', label: 'Fonctionnalités', icon: <Sparkles className="w-4 h-4" /> },
            { key: 'ui', label: 'Interface', icon: <Wrench className="w-4 h-4" /> },
            { key: 'performance', label: 'Performance', icon: <Zap className="w-4 h-4" /> },
            { key: 'security', label: 'Sécurité', icon: <Shield className="w-4 h-4" /> },
          ].map((cat) => (
            <Button
              key={cat.key}
              variant={selectedCategory === cat.key ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(cat.key)}
              className={`gap-2 rounded-xl transition-all ${
                selectedCategory === cat.key 
                  ? 'bg-gradient-to-r from-primary to-accent shadow-lg' 
                  : 'border-border/50 hover:border-primary/50'
              }`}
            >
              {cat.icon}
              {cat.label}
            </Button>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredFeatures.map((feature, index) => (
              <motion.div
                key={feature.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`bg-gradient-to-br ${getCategoryColor(feature.category)} border transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/10 cursor-pointer`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="p-3 rounded-xl bg-white/5 text-primary">
                        {feature.icon}
                      </div>
                      {getStatusBadge(feature.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-lg mb-2">{feature.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12"
        >
          <Card className="border-white/10 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Vous avez une idée ?
              </CardTitle>
              <CardDescription>
                Partagez vos suggestions pour les prochaines fonctionnalités
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4">
              <Button 
                className="flex-1 bg-gradient-to-r from-primary to-accent gap-2"
                onClick={() => toast.success('Fonctionnalité bientôt disponible !')}
              >
                <Sparkles className="w-4 h-4" />
                Proposer une idée
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 gap-2 border-white/10"
                onClick={() => toast.info('Rejoignez notre Discord pour reporter des bugs')}
              >
                <Bug className="w-4 h-4" />
                Reporter un bug
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Beta;
