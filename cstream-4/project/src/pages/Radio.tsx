import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRadioAudio } from '@/hooks/useRadioAudio';
import { useAuth } from '@/hooks/useAuth';
import { Heart, Play, Pause, Radio as RadioIcon, ArrowLeft, Volume2, Music2, MessageCircle, X, Users, Search, Edit2, Save, Share2, Globe, Lock, Upload, Folder, FileArchive, Image as ImageIcon, SkipBack, SkipForward, Repeat, Shuffle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import JSZip from 'jszip';
import type { JSZipObject } from 'jszip';

export default function Radio() {
  const navigate = useNavigate();
  const { state, play, pause, toggle, stations, setVolume, seek } = useRadioAudio();
  const { user, profile } = useAuth();
  const [favorites, setFavorites] = useState<string[]>(() =>
    JSON.parse(localStorage.getItem('radio.favs') || '[]')
  );
  const [activeTab, setActiveTab] = useState<'all' | 'radio' | 'music' | 'favs'>('all');
  const [chatOpen, setChatOpen] = useState(false);
  const [localSongs, setLocalSongs] = useState<{title: string, url: string, logo?: string, language?: string, isPublic?: boolean, type?: string, genre?: string, owner?: string, playlist?: string}[]>(() => 
    JSON.parse(localStorage.getItem('radio.local') || '[]')
  );
  const [importOverlayOpen, setImportOverlayOpen] = useState(false);
  const [importData, setImportData] = useState({ title: '', url: '', logo: '', type: 'mp3', language: 'FR', isPublic: true, playlistName: '' });
  const [chatMessages, setChatMessages] = useState<{text: string, me: boolean, username?: string, avatar?: string, badge?: string, timestamp: number}[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('radio.chat') || '[]');
    } catch {
      return [];
    }
  });
  const [chatInput, setChatInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSong, setEditingSong] = useState<{idx: number, title: string, logo?: string, isPublic: boolean} | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const chatBoxRef = useRef<HTMLDivElement>(null);

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getUsername = () => {
    if (profile?.username) return profile.username;
    let guestId = localStorage.getItem('radio.guestId');
    if (!guestId) {
      const allSongs = JSON.parse(localStorage.getItem('radio.local') || '[]');
      const guests = allSongs.filter((s: any) => s.owner?.startsWith('Invité')).map((s: any) => parseInt(s.owner.replace('Invité', '')) || 0);
      const nextId = guests.length > 0 ? Math.max(0, ...guests) + 1 : 1;
      guestId = `Invité${nextId}`;
      localStorage.setItem('radio.guestId', guestId);
    }
    return guestId;
  };

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'radio.chat') {
        try {
          setChatMessages(JSON.parse(e.newValue || '[]'));
        } catch {}
      }
      if (e.key === 'radio.local') {
        try {
          setLocalSongs(JSON.parse(e.newValue || '[]'));
        } catch {}
      }
      if (e.key === 'radio.overlay') {
        // Force refresh state for overlay if needed
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleImport = () => {
    const username = getUsername();
    const newSong = { 
      title: importData.title || 'Imported ' + importData.type, 
      url: importData.url, 
      logo: importData.logo || undefined,
      language: importData.language,
      isPublic: importData.isPublic,
      type: importData.type,
      genre: 'Music',
      owner: username,
      playlist: importData.playlistName || undefined
    };
    const updated = [...localSongs, newSong];
    setLocalSongs(updated);
    localStorage.setItem('radio.local', JSON.stringify(updated));
    setImportOverlayOpen(false);
    setImportData({ title: '', url: '', logo: '', type: 'mp3', language: 'FR', isPublic: true, playlistName: '' });
    
    play(newSong.url, newSong.title, newSong.logo);
    localStorage.setItem('radio.overlay', '1');
    window.dispatchEvent(new Event('storage'));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.mp3')) {
      setIsImporting(true);
      setUploadProgress(20);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImportData(prev => ({ 
          ...prev, 
          url: event.target?.result as string, 
          title: file.name.replace(/\.[^/.]+$/, ""),
        }));
        setUploadProgress(100);
        setTimeout(() => setIsImporting(false), 500);
      };
      reader.readAsDataURL(file);
    } else if (file.name.endsWith('.zip')) {
      setIsImporting(true);
      setUploadProgress(10);
      try {
        const zip = await JSZip.loadAsync(file);
        const songs: any[] = [];
        const images: Record<string, string> = {};
        const filesCount = Object.keys(zip.files).length;
        let processed = 0;

        for (const [path, zipFile] of Object.entries(zip.files)) {
          const zf = zipFile as JSZipObject;
          if (zf.dir) continue;
          if (path.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            const blob = await zf.async('blob');
            images[path] = await new Promise(r => {
              const rd = new FileReader();
              rd.onload = () => r(rd.result as string);
              rd.readAsDataURL(blob);
            });
          }
        }

        for (const [path, zipFile] of Object.entries(zip.files)) {
          const zf = zipFile as JSZipObject;
          if (zf.dir || !path.endsWith('.mp3')) continue;
          const blob = await zf.async('blob');
          const url = await new Promise<string>(r => {
            const rd = new FileReader();
            rd.onload = () => r(rd.result as string);
            rd.readAsDataURL(blob);
          });

          const folder = path.split('/').slice(0, -1).join('/');
          const folderImage = Object.keys(images).find(img => img.startsWith(folder));

          songs.push({
            title: path.split('/').pop()?.replace('.mp3', '') || 'Song',
            url,
            logo: images[folderImage || ''] || importData.logo || undefined,
            language: importData.language,
            isPublic: importData.isPublic,
            type: 'mp3',
            genre: 'Music',
            owner: getUsername(),
            playlist: importData.playlistName || file.name.replace('.zip', '')
          });
          processed++;
          setUploadProgress(10 + (processed / filesCount * 90));
        }
        setImportPreview(songs);
      } catch (err) {
        console.error('ZIP Error:', err);
      } finally {
        setTimeout(() => setIsImporting(false), 500);
      }
    }
  };

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsImporting(true);
    setUploadProgress(10);
    const songs: any[] = [];
    const images: Record<string, string> = {};
    const playlistName = importData.playlistName || files[0].webkitRelativePath.split('/')[0] || 'Ma Playlist';

    try {
      for (let i = 0; i < files.length; i++) {
        if (files[i].type.startsWith('image/')) {
          const url = await new Promise<string>((resolve) => {
            const rd = new FileReader();
            rd.onload = () => resolve(rd.result as string);
            rd.readAsDataURL(files[i]);
          });
          images[files[i].webkitRelativePath] = url;
        }
      }

      for (let i = 0; i < files.length; i++) {
        if (files[i].type === 'audio/mpeg' || files[i].name.toLowerCase().endsWith('.mp3')) {
          const url = await new Promise<string>((resolve) => {
            const rd = new FileReader();
            rd.onload = () => resolve(rd.result as string);
            rd.readAsDataURL(files[i]);
          });

          const path = files[i].webkitRelativePath;
          const folderParts = path.split('/');
          const folder = folderParts.slice(0, -1).join('/');
          const folderImage = Object.keys(images).find(img => img.startsWith(folder));

          songs.push({
            title: files[i].name.replace(/\.[^/.]+$/, ""),
            url,
            logo: folderImage ? images[folderImage] : (importData.logo || undefined),
            language: importData.language,
            isPublic: importData.isPublic,
            type: 'mp3',
            genre: 'Music',
            owner: getUsername(),
            playlist: playlistName
          });
          setUploadProgress(10 + (i / files.length * 90));
        }
      }
      setImportPreview(songs);
    } catch (err) {
      console.error('Folder Import Error:', err);
    } finally {
      setUploadProgress(100);
      setTimeout(() => setIsImporting(false), 500);
    }
  };

  const confirmImport = () => {
    if (importPreview.length === 0) return;
    const updated = [...localSongs, ...importPreview];
    setLocalSongs(updated);
    localStorage.setItem('radio.local', JSON.stringify(updated));
    
    // Auto-play first song and show overlay
    const first = importPreview[0];
    play(first.url, first.title, first.logo);
    localStorage.setItem('radio.overlay', '1');
    window.dispatchEvent(new Event('storage'));
    
    setImportPreview([]);
    setImportOverlayOpen(false);
  };

  const deleteSong = (idx: number) => {
    const updated = localSongs.filter((_, i) => i !== idx);
    setLocalSongs(updated);
    localStorage.setItem('radio.local', JSON.stringify(updated));
  };

  const saveEdit = () => {
    if (editingSong === null) return;
    const updated = [...localSongs];
    updated[editingSong.idx] = {
      ...updated[editingSong.idx],
      title: editingSong.title,
      logo: editingSong.logo,
      isPublic: editingSong.isPublic
    };
    setLocalSongs(updated);
    localStorage.setItem('radio.local', JSON.stringify(updated));
    setEditingSong(null);
  };

  const filteredStations = useMemo(() => {
    let all = [...stations, ...localSongs];
    if (searchQuery) {
      all = all.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (activeTab === 'radio') return all.filter(s => s.genre === 'Radio');
    if (activeTab === 'music') return all.filter(s => s.genre !== 'Radio');
    if (activeTab === 'favs') return all.filter(s => favorites.includes(s.url));
    return all;
  }, [stations, localSongs, favorites, activeTab, searchQuery]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const playUrl = params.get('play');
    if (playUrl) {
      const song = filteredStations.find(s => s.url === playUrl);
      if (song) {
        play(song.url, song.title, song.logo);
        localStorage.setItem('radio.overlay', '1');
        window.dispatchEvent(new Event('storage'));
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [filteredStations, play]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const newMessage = {
      text: chatInput,
      me: true,
      username: getUsername(),
      avatar: profile?.avatar_url,
      badge: profile ? 'Membre' : 'Invité',
      timestamp: Date.now()
    };
    const updatedChat = [...chatMessages, newMessage];
    setChatMessages(updatedChat);
    localStorage.setItem('radio.chat', JSON.stringify(updatedChat));
    setChatInput('');
  };

  const toggleFav = (url: string) => {
    const next = favorites.includes(url) ? favorites.filter(u => u !== url) : [...favorites, url];
    setFavorites(next);
    localStorage.setItem('radio.favs', JSON.stringify(next));
  };

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    const handleAudioStart = (e: any) => {
      if (e.detail?.type !== 'radio' && state.playing) {
        pause();
      }
    };
    window.addEventListener('audio_start', handleAudioStart);
    return () => window.removeEventListener('audio_start', handleAudioStart);
  }, [state.playing, pause]);

  const playNext = useCallback(() => {
    const currentIndex = filteredStations.findIndex(s => s.url === state.url);
    if (currentIndex !== -1 && currentIndex < filteredStations.length - 1) {
      const next = filteredStations[currentIndex + 1];
      play(next.url, next.title, next.logo);
    }
  }, [filteredStations, state.url, play]);

  const playPrevious = useCallback(() => {
    const currentIndex = filteredStations.findIndex(s => s.url === state.url);
    if (currentIndex !== -1 && currentIndex > 0) {
      const prev = filteredStations[currentIndex - 1];
      play(prev.url, prev.title, prev.logo);
    }
  }, [filteredStations, state.url, play]);

  return (
    <div className="min-h-screen bg-transparent text-white font-sans selection:bg-primary/30 pb-48">
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 pt-12 md:pt-20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
          <div className="space-y-4">
            <motion.button whileHover={{ x: -4 }} onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors group">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-[9px] font-black uppercase tracking-widest">Dashboard</span>
            </motion.button>
            <div className="space-y-1">
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none italic">CSTREAM <span className="text-primary">RADIO</span></h1>
              <p className="text-zinc-500 font-bold text-[10px] tracking-widest uppercase opacity-60">VOTRE MUSIQUE, VOS RADIOS, VOTRE COMMUNAUTÉ.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className="w-full sm:w-48 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-primary transition-all placeholder:text-zinc-700 font-bold"
              />
            </div>
            <div className="flex bg-white/5 backdrop-blur-xl p-1 rounded-xl border border-white/10 overflow-x-auto no-scrollbar scrollbar-hide">
              {['all', 'radio', 'music', 'favs'].map((t) => (
                <button key={t} onClick={() => setActiveTab(t as any)} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === t ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-zinc-500 hover:text-white'}`}>
                  {t === 'all' ? 'Explorer' : t === 'favs' ? 'Favoris' : t}
                </button>
              ))}
              <div className="w-px h-3 bg-white/10 mx-1 self-center" />
              <button onClick={() => setImportOverlayOpen(true)} className="px-4 py-2 rounded-lg text-[9px] font-black text-emerald-400 hover:bg-emerald-400/10 transition-all flex items-center gap-2 uppercase tracking-widest">
                <Upload className="w-3 h-3" /> Import
              </button>
              <button onClick={() => setChatOpen(!chatOpen)} className={`px-4 py-2 rounded-lg text-[9px] font-black transition-all flex items-center gap-2 uppercase tracking-widest ${chatOpen ? 'bg-blue-500 text-white shadow-xl shadow-blue-500/20' : 'text-zinc-500 hover:text-white'}`}>
                <MessageCircle className="w-3 h-3" /> Chat
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredStations.map((item: any, idx: number) => (
              <StationCard
                key={item.id || item.url || idx}
                station={item}
                isPlaying={state.url === item.url && state.playing}
                isFavorite={favorites.includes(item.url)}
                onPlay={() => {
                  play(item.url, item.title, item.logo);
                  localStorage.setItem('radio.overlay', '1');
                  window.dispatchEvent(new Event('storage'));
                }}
                onDelete={localSongs.some(s => s.url === item.url && s.owner === getUsername()) ? () => {
                  const idx = localSongs.findIndex(s => s.url === item.url);
                  deleteSong(idx);
                } : undefined}
                onEdit={localSongs.some(s => s.url === item.url && s.owner === getUsername()) ? () => {
                  const s = localSongs.find(s => s.url === item.url);
                  setEditingSong({idx: localSongs.findIndex(s => s.url === item.url), title: s!.title, logo: s!.logo, isPublic: s!.isPublic ?? true});
                } : undefined}
                onShare={() => {
                  const domain = window.location.origin;
                  const shareUrl = `${domain}/radio?play=${encodeURIComponent(item.url)}`;
                  navigator.clipboard.writeText(shareUrl);
                  alert('Lien de partage copié !');
                }}
                plays={JSON.parse(localStorage.getItem('radio.plays') || '{}')[item.url] || 0}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {editingSong !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-zinc-900 border border-white/10 rounded-[32px] p-8 w-full max-w-sm shadow-2xl">
              <h3 className="text-2xl font-black mb-6 uppercase tracking-tighter italic">Modifier</h3>
              <div className="space-y-5">
                <div>
                  <label className="text-[9px] font-black text-zinc-500 uppercase mb-2 block tracking-widest">Titre</label>
                  <input type="text" value={editingSong.title} onChange={e => setEditingSong({...editingSong, title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs focus:border-primary outline-none transition-all font-bold" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-zinc-500 uppercase mb-2 block tracking-widest">Visibilité</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setEditingSong({...editingSong, isPublic: true})} className={`py-3 rounded-xl text-[9px] font-black border transition-all flex items-center justify-center gap-2 uppercase tracking-widest ${editingSong.isPublic ? 'bg-white text-black border-white' : 'bg-black/40 border-white/10 text-zinc-500'}`}>
                      <Globe className="w-3 h-3" /> PUBLIC
                    </button>
                    <button onClick={() => setEditingSong({...editingSong, isPublic: false})} className={`py-3 rounded-xl text-[9px] font-black border transition-all flex items-center justify-center gap-2 uppercase tracking-widest ${!editingSong.isPublic ? 'bg-white text-black border-white' : 'bg-black/40 border-white/10 text-zinc-500'}`}>
                      <Lock className="w-3 h-3" /> PRIVÉ
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-4">
                  <button onClick={() => setEditingSong(null)} className="py-3 bg-zinc-800/50 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-zinc-800">Annuler</button>
                  <button onClick={saveEdit} className="py-3 bg-primary rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-primary/20">Save</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {importOverlayOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-zinc-900 border border-white/10 rounded-[32px] p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar scrollbar-hide">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-3xl font-black uppercase tracking-tighter italic">Import <span className="text-zinc-600">SONS</span></h3>
                <button onClick={() => setImportOverlayOpen(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all border border-white/10"><X className="w-5 h-5 text-zinc-500" /></button>
              </div>
              <div className="space-y-6">
                <div className="flex p-1 bg-black/40 rounded-xl border border-white/10">
                  {['mp3', 'link', 'playlist'].map(t => (
                    <button key={t} onClick={() => setImportData(d => ({...d, type: t}))} className={`flex-1 py-2.5 rounded-lg text-[9px] font-black transition-all uppercase tracking-widest ${importData.type === t ? 'bg-primary text-white' : 'text-zinc-500 hover:text-white'}`}>{t === 'playlist' ? 'Dossier' : t}</button>
                  ))}
                </div>
                
                <div className="space-y-4">
                  {isImporting ? (
                    <div className="bg-black/40 border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center gap-4">
                      <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-white/10 rounded-full" />
                        <motion.div 
                          className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent" 
                          animate={{ rotate: 360 }} 
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }} 
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black tabular-nums">
                          {Math.round(uploadProgress)}%
                        </div>
                      </div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest animate-pulse">Traitement en cours...</p>
                    </div>
                  ) : importPreview.length > 0 ? (
                    <div className="bg-black/40 border border-white/10 rounded-2xl p-4 max-h-64 overflow-y-auto space-y-2">
                      <div className="flex items-center justify-between mb-4 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                        <p className="text-[10px] font-black text-emerald-400 uppercase">PRÊT À IMPORTER ✅</p>
                        <p className="text-[10px] font-black text-emerald-400">{importPreview.length} sons détectés</p>
                      </div>
                      {importPreview.map((s, i) => (
                        <div key={i} className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/5">
                          <img src={s.logo || 'https://placehold.co/40x40/09090B/ffffff?text=♫'} className="w-8 h-8 rounded-lg object-cover" alt="" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold truncate uppercase">{s.title}</p>
                            <p className="text-[8px] text-zinc-500 uppercase font-black">{s.playlist}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[9px] font-black text-zinc-500 uppercase mb-2 block tracking-widest">Titre / Album</label>
                          <input type="text" value={importData.title} onChange={e => setImportData(d => ({...d, title: e.target.value, playlistName: e.target.value}))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs focus:border-primary outline-none transition-all font-bold" placeholder="Nom..." />
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-zinc-500 uppercase mb-2 block tracking-widest">Langue</label>
                          <select value={importData.language} onChange={e => setImportData(d => ({...d, language: e.target.value}))} className="w-full h-[46px] bg-black/40 border border-white/10 rounded-xl px-4 text-[9px] font-black focus:border-primary outline-none appearance-none tracking-widest">
                            {['FR', 'EN', 'ES', 'DE', 'JP', 'KR'].map(l => <option key={l} value={l} className="bg-zinc-900">{l}</option>)}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-black text-zinc-500 uppercase mb-2 block tracking-widest">Lien Image Album (Optionnel)</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={importData.logo} 
                            onChange={e => setImportData(d => ({...d, logo: e.target.value}))} 
                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs focus:border-primary outline-none transition-all font-bold" 
                            placeholder="https://..." 
                          />
                          <label className="px-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center cursor-pointer hover:bg-white/10 transition-all">
                            <ImageIcon className="w-4 h-4 text-zinc-400" />
                            <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => setImportData(d => ({...d, logo: ev.target?.result as string}));
                                reader.readAsDataURL(file);
                              }
                            }} />
                          </label>
                        </div>
                      </div>
                    </>
                  )}

                  {importPreview.length === 0 && (
                    <>
                      {importData.type === 'mp3' ? (
                        <label className="w-full h-24 bg-black/40 border-2 border-dashed border-white/10 rounded-[24px] flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-all group overflow-hidden relative">
                          {isImporting ? (
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                          ) : (
                            <>
                              <Upload className="w-6 h-6 text-zinc-700 group-hover:text-primary transition-colors mb-2" />
                              <span className="text-[9px] font-black text-zinc-500 group-hover:text-white transition-colors tracking-widest uppercase">{importData.url ? 'PRÊT ✅' : 'CHOISIR MP3'}</span>
                            </>
                          )}
                          <input type="file" accept="audio/mp3" onChange={handleFileUpload} className="hidden" />
                        </label>
                      ) : importData.type === 'playlist' ? (
                        <div className="grid grid-cols-2 gap-4">
                          <label className="h-24 bg-black/40 border-2 border-dashed border-white/10 rounded-[24px] flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-all group">
                            <Folder className="w-6 h-6 text-zinc-700 group-hover:text-emerald-400 mb-2" />
                            <span className="text-[9px] font-black text-zinc-500 group-hover:text-white tracking-widest uppercase">Dossier</span>
                            <input type="file" 
                              {...({ webkitdirectory: "", directory: "" } as any)} 
                              multiple 
                              onChange={handleFolderUpload} 
                              className="hidden" 
                            />
                          </label>
                          <label className="h-24 bg-black/40 border-2 border-dashed border-white/10 rounded-[24px] flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-all group">
                            <FileArchive className="w-6 h-6 text-zinc-700 group-hover:text-amber-400 mb-2" />
                            <span className="text-[9px] font-black text-zinc-500 group-hover:text-white tracking-widest uppercase">ZIP</span>
                            <input type="file" accept=".zip" onChange={handleFileUpload} className="hidden" />
                          </label>
                        </div>
                      ) : (
                        <input type="text" value={importData.url} onChange={e => setImportData(d => ({...d, url: e.target.value}))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-xs focus:border-primary outline-none transition-all font-bold" placeholder="URL..." />
                      )}
                    </>
                  )}
                </div>

                <div className="pt-4 flex gap-3">
                  {importPreview.length > 0 && (
                    <button onClick={() => setImportPreview([])} className="flex-1 py-4 bg-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-700 transition-all">Retour</button>
                  )}
                  <button 
                    onClick={importPreview.length > 0 ? confirmImport : handleImport} 
                    disabled={(!importData.url && importPreview.length === 0) || isImporting} 
                    className="flex-[2] py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-primary/40 disabled:opacity-50 hover:scale-[1.02] transition-all active:scale-95"
                  >
                    {isImporting ? 'Traitement...' : importPreview.length > 0 ? 'Confirmer l\'import' : 'Importer'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {chatOpen && (
          <motion.div initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }} className="fixed top-0 right-0 h-full w-full sm:w-[450px] bg-[#050508] border-l border-white/10 z-[150] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5 backdrop-blur-3xl">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" />
                <h3 className="font-black text-lg uppercase tracking-tighter italic">CHAT</h3>
              </div>
              <button onClick={() => setChatOpen(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all border border-white/10"><X className="w-4 h-4 text-zinc-500" /></button>
            </div>
            <div ref={chatBoxRef} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
              {chatMessages.map((msg, idx) => (
                <motion.div key={msg.timestamp + idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${msg.me ? 'flex-row-reverse' : ''}`}>
                  <Avatar className="w-8 h-8 border border-white/10">
                    <AvatarImage src={msg.avatar} />
                    <AvatarFallback className="bg-primary text-white text-[10px] font-black uppercase">{msg.username?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className={`flex flex-col gap-1 max-w-[80%] ${msg.me ? 'items-end' : 'items-start'}`}>
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">{msg.username}</span>
                    <div className={`${msg.me ? 'bg-primary text-white' : 'bg-white/5 text-zinc-200'} px-4 py-2.5 rounded-2xl ${msg.me ? 'rounded-tr-none' : 'rounded-tl-none'} border border-white/10 shadow-sm`}><p className="text-[11px] font-bold leading-relaxed">{msg.text}</p></div>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="p-6 bg-white/5 backdrop-blur-3xl border-t border-white/10">
              <form onSubmit={handleSendMessage} className="relative">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Message..." className="w-full h-11 bg-black/40 border border-white/10 rounded-xl px-4 pr-12 text-xs focus:outline-none focus:border-primary transition-all font-bold" />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-primary"><Share2 className="w-4 h-4" /></button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <RadioOverlay />
    </div>
  );
}

function StationCard({ station, isPlaying, isFavorite, onPlay, onPause, onToggleFav, onDelete, onEdit, onShare }: any) {
  return (
    <motion.div 
      layout
      whileHover={{ y: -8 }}
      className="group"
    >
      <div className="bg-zinc-950/90 backdrop-blur-[40px] border border-white/10 rounded-[32px] p-3 md:p-4 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
        
        <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 shadow-xl border border-white/5 bg-zinc-900 flex items-center justify-center p-2">
          {station.logo ? (
            <img src={station.logo} className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110" alt="" />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${station.color || 'from-zinc-800 to-zinc-900'} flex items-center justify-center rounded-xl`}>
              <Music2 className="w-8 h-8 text-white/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px] gap-3">
            <button onClick={onToggleFav} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isFavorite ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}><Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} /></button>
            <button onClick={isPlaying ? onPause : onPlay} className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-all">{isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}</button>
            <button onClick={onShare} className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all"><Share2 className="w-4 h-4" /></button>
          </div>
          {station.genre === 'Radio' && <div className="absolute top-3 left-3 px-2 py-1 bg-primary text-white text-[7px] font-black uppercase tracking-widest rounded-full shadow-lg">Live</div>}
        </div>

        <div className="space-y-1 px-1">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em]">{station.genre || 'Music'}</span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEdit && <button onClick={onEdit} className="p-1.5 hover:text-primary transition-colors"><Edit2 className="w-3 h-3" /></button>}
              {onDelete && <button onClick={onDelete} className="p-1.5 hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>}
            </div>
          </div>
          <h4 className="font-black text-xs text-white truncate leading-tight tracking-tight uppercase italic">{station.title}</h4>
          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest truncate">{station.playlist || station.owner || 'Global Stream'}</p>
        </div>
      </div>
    </motion.div>
  );
}

function RadioOverlay() {
  const { state, play, pause, stop, toggle, setVolume, stations, seek, setRepeatMode, toggleShuffle } = useRadioAudio();
  const [visible, setVisible] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkOverlay = () => {
      setVisible(
        localStorage.getItem('radio.overlay') === '1' && state.url !== ''
      );
    };

    checkOverlay();
    window.addEventListener('storage', checkOverlay);
    return () => window.removeEventListener('storage', checkOverlay);
  }, [state.url]);

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

  return (
    <AnimatePresence>
      {visible && state.url && (
        <motion.div
          initial={{ opacity: 0, y: 40, x: '-50%', scale: 0.95 }}
          animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
          exit={{ opacity: 0, y: 40, x: '-50%', scale: 0.95 }}
          className="fixed bottom-6 left-1/2 z-[200] w-[calc(100%-32px)] max-w-md"
        >
          <div ref={containerRef} className="relative rounded-[32px] p-5 bg-zinc-950/90 backdrop-blur-3xl border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            
            <div className="relative z-10 flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center border border-white/5 overflow-hidden shadow-xl">
                  {state.logo ? (
                    <img src={state.logo} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-primary animate-pulse shadow-[0_0_12px_rgba(var(--primary),0.5)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">{isMusic ? 'Musique' : 'Live Radio'}</span>
                    <div className="w-1 h-1 rounded-full bg-zinc-700" />
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{currentStation?.genre || 'Music'}</span>
                  </div>
                  <h4 className="text-base font-black text-white truncate leading-tight tracking-tight">{state.title}</h4>
                </div>
                <button onClick={closeOverlay} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {state.duration > 0 && (
                <div className="space-y-2 px-1">
                  <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden cursor-pointer group/progress" onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const percent = (e.clientX - rect.left) / rect.width;
                    seek(percent * state.duration);
                  }}>
                    <motion.div 
                      className="absolute inset-y-0 left-0 bg-primary shadow-[0_0_12px_rgba(var(--primary),0.5)]"
                      style={{ width: `${(state.currentTime / state.duration) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-black text-zinc-500 tabular-nums tracking-widest">
                    <span>{formatTime(state.currentTime)}</span>
                    <span>{formatTime(state.duration)}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-6 px-1">
                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggle}
                    className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-xl hover:shadow-white/10 transition-all"
                  >
                    {state.playing ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black ml-0.5" />}
                  </motion.button>
                  {isMusic && (
                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5">
                      <button onClick={toggleShuffle} className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${state.isShuffle ? 'text-primary bg-primary/10' : 'text-zinc-500 hover:text-zinc-300'}`}>
                        <Shuffle className="w-4 h-4" />
                      </button>
                      <button onClick={cycleRepeat} className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${state.repeatMode !== 'none' ? 'text-primary bg-primary/10' : 'text-zinc-500 hover:text-zinc-300'}`}>
                        {state.repeatMode === 'one' ? <Repeat className="w-4 h-4 text-primary" /> : <Repeat className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                  <button onClick={toggleFav} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border border-white/5 ${isFavorite ? 'text-red-500 bg-red-500/10 border-red-500/20' : 'text-zinc-500 bg-white/5 hover:text-white'}`}>
                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <div className="flex items-center gap-3 flex-1 max-w-[120px] bg-white/5 px-4 py-2.5 rounded-2xl border border-white/5 group/vol">
                  <Volume2 className="w-4 h-4 text-zinc-500 group-hover/vol:text-primary transition-colors" />
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
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
