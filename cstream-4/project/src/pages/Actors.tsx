import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { tmdbApi, TMDBPerson } from '@/lib/tmdb';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Users, User, ChevronRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

// SVG Star Component for hero
const HeroStars = () => (
  <svg className="absolute w-full h-full" viewBox="0 0 1200 400" preserveAspectRatio="none">
    {[...Array(12)].map((_, i) => (
      <motion.circle
        key={i}
        cx={Math.random() * 1200}
        cy={Math.random() * 400}
        r={1.5}
        fill="white"
        opacity={0.6}
        animate={{ opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 3 + i * 0.5, repeat: Infinity }}
      />
    ))}
  </svg>
);

const Actors = () => {
  const [people, setPeople] = useState<TMDBPerson[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPeople(1);
  }, []);

  const fetchPeople = async (pageNum: number) => {
    setLoading(true);
    try {
      const data = await tmdbApi.getPopularPeople(pageNum) as unknown as any;

      if (pageNum === 1) {
        setPeople(data.results || []);
      } else {
        setPeople(prev => [...prev, ...(data.results || [])]);
      }
      setHasMore(pageNum < (data.total_pages || 1));
    } catch (error) {
      console.error('Failed to fetch people:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPeople(nextPage);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Premium Hero Section */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 via-background to-blue-600/20" />
        <HeroStars />

        {/* Glow elements */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl" />

        <div className="relative container mx-auto px-4 text-center z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-6 flex justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/50 to-blue-500/50 blur-2xl opacity-70 rounded-full" />
              <Users className="w-24 h-24 text-white relative z-10" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent"
          >
            Acteurs & Célébrités
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed"
          >
            Découvrez les plus grandes stars du cinéma et de la télévision mondiale
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex items-center justify-center gap-2 text-sm text-gray-400 font-semibold"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            {people.length > 0 && `${people.length}+ acteurs disponibles`}
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {loading && page === 1 ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {people.map((person) => (
                  <motion.div
                    key={person.id}
                    whileHover={{ y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link to={`/person/${person.id}`} className="group block">
                      <div className="relative aspect-square rounded-full overflow-hidden bg-secondary mx-auto w-32 h-32 md:w-40 md:h-40">
                        {person.profile_path ? (
                          <img
                            src={tmdbApi.getImageUrl(person.profile_path, 'w500')}
                            alt={person.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-12 h-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="mt-4 text-center">
                        <h3 className="font-medium group-hover:text-primary transition-colors">
                          {person.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {person.known_for_department}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {hasMore && (
                <div className="flex justify-center mt-12">
                  <Button
                    onClick={loadMore}
                    disabled={loading}
                    size="lg"
                    variant="outline"
                  >
                    {loading ? 'Chargement...' : 'Charger plus'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Actors;
