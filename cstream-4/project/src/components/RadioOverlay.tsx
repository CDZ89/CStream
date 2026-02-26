import { useState, useEffect, useRef } from 'react';
import { useRadioAudio } from '@/hooks/useRadioAudio';
import { Play, Pause, X, Volume2, Heart, Shuffle, Repeat, Share2, SkipForward, SkipBack, Minimize2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function RadioOverlay() {
  const { state, play, pause, stop, toggle, setVolume, stations, seek, setRepeatMode, toggleShuffle } = useRadioAudio();
  const [visible, setVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkOverlay = () => {
      const show = localStorage.getItem('radio.overlay') === '1';
      const isVisible = show || (state.url !== '' && state.playing);
      setVisible(isVisible);
    };

    checkOverlay();
    window.addEventListener('storage', checkOverlay);
    const interval = setInterval(checkOverlay, 500);

    return () => {
      window.removeEventListener('storage', checkOverlay);
      clearInterval(interval);
    };
  }, [state.url, state.playing]);

  useEffect(() => {
    // Auto-minimize on page change (simulated by checking visibility or interaction)
    const handleRouteChange = () => {
      if (window.location.pathname !== '/radio') {
        setIsMinimized(true);
      } else {
        setIsMinimized(false);
      }
    };
    handleRouteChange();
    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  useEffect(() => {
    const favs = JSON.parse(localStorage.getItem('radio.favs') || '[]');
    setIsFavorite(favs.includes(state.url));
  }, [state.url]);

  const toggleFav = () => {
    const favs = JSON.parse(localStorage.getItem('radio.favs') || '[]');
    const next = isFavorite 
      ? favs.filter((u: string) => u !== state.url)
      : [...favs, state.url];
    localStorage.setItem('radio.favs', JSON.stringify(next));
    setIsFavorite(!isFavorite);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const cycleRepeat = () => {
    const modes: ('none' | 'all' | 'one')[] = ['none', 'all', 'one'];
    const currentIdx = modes.indexOf(state.repeatMode);
    const nextMode = modes[(currentIdx + 1) % modes.length];
    setRepeatMode(nextMode);
  };

  const closeOverlay = () => {
    localStorage.removeItem('radio.overlay');
    stop();
    setVisible(false);
    window.dispatchEvent(new Event('storage'));
  };

  const currentStation = stations.find(s => s.url === state.url);
  const isMusic = currentStation ? currentStation.genre !== 'Radio' : true;

  if (!visible || !state.url) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100, x: '-50%', scale: 0.9 }}
        animate={{ 
          opacity: 1, 
          y: 0, 
          x: isMinimized ? 'calc(50vw - 180px)' : '-50%', 
          scale: 1,
          width: isMinimized ? '320px' : '480px',
          bottom: isMinimized ? '24px' : '32px'
        }}
        exit={{ opacity: 0, y: 100, x: '-50%', scale: 0.9 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        className="fixed left-1/2 z-[2147483647]"
        style={{ pointerEvents: 'auto' }}
      >
        <div 
          ref={containerRef} 
          className="relative rounded-[28px] p-4 bg-white/[0.03] backdrop-blur-[40px] border border-white/10 shadow-[0_32px_80px_-16px_rgba(0,0,0,0.6)] overflow-hidden group"
        >
          {/* Subtle Glass Highlights */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent pointer-events-none" />
          <div className="absolute -inset-[100%] bg-[conic-gradient(from_0deg,transparent_0deg,white/5_180deg,transparent_360deg)] opacity-20 pointer-events-none animate-[spin_8s_linear_infinite]" />
          
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <motion.div 
                animate={{ rotate: state.playing ? 360 : 0 }}
                transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
                className="w-14 h-14 rounded-2xl bg-zinc-900/50 flex items-center justify-center border border-white/10 overflow-hidden shadow-2xl shrink-0 relative"
              >
                {state.logo ? (
                  <img src={state.logo} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-3 h-3 rounded-full bg-primary/80 animate-pulse shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" />
                )}
                {state.playing && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="flex gap-0.5 items-end h-3">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          animate={{ height: ['20%', '100%', '20%'] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.2 }}
                          className="w-0.5 bg-primary"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/80 drop-shadow-sm">
                    {isMusic ? 'Now Playing' : 'Live Broadcast'}
                  </span>
                </div>
                <h4 className="text-sm font-black text-white truncate leading-tight tracking-wide uppercase italic">
                  {state.title}
                </h4>
                <p className="text-[10px] text-white/40 font-medium truncate uppercase tracking-widest">
                  {currentStation?.genre || 'CStream Radio'}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setIsMinimized(!isMinimized)} 
                  className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button 
                  onClick={closeOverlay} 
                  className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all active:scale-90"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4 pt-1"
              >
                {state.duration > 0 && (
                  <div className="space-y-2">
                    <div 
                      className="relative h-1.5 bg-white/5 rounded-full overflow-hidden cursor-pointer group/progress" 
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const percent = (e.clientX - rect.left) / rect.width;
                        seek(percent * state.duration);
                      }}
                    >
                      <motion.div 
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary/80 to-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.6)]"
                        style={{ width: `${(state.currentTime / state.duration) * 100}%` }}
                      />
                      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/progress:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-white/30 tabular-nums tracking-tighter">
                      <span>{formatTime(state.currentTime)}</span>
                      <span>{formatTime(state.duration)}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/5">
                      <button className="w-9 h-9 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all active:scale-90">
                        <SkipBack className="w-4 h-4 fill-current" />
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={toggle}
                        className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-[0_8px_20px_-4px_rgba(var(--primary-rgb),0.4)] hover:shadow-[0_12px_24px_-4px_rgba(var(--primary-rgb),0.5)] transition-all"
                      >
                        {state.playing ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                      </motion.button>
                      <button className="w-9 h-9 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all active:scale-90">
                        <SkipForward className="w-4 h-4 fill-current" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5">
                      <button onClick={toggleShuffle} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 ${state.isShuffle ? 'text-primary bg-primary/10' : 'text-white/30 hover:text-white'}`}>
                        <Shuffle className="w-4 h-4" />
                      </button>
                      <button onClick={cycleRepeat} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 ${state.repeatMode !== 'none' ? 'text-primary bg-primary/10' : 'text-white/30 hover:text-white'}`}>
                        <Repeat className="w-4 h-4" />
                      </button>
                      <button onClick={toggleFav} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 ${isFavorite ? 'text-red-500 bg-red-500/10' : 'text-white/30 hover:text-white'}`}>
                        <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-1 max-w-[110px] bg-white/5 px-3 py-2.5 rounded-2xl border border-white/5 group/vol">
                    <Volume2 className="w-4 h-4 text-white/20 group-hover/vol:text-primary transition-colors" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={state.volume}
                      onChange={e => setVolume(parseFloat(e.target.value))}
                      className="flex-1 h-1 bg-white/10 rounded-full accent-primary cursor-pointer appearance-none"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {isMinimized && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between gap-4 mt-1"
              >
                <div className="flex items-center gap-2">
                  <button onClick={toggle} className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform">
                    {state.playing ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                  </button>
                  <div className="text-[10px] font-black text-white/40 tabular-nums tracking-tighter">
                    {formatTime(state.currentTime)}
                  </div>
                </div>
                <div className="h-0.5 flex-1 bg-white/5 rounded-full overflow-hidden">
                   <motion.div 
                    className="h-full bg-primary/60"
                    style={{ width: `${(state.currentTime / (state.duration || 1)) * 100}%` }}
                  />
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
