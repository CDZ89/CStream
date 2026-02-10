
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Calendar, Filter, Search, Play, Star, Clock, ChevronRight, Sparkles, Plus, Info } from 'lucide-react';
import { MediaCard } from '@/components/media/MediaCard';
import { getTrending, searchMulti } from '@/services/tmdb';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function PlanningPage() {
  const [trending, setTrending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const data = await getTrending('all', 'day');
        setTrending(data.results || []);
      } catch (error) {
        console.error('Error fetching trending:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length > 2) {
      try {
        const results = await searchMulti(query);
        setSearchResults(results.results || []);
      } catch (error) {
        console.error('Search error:', error);
      }
    } else {
      setSearchResults([]);
    }
  };

  return (
    <div className="min-h-screen bg-[#020205] text-white pb-20">
      {/* Hero Section */}
      <div className="relative h-[40vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-[#020205]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              <span className="text-xs font-black uppercase tracking-[0.4em] text-primary">Découverte Premium</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter">
              TRENDING <span className="text-primary">&</span> PLANNING
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base font-medium uppercase tracking-widest opacity-60">
              Explorez les dernières tendances et planifiez vos prochaines sessions de streaming.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-10 relative z-10">
        <Tabs defaultValue="trending" className="w-full" onValueChange={setActiveTab}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
            <TabsList className="bg-white/5 border border-white/10 p-1 rounded-2xl h-14">
              <TabsTrigger value="trending" className="rounded-xl px-8 h-full data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[10px]">
                <TrendingUp className="w-4 h-4 mr-2" />
                Tendances
              </TabsTrigger>
              <TabsTrigger value="planning" className="rounded-xl px-8 h-full data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[10px]">
                <Calendar className="w-4 h-4 mr-2" />
                Planning
              </TabsTrigger>
            </TabsList>

            <div className="relative w-full md:w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Rechercher un film, une série..."
                className="h-14 pl-12 rounded-2xl bg-white/5 border-white/10 focus:border-primary focus:ring-primary/20 transition-all font-bold text-sm"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>

          <TabsContent value="trending" className="mt-0">
            {searchQuery.length > 2 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {searchResults.map((item) => (
                  <MediaCard
                    key={item.id}
                    tmdbId={item.id}
                    title={item.title || item.name}
                    poster={item.poster_path}
                    year={item.release_date?.split('-')[0] || item.first_air_date?.split('-')[0]}
                    score={item.vote_average}
                    type={item.media_type as any}
                    className="w-full max-w-none"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-12">
                <section>
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                      <div className="w-2 h-8 bg-primary rounded-full" />
                      En ce moment
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {trending.map((item) => (
                      <MediaCard
                        key={item.id}
                        tmdbId={item.id}
                        title={item.title || item.name}
                        poster={item.poster_path}
                        year={item.release_date?.split('-')[0] || item.first_air_date?.split('-')[0]}
                        score={item.vote_average}
                        type={item.media_type as any}
                        className="w-full max-w-none"
                      />
                    ))}
                  </div>
                </section>
              </div>
            )}
          </TabsContent>

          <TabsContent value="planning" className="mt-0">
             <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 bg-white/[0.02] border border-dashed border-white/10 rounded-[3rem]">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                  <Clock className="w-10 h-10 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black uppercase tracking-tighter">Votre Planning est vide</h3>
                  <p className="text-gray-500 max-w-sm mx-auto font-medium">Connectez-vous pour commencer à planifier vos futures soirées cinéma et ne plus rien manquer.</p>
                </div>
                <Button className="rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-xs" onClick={() => window.location.href='/auth'}>
                  Se Connecter
                </Button>
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
