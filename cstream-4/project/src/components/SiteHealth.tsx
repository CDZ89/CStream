import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Tv, 
  Film, 
  Star,
  ChevronDown,
  ChevronRight,
  Globe,
  Loader2,
  AlertTriangle,
  Info,
  XCircle,
  Wrench,
  Download,
  Bell,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Link2,
  Trash2,
  Eye,
  Copy,
  History,
  Settings,
  Zap,
  ExternalLink
} from 'lucide-react';
import { sendDiscordWebhook, getWebhookUrl } from '@/lib/discord';

type Severity = 'critical' | 'warning' | 'info';

interface Problem {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  category: 'url' | 'tmdb' | 'duplicate' | 'episode' | 'source' | 'general';
  affectedItems: string[];
  fixAction?: {
    label: string;
    type: 'enable' | 'disable' | 'delete' | 'link' | 'custom';
    handler?: () => Promise<void>;
  };
}

interface HealthStats {
  totalReaders: number;
  enabledReaders: number;
  disabledReaders: number;
  movieReaders: number;
  tvReaders: number;
  animeReaders: number;
  readersWithTmdb: number;
  readersWithoutTmdb: number;
  languageBreakdown: { [key: string]: number };
  seasonBreakdown: { [key: string]: number };
  invalidUrls: number;
  duplicates: number;
}

interface DiagnosticResult {
  check: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
  details?: string;
}

interface HealthHistoryEntry {
  timestamp: Date;
  overallStatus: 'ok' | 'warning' | 'error';
  problemCount: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  stats: HealthStats | null;
}

interface Reader {
  id: string;
  label: string;
  url: string;
  language: string;
  media_type: string;
  tmdb_id: number | null;
  enabled: boolean | null;
  episode_number: number | null;
  season_number: number | null;
  created_at: string | null;
}

const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000;
const MAX_HISTORY_ENTRIES = 50;

const isValidUrl = (url: string): boolean => {
  try {
    const urlPattern = /^(https?:\/\/)?([\w\-]+\.)+[\w\-]+(\/[\w\-._~:/?#[\]@!$&'()*+,;=%]*)?$/i;
    return urlPattern.test(url) || url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
};

const findDuplicates = (readers: Reader[]): Map<string, Reader[]> => {
  const grouped = new Map<string, Reader[]>();
  readers.forEach(reader => {
    const key = `${reader.tmdb_id || 'no-tmdb'}_${reader.media_type}_S${reader.season_number || 0}E${reader.episode_number || 0}_${reader.language}`;
    const existing = grouped.get(key) || [];
    existing.push(reader);
    grouped.set(key, existing);
  });
  
  const duplicates = new Map<string, Reader[]>();
  grouped.forEach((readers, key) => {
    if (readers.length > 1) {
      duplicates.set(key, readers);
    }
  });
  return duplicates;
};

const SiteHealth = memo(() => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);
  const [stats, setStats] = useState<HealthStats | null>(null);
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [healthHistory, setHealthHistory] = useState<HealthHistoryEntry[]>([]);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [autoMonitoring, setAutoMonitoring] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [problemsExpanded, setProblemsExpanded] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedProblems, setSelectedProblems] = useState<Set<string>>(new Set());
  const [fixing, setFixing] = useState(false);
  const [readers, setReaders] = useState<Reader[]>([]);
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);

  const getSeverityIcon = (severity: Severity) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: Severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'info':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  const sendCriticalAlert = useCallback(async (problems: Problem[]) => {
    const webhookUrl = getWebhookUrl();
    if (!webhookUrl) return;

    const criticalProblems = problems.filter(p => p.severity === 'critical');
    if (criticalProblems.length === 0) return;

    const problemsList = criticalProblems
      .slice(0, 5)
      .map(p => `• **${p.title}**: ${p.description}`)
      .join('\n');

    await sendDiscordWebhook(webhookUrl, {
      username: 'CStream Health Monitor',
      avatar_url: 'https://cdn.discordapp.com/embed/avatars/0.png',
      embeds: [{
        title: '🚨 Alertes Critiques - Santé du Site',
        description: `**${criticalProblems.length} problème(s) critique(s) détecté(s)**\n\n${problemsList}${criticalProblems.length > 5 ? `\n\n... et ${criticalProblems.length - 5} autres` : ''}`,
        color: 0xEF4444,
        timestamp: new Date().toISOString(),
        footer: { text: 'CStream Health Monitor' }
      }]
    });
  }, []);

  const runHealthCheck = useCallback(async () => {
    setRefreshing(true);
    const newDiagnostics: DiagnosticResult[] = [];
    const newProblems: Problem[] = [];

    try {
      const { data: readersData, error } = await supabase
        .from('readers')
        .select('*');

      if (error) {
        setDbConnected(false);
        newDiagnostics.push({
          check: 'Connexion Base de Données',
          status: 'error',
          message: `Erreur de connexion: ${error.message}`
        });
        newProblems.push({
          id: 'db-error',
          title: 'Erreur de connexion',
          description: `Impossible de se connecter à la base de données: ${error.message}`,
          severity: 'critical',
          category: 'general',
          affectedItems: []
        });
        setDiagnostics(newDiagnostics);
        setProblems(newProblems);
        return;
      }

      setDbConnected(true);
      newDiagnostics.push({
        check: 'Connexion Base de Données',
        status: 'ok',
        message: 'Connexion Supabase établie'
      });

      const readerList: Reader[] = (readersData || []).map((r: any) => ({
        id: r.id,
        label: r.label,
        url: r.url,
        language: r.language || 'unknown',
        media_type: r.media_type,
        tmdb_id: r.tmdb_id,
        enabled: r.enabled,
        episode_number: r.episode_number,
        season_number: r.season_number,
        created_at: r.created_at
      }));
      
      setReaders(readerList);

      const enabledReaders = readerList.filter(r => r.enabled);
      const disabledReaders = readerList.filter(r => !r.enabled);
      const movieReaders = readerList.filter(r => r.media_type === 'movie');
      const tvReaders = readerList.filter(r => r.media_type === 'tv' || r.media_type === 'series');
      const animeReaders = readerList.filter(r => r.media_type === 'anime');
      const withTmdb = readerList.filter(r => r.tmdb_id !== null);
      const withoutTmdb = readerList.filter(r => r.tmdb_id === null);

      const invalidUrlReaders = readerList.filter(r => !isValidUrl(r.url));
      const duplicateGroups = findDuplicates(readerList);
      let duplicateCount = 0;
      duplicateGroups.forEach(group => {
        duplicateCount += group.length - 1;
      });

      const languageBreakdown: { [key: string]: number } = {};
      readerList.forEach(r => {
        const lang = r.language || 'unknown';
        languageBreakdown[lang] = (languageBreakdown[lang] || 0) + 1;
      });

      const seasonBreakdown: { [key: string]: number } = {};
      readerList.filter(r => r.season_number !== null).forEach(r => {
        const key = `S${r.season_number}`;
        seasonBreakdown[key] = (seasonBreakdown[key] || 0) + 1;
      });

      const newStats: HealthStats = {
        totalReaders: readerList.length,
        enabledReaders: enabledReaders.length,
        disabledReaders: disabledReaders.length,
        movieReaders: movieReaders.length,
        tvReaders: tvReaders.length,
        animeReaders: animeReaders.length,
        readersWithTmdb: withTmdb.length,
        readersWithoutTmdb: withoutTmdb.length,
        languageBreakdown,
        seasonBreakdown,
        invalidUrls: invalidUrlReaders.length,
        duplicates: duplicateCount
      };
      setStats(newStats);

      if (readerList.length === 0) {
        newDiagnostics.push({
          check: 'Sources de Contenu',
          status: 'warning',
          message: 'Aucune source de contenu configurée'
        });
        newProblems.push({
          id: 'no-sources',
          title: 'Aucune source configurée',
          description: 'Votre site n\'a aucune source de contenu. Ajoutez des lecteurs pour afficher du contenu.',
          severity: 'warning',
          category: 'source',
          affectedItems: []
        });
      } else {
        newDiagnostics.push({
          check: 'Sources de Contenu',
          status: 'ok',
          message: `${readerList.length} sources configurées`
        });
      }

      const disabledPercentage = readerList.length > 0 ? (disabledReaders.length / readerList.length * 100) : 0;
      if (enabledReaders.length === 0 && readerList.length > 0) {
        newDiagnostics.push({
          check: 'Sources Actives',
          status: 'error',
          message: 'Aucune source active'
        });
        newProblems.push({
          id: 'no-active-sources',
          title: 'Aucune source active',
          description: 'Toutes vos sources sont désactivées. Le contenu ne sera pas accessible.',
          severity: 'critical',
          category: 'source',
          affectedItems: disabledReaders.map(r => r.id),
          fixAction: {
            label: 'Activer toutes les sources',
            type: 'enable'
          }
        });
      } else if (disabledPercentage > 50) {
        newDiagnostics.push({
          check: 'Sources Actives',
          status: 'warning',
          message: `${Math.round(disabledPercentage)}% des sources sont désactivées`
        });
        newProblems.push({
          id: 'many-disabled',
          title: 'Beaucoup de sources désactivées',
          description: `${disabledReaders.length} sources (${Math.round(disabledPercentage)}%) sont désactivées.`,
          severity: 'warning',
          category: 'source',
          affectedItems: disabledReaders.map(r => r.id)
        });
      } else {
        newDiagnostics.push({
          check: 'Sources Actives',
          status: 'ok',
          message: `${enabledReaders.length}/${readerList.length} sources actives`
        });
      }

      const tmdbPercentage = readerList.length > 0 ? (withTmdb.length / readerList.length * 100) : 0;
      if (tmdbPercentage < 30) {
        newDiagnostics.push({
          check: 'Liaison TMDB',
          status: 'error',
          message: `Seulement ${Math.round(tmdbPercentage)}% des sources sont liées à TMDB`
        });
        newProblems.push({
          id: 'low-tmdb',
          title: 'Faible liaison TMDB',
          description: `${withoutTmdb.length} sources ne sont pas liées à TMDB. Cela affecte l'affichage des métadonnées.`,
          severity: 'critical',
          category: 'tmdb',
          affectedItems: withoutTmdb.map(r => r.id),
          fixAction: {
            label: 'Lier à TMDB',
            type: 'link'
          }
        });
      } else if (tmdbPercentage < 70) {
        newDiagnostics.push({
          check: 'Liaison TMDB',
          status: 'warning',
          message: `${Math.round(tmdbPercentage)}% des sources sont liées à TMDB`
        });
        if (withoutTmdb.length > 0) {
          newProblems.push({
            id: 'orphan-readers',
            title: 'Sources orphelines',
            description: `${withoutTmdb.length} sources ne sont pas liées à TMDB.`,
            severity: 'warning',
            category: 'tmdb',
            affectedItems: withoutTmdb.map(r => r.id),
            fixAction: {
              label: 'Lier à TMDB',
              type: 'link'
            }
          });
        }
      } else {
        newDiagnostics.push({
          check: 'Liaison TMDB',
          status: 'ok',
          message: `${Math.round(tmdbPercentage)}% des sources liées à TMDB`
        });
      }

      if (invalidUrlReaders.length > 0) {
        const severity: Severity = invalidUrlReaders.length > 10 ? 'critical' : 'warning';
        newDiagnostics.push({
          check: 'Validation URL',
          status: severity === 'critical' ? 'error' : 'warning',
          message: `${invalidUrlReaders.length} URL(s) invalide(s) détectée(s)`
        });
        newProblems.push({
          id: 'invalid-urls',
          title: 'URLs invalides',
          description: `${invalidUrlReaders.length} source(s) ont des URLs mal formatées ou invalides.`,
          severity,
          category: 'url',
          affectedItems: invalidUrlReaders.map(r => r.id),
          fixAction: {
            label: 'Voir les URLs',
            type: 'custom'
          }
        });
      } else {
        newDiagnostics.push({
          check: 'Validation URL',
          status: 'ok',
          message: 'Toutes les URLs sont valides'
        });
      }

      if (duplicateCount > 0) {
        newDiagnostics.push({
          check: 'Doublons',
          status: 'warning',
          message: `${duplicateCount} entrée(s) en double détectée(s)`
        });
        
        duplicateGroups.forEach((group, key) => {
          newProblems.push({
            id: `duplicate-${key}`,
            title: 'Entrées en double',
            description: `${group.length} sources identiques trouvées pour: ${group[0].label}`,
            severity: 'warning',
            category: 'duplicate',
            affectedItems: group.slice(1).map(r => r.id),
            fixAction: {
              label: 'Supprimer les doublons',
              type: 'delete'
            }
          });
        });
      } else {
        newDiagnostics.push({
          check: 'Doublons',
          status: 'ok',
          message: 'Aucun doublon détecté'
        });
      }

      const tvWithSeasons = readerList.filter(r => 
        (r.media_type === 'tv' || r.media_type === 'series' || r.media_type === 'anime') && 
        r.tmdb_id !== null
      );
      
      const groupedByShow = new Map<number, Reader[]>();
      tvWithSeasons.forEach(r => {
        if (r.tmdb_id) {
          const existing = groupedByShow.get(r.tmdb_id) || [];
          existing.push(r);
          groupedByShow.set(r.tmdb_id, existing);
        }
      });

      let missingEpisodesCount = 0;
      groupedByShow.forEach((showReaders, tmdbId) => {
        const seasons = new Map<number, Set<number>>();
        showReaders.forEach(r => {
          if (r.season_number !== null && r.episode_number !== null) {
            const eps = seasons.get(r.season_number) || new Set();
            eps.add(r.episode_number);
            seasons.set(r.season_number, eps);
          }
        });
        
        seasons.forEach((episodes, season) => {
          const episodeArray = Array.from(episodes).sort((a, b) => a - b);
          if (episodeArray.length > 1) {
            for (let i = 1; i < episodeArray.length; i++) {
              const gap = episodeArray[i] - episodeArray[i-1];
              if (gap > 1) {
                missingEpisodesCount += gap - 1;
              }
            }
          }
        });
      });

      if (missingEpisodesCount > 0) {
        newDiagnostics.push({
          check: 'Épisodes Manquants',
          status: 'info',
          message: `~${missingEpisodesCount} épisode(s) potentiellement manquant(s)`
        });
        newProblems.push({
          id: 'missing-episodes',
          title: 'Épisodes manquants',
          description: `Environ ${missingEpisodesCount} épisodes pourraient manquer dans vos séries.`,
          severity: 'info',
          category: 'episode',
          affectedItems: []
        });
      } else if (tvWithSeasons.length > 0) {
        newDiagnostics.push({
          check: 'Épisodes Manquants',
          status: 'ok',
          message: 'Séquence d\'épisodes cohérente'
        });
      }

      setDiagnostics(newDiagnostics);
      setProblems(newProblems);
      setLastCheck(new Date());

      const historyEntry: HealthHistoryEntry = {
        timestamp: new Date(),
        overallStatus: newProblems.some(p => p.severity === 'critical') 
          ? 'error' 
          : newProblems.some(p => p.severity === 'warning') 
            ? 'warning' 
            : 'ok',
        problemCount: newProblems.length,
        criticalCount: newProblems.filter(p => p.severity === 'critical').length,
        warningCount: newProblems.filter(p => p.severity === 'warning').length,
        infoCount: newProblems.filter(p => p.severity === 'info').length,
        stats: newStats
      };

      setHealthHistory(prev => {
        const updated = [historyEntry, ...prev].slice(0, MAX_HISTORY_ENTRIES);
        return updated;
      });

      const criticalProblems = newProblems.filter(p => p.severity === 'critical');
      if (criticalProblems.length > 0 && autoMonitoring) {
        sendCriticalAlert(criticalProblems);
      }

    } catch (err) {
      console.error('Health check error:', err);
      setDbConnected(false);
      newDiagnostics.push({
        check: 'Système',
        status: 'error',
        message: 'Erreur lors du diagnostic'
      });
      newProblems.push({
        id: 'system-error',
        title: 'Erreur système',
        description: `Une erreur s'est produite: ${err instanceof Error ? err.message : 'Erreur inconnue'}`,
        severity: 'critical',
        category: 'general',
        affectedItems: []
      });
      setDiagnostics(newDiagnostics);
      setProblems(newProblems);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [autoMonitoring, sendCriticalAlert]);

  useEffect(() => {
    runHealthCheck();
  }, []);

  useEffect(() => {
    if (autoMonitoring) {
      autoRefreshRef.current = setInterval(() => {
        runHealthCheck();
      }, AUTO_REFRESH_INTERVAL);
    } else {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
        autoRefreshRef.current = null;
      }
    }

    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
      }
    };
  }, [autoMonitoring, runHealthCheck]);

  const handleBatchFix = async (type: 'enable' | 'disable' | 'delete') => {
    if (selectedProblems.size === 0) return;
    
    setFixing(true);
    try {
      const selectedProblemsList = problems.filter(p => selectedProblems.has(p.id));
      const affectedIds = new Set<string>();
      selectedProblemsList.forEach(p => p.affectedItems.forEach(id => affectedIds.add(id)));

      if (type === 'enable') {
        await supabase
          .from('readers')
          .update({ enabled: true })
          .in('id', Array.from(affectedIds));
      } else if (type === 'disable') {
        await supabase
          .from('readers')
          .update({ enabled: false })
          .in('id', Array.from(affectedIds));
      } else if (type === 'delete') {
        await supabase
          .from('readers')
          .delete()
          .in('id', Array.from(affectedIds));
      }

      setSelectedProblems(new Set());
      await runHealthCheck();
    } catch (err) {
      console.error('Batch fix error:', err);
    } finally {
      setFixing(false);
    }
  };

  const handleQuickFix = async (problem: Problem) => {
    if (!problem.fixAction) return;
    
    setFixing(true);
    try {
      if (problem.fixAction.type === 'enable') {
        await supabase
          .from('readers')
          .update({ enabled: true })
          .in('id', problem.affectedItems);
      } else if (problem.fixAction.type === 'delete') {
        await supabase
          .from('readers')
          .delete()
          .in('id', problem.affectedItems);
      } else if (problem.fixAction.type === 'disable') {
        await supabase
          .from('readers')
          .update({ enabled: false })
          .in('id', problem.affectedItems);
      }

      await runHealthCheck();
    } catch (err) {
      console.error('Quick fix error:', err);
    } finally {
      setFixing(false);
    }
  };

  const exportHealthReport = () => {
    const report = {
      exportDate: new Date().toISOString(),
      lastCheck: lastCheck?.toISOString(),
      overallStatus: problems.some(p => p.severity === 'critical') 
        ? 'critical' 
        : problems.some(p => p.severity === 'warning') 
          ? 'warning' 
          : 'healthy',
      stats,
      diagnostics,
      problems: problems.map(p => ({
        ...p,
        fixAction: p.fixAction ? { label: p.fixAction.label, type: p.fixAction.type } : undefined
      })),
      history: healthHistory.slice(0, 10).map(h => ({
        timestamp: h.timestamp.toISOString(),
        status: h.overallStatus,
        problemCount: h.problemCount
      }))
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cstream-health-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: 'ok' | 'warning' | 'error') => {
    switch (status) {
      case 'ok':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: 'ok' | 'warning' | 'error') => {
    switch (status) {
      case 'ok':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'error':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
    }
  };

  const get24hSummary = () => {
    const now = new Date();
    const last24h = healthHistory.filter(h => 
      now.getTime() - h.timestamp.getTime() < 24 * 60 * 60 * 1000
    );
    
    if (last24h.length < 2) return null;

    const first = last24h[last24h.length - 1];
    const last = last24h[0];
    
    const problemTrend = last.problemCount - first.problemCount;
    const criticalTrend = last.criticalCount - first.criticalCount;

    return {
      checksCount: last24h.length,
      avgProblems: Math.round(last24h.reduce((a, b) => a + b.problemCount, 0) / last24h.length),
      problemTrend,
      criticalTrend,
      worstStatus: last24h.some(h => h.overallStatus === 'error') 
        ? 'error' 
        : last24h.some(h => h.overallStatus === 'warning') 
          ? 'warning' 
          : 'ok'
    };
  };

  const overallStatus = problems.some(p => p.severity === 'critical') 
    ? 'error' 
    : problems.some(p => p.severity === 'warning') 
      ? 'warning' 
      : 'ok';

  const criticalCount = problems.filter(p => p.severity === 'critical').length;
  const warningCount = problems.filter(p => p.severity === 'warning').length;
  const infoCount = problems.filter(p => p.severity === 'info').length;
  const summary24h = get24hSummary();

  if (loading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2">Analyse en cours...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="w-5 h-5" />
            Santé du Site
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={getStatusColor(overallStatus)}>
              {getStatusIcon(overallStatus)}
              <span className="ml-1">
                {overallStatus === 'ok' ? 'Sain' : overallStatus === 'warning' ? 'Attention' : 'Critique'}
              </span>
            </Badge>
            
            <div className="flex items-center gap-2 text-sm">
              <Switch
                checked={autoMonitoring}
                onCheckedChange={setAutoMonitoring}
                id="auto-monitor"
              />
              <label htmlFor="auto-monitor" className="text-muted-foreground cursor-pointer">
                Auto
              </label>
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => runHealthCheck()}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              Rafraîchir
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={exportHealthReport}
            >
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {lastCheck && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Dernière vérification: {lastCheck.toLocaleTimeString('fr-FR')}
              </span>
            )}
            {autoMonitoring && (
              <span className="flex items-center gap-1 text-primary">
                <Zap className="w-3 h-3" />
                Auto-refresh: 5 min
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {criticalCount} critique{criticalCount > 1 ? 's' : ''}
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-500">
                {warningCount} attention
              </Badge>
            )}
            {infoCount > 0 && (
              <Badge variant="outline" className="text-xs border-blue-500 text-blue-500">
                {infoCount} info
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">
              <Eye className="w-4 h-4 mr-1 hidden sm:inline" />
              Aperçu
            </TabsTrigger>
            <TabsTrigger value="problems" className="text-xs sm:text-sm">
              <AlertTriangle className="w-4 h-4 mr-1 hidden sm:inline" />
              Problèmes
              {problems.length > 0 && (
                <Badge className="ml-1 text-xs" variant="destructive">
                  {problems.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sources" className="text-xs sm:text-sm">
              <Settings className="w-4 h-4 mr-1 hidden sm:inline" />
              Sources
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm">
              <History className="w-4 h-4 mr-1 hidden sm:inline" />
              Historique
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            {summary24h && (
              <div className="p-4 bg-secondary/20 rounded-lg">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Résumé des dernières 24h
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{summary24h.checksCount}</p>
                    <p className="text-xs text-muted-foreground">Vérifications</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{summary24h.avgProblems}</p>
                    <p className="text-xs text-muted-foreground">Moy. Problèmes</p>
                  </div>
                  <div className="text-center flex flex-col items-center">
                    <div className="flex items-center gap-1">
                      <span className="text-2xl font-bold">{Math.abs(summary24h.problemTrend)}</span>
                      {summary24h.problemTrend > 0 ? (
                        <TrendingUp className="w-4 h-4 text-red-500" />
                      ) : summary24h.problemTrend < 0 ? (
                        <TrendingDown className="w-4 h-4 text-green-500" />
                      ) : (
                        <Minus className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Tendance</p>
                  </div>
                  <div className="text-center">
                    <Badge className={getStatusColor(summary24h.worstStatus)}>
                      {summary24h.worstStatus === 'ok' ? 'Stable' : summary24h.worstStatus === 'warning' ? 'Attention' : 'Critique'}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">Pire état</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {diagnostics.map((d, i) => (
                <div 
                  key={i} 
                  className={`flex items-center gap-2 p-2 rounded-md border ${getStatusColor(d.status)}`}
                >
                  {getStatusIcon(d.status)}
                  <span className="font-medium">{d.check}:</span>
                  <span className="text-sm">{d.message}</span>
                </div>
              ))}
            </div>

            {stats && (
              <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between">
                    <span>Statistiques détaillées</span>
                    {detailsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-secondary/30 rounded-lg text-center">
                      <p className="text-2xl font-bold">{stats.totalReaders}</p>
                      <p className="text-xs text-muted-foreground">Total Sources</p>
                    </div>
                    <div className="p-3 bg-green-500/10 rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-500">{stats.enabledReaders}</p>
                      <p className="text-xs text-muted-foreground">Actives</p>
                    </div>
                    <div className="p-3 bg-red-500/10 rounded-lg text-center">
                      <p className="text-2xl font-bold text-red-500">{stats.disabledReaders}</p>
                      <p className="text-xs text-muted-foreground">Désactivées</p>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-lg text-center">
                      <p className="text-2xl font-bold text-blue-500">{stats.readersWithTmdb}</p>
                      <p className="text-xs text-muted-foreground">Liées TMDB</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-secondary/30 rounded-lg flex items-center gap-2">
                      <Film className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="font-bold">{stats.movieReaders}</p>
                        <p className="text-xs text-muted-foreground">Films</p>
                      </div>
                    </div>
                    <div className="p-3 bg-secondary/30 rounded-lg flex items-center gap-2">
                      <Tv className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="font-bold">{stats.tvReaders}</p>
                        <p className="text-xs text-muted-foreground">Séries</p>
                      </div>
                    </div>
                    <div className="p-3 bg-secondary/30 rounded-lg flex items-center gap-2">
                      <Star className="w-5 h-5 text-pink-500" />
                      <div>
                        <p className="font-bold">{stats.animeReaders}</p>
                        <p className="text-xs text-muted-foreground">Anime</p>
                      </div>
                    </div>
                  </div>

                  {Object.keys(stats.languageBreakdown).length > 0 && (
                    <div className="p-3 bg-secondary/20 rounded-lg">
                      <p className="text-sm font-medium mb-2 flex items-center gap-1">
                        <Globe className="w-4 h-4" /> Langues
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(stats.languageBreakdown)
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 10)
                          .map(([lang, count]) => (
                            <Badge key={lang} variant="secondary">
                              {lang.toUpperCase()}: {count}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            )}
          </TabsContent>

          <TabsContent value="problems" className="mt-4 space-y-4">
            {problems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
                <p className="font-medium">Aucun problème détecté</p>
                <p className="text-sm">Votre site est en bonne santé !</p>
              </div>
            ) : (
              <>
                {selectedProblems.size > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg">
                    <span className="text-sm">{selectedProblems.size} problème(s) sélectionné(s)</span>
                    <div className="flex-1" />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBatchFix('enable')}
                      disabled={fixing}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Activer
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBatchFix('delete')}
                      disabled={fixing}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Supprimer
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedProblems(new Set())}
                    >
                      Annuler
                    </Button>
                  </div>
                )}

                <Collapsible open={problemsExpanded} onOpenChange={setProblemsExpanded}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-between">
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Problèmes Détectés ({problems.length})
                      </span>
                      {problemsExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-2">
                    {['critical', 'warning', 'info'].map(severity => {
                      const severityProblems = problems.filter(p => p.severity === severity);
                      if (severityProblems.length === 0) return null;
                      
                      return (
                        <div key={severity} className="space-y-2">
                          <h4 className="text-sm font-medium flex items-center gap-2">
                            {getSeverityIcon(severity as Severity)}
                            {severity === 'critical' ? 'Critique' : severity === 'warning' ? 'Attention' : 'Information'}
                            <Badge variant="outline" className="text-xs">
                              {severityProblems.length}
                            </Badge>
                          </h4>
                          
                          {severityProblems.map(problem => (
                            <div 
                              key={problem.id}
                              className={`p-3 rounded-lg border ${getSeverityColor(problem.severity)} flex items-start gap-3`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedProblems.has(problem.id)}
                                onChange={(e) => {
                                  const newSelected = new Set(selectedProblems);
                                  if (e.target.checked) {
                                    newSelected.add(problem.id);
                                  } else {
                                    newSelected.delete(problem.id);
                                  }
                                  setSelectedProblems(newSelected);
                                }}
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  {getSeverityIcon(problem.severity)}
                                  <span className="font-medium">{problem.title}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {problem.category}
                                  </Badge>
                                </div>
                                <p className="text-sm mt-1 opacity-80">{problem.description}</p>
                                {problem.affectedItems.length > 0 && (
                                  <p className="text-xs mt-1 opacity-60">
                                    {problem.affectedItems.length} élément(s) affecté(s)
                                  </p>
                                )}
                              </div>
                              {problem.fixAction && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleQuickFix(problem)}
                                  disabled={fixing || problem.fixAction.type === 'link' || problem.fixAction.type === 'custom'}
                                  className="shrink-0"
                                >
                                  <Wrench className="w-4 h-4 mr-1" />
                                  {problem.fixAction.label}
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              </>
            )}
          </TabsContent>

          <TabsContent value="sources" className="mt-4 space-y-4">
            {stats && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Sources actives</span>
                      <span className="font-medium">{stats.enabledReaders}/{stats.totalReaders}</span>
                    </div>
                    <Progress 
                      value={stats.totalReaders > 0 ? (stats.enabledReaders / stats.totalReaders) * 100 : 0} 
                      className="h-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Liaison TMDB</span>
                      <span className="font-medium">{stats.readersWithTmdb}/{stats.totalReaders}</span>
                    </div>
                    <Progress 
                      value={stats.totalReaders > 0 ? (stats.readersWithTmdb / stats.totalReaders) * 100 : 0} 
                      className="h-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 bg-blue-500/10 rounded-lg text-center">
                    <Film className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                    <p className="text-2xl font-bold">{stats.movieReaders}</p>
                    <p className="text-xs text-muted-foreground">Films</p>
                  </div>
                  <div className="p-4 bg-green-500/10 rounded-lg text-center">
                    <Tv className="w-6 h-6 mx-auto mb-2 text-green-500" />
                    <p className="text-2xl font-bold">{stats.tvReaders}</p>
                    <p className="text-xs text-muted-foreground">Séries</p>
                  </div>
                  <div className="p-4 bg-pink-500/10 rounded-lg text-center">
                    <Star className="w-6 h-6 mx-auto mb-2 text-pink-500" />
                    <p className="text-2xl font-bold">{stats.animeReaders}</p>
                    <p className="text-xs text-muted-foreground">Anime</p>
                  </div>
                </div>

                {stats.invalidUrls > 0 && (
                  <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="font-medium text-red-500">{stats.invalidUrls} URL(s) invalide(s)</span>
                    </div>
                  </div>
                )}

                {stats.duplicates > 0 && (
                  <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <div className="flex items-center gap-2">
                      <Copy className="w-4 h-4 text-yellow-500" />
                      <span className="font-medium text-yellow-500">{stats.duplicates} doublon(s) détecté(s)</span>
                    </div>
                  </div>
                )}

                {Object.keys(stats.languageBreakdown).length > 0 && (
                  <div className="p-4 bg-secondary/20 rounded-lg">
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Répartition par langue
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(stats.languageBreakdown)
                        .sort((a, b) => b[1] - a[1])
                        .map(([lang, count]) => (
                          <div key={lang} className="flex items-center gap-2">
                            <span className="w-12 text-xs font-medium">{lang.toUpperCase()}</span>
                            <Progress 
                              value={(count / stats.totalReaders) * 100} 
                              className="flex-1 h-2"
                            />
                            <span className="w-8 text-xs text-right">{count}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {Object.keys(stats.seasonBreakdown).length > 0 && (
                  <div className="p-4 bg-secondary/20 rounded-lg">
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Tv className="w-4 h-4" />
                      Répartition par saison
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(stats.seasonBreakdown)
                        .sort((a, b) => {
                          const numA = parseInt(a[0].replace('S', ''));
                          const numB = parseInt(b[0].replace('S', ''));
                          return numA - numB;
                        })
                        .map(([season, count]) => (
                          <Badge key={season} variant="secondary">
                            {season}: {count}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4 space-y-4">
            {healthHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Aucun historique</p>
                <p className="text-sm">L'historique apparaîtra après plusieurs vérifications</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {healthHistory.map((entry, i) => (
                  <div 
                    key={i}
                    className={`p-3 rounded-lg border ${getStatusColor(entry.overallStatus)} flex items-center gap-3`}
                  >
                    {getStatusIcon(entry.overallStatus)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {entry.timestamp.toLocaleDateString('fr-FR')} {entry.timestamp.toLocaleTimeString('fr-FR')}
                        </span>
                        {entry.criticalCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {entry.criticalCount} critique
                          </Badge>
                        )}
                        {entry.warningCount > 0 && (
                          <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-500">
                            {entry.warningCount} attention
                          </Badge>
                        )}
                      </div>
                      {entry.stats && (
                        <p className="text-xs opacity-70 mt-1">
                          {entry.stats.totalReaders} sources • {entry.stats.enabledReaders} actives • {entry.problemCount} problème(s)
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
});

SiteHealth.displayName = 'SiteHealth';

export { SiteHealth };
