import { useState, useEffect, useCallback, useRef } from 'react';

export interface RadioStation {
  id: string;
  title: string;
  url: string;
  genre: string;
  color: string;
  logo?: string;
  streams?: { name: string; url: string }[];
}

export interface RadioState {
  title: string;
  url: string;
  playing: boolean;
  volume: number;
  logo?: string;
  duration: number;
  currentTime: number;
  repeatMode: 'none' | 'all' | 'one';
  isShuffle: boolean;
}

const STATIONS: RadioStation[] = [
  { id: 'nrj-be', title: 'NRJ Belgique', url: 'https://n16a-eu.rcs.revma.com/xh00fwuptg0uv?rj-ttl=5&rj-tok=AAABm628s7sAn0hVYNcIdXje6g', genre: 'Pop/Hits', color: 'from-red-600 to-rose-700', logo: 'https://ngroup.gumlet.io/IMAGE/IMAGE-S1-00014/50892-nrj-logo-petit-v2.png?dpr=1.0&q=70&w=700' },
  { id: 'skyrock-fr', title: 'Skyrock France', url: 'http://icecast.skyrock.net/s/natio_aac_128k', genre: 'Rap/RnB', color: 'from-zinc-800 to-black', logo: 'https://skyrock.fm/images/skyrock-footer.svg', streams: [
    { name: 'AAC 128k (Défaut)', url: 'http://icecast.skyrock.net/s/natio_aac_128k' },
    { name: 'MP3 128k', url: 'http://icecast.skyrock.net/s/natio_mp3_128k' },
    { name: 'TuneIn 128k', url: 'http://www.skyrock.fm/stream.php/tunein16_128mp3.mp3' },
    { name: 'AAC 96k', url: 'http://icecast.skyrock.net/s/natio_aac_96k' },
    { name: 'AAC 64k', url: 'http://icecast.skyrock.net/s/natio_mob_aac_64k' },
    { name: 'MP3 64k', url: 'http://icecast.skyrock.net/s/natio_mp3_64k' }
  ]},
  { id: 'charts', title: 'Charts', url: 'https://listen.reyfm.de/reyfm-charts/', genre: 'Top 40', color: 'from-emerald-500 to-cyan-500' },
  { id: 'dance', title: 'Dance', url: 'https://listen.reyfm.de/reyfm-dance/', genre: 'Dance/EDM', color: 'from-violet-500 to-purple-500' },
  { id: 'deutschrap', title: 'Deutschrap', url: 'https://listen.reyfm.de/reyfm-deutschrap/', genre: 'Hip-Hop', color: 'from-orange-500 to-red-500' },
  { id: 'hits', title: 'Hits', url: 'https://listen.reyfm.de/reyfm-hits/', genre: 'Popular', color: 'from-pink-500 to-rose-500' },
  { id: 'piano-house', title: 'Piano House', url: 'https://listen.reyfm.de/reyfm-piano_house/', genre: 'House', color: 'from-blue-500 to-cyan-500' },
  { id: 'hiphop', title: 'Hip-Hop', url: 'https://listen.reyfm.de/reyfm-hip-hop/', genre: 'Rap', color: 'from-yellow-500 to-amber-500' },
  { id: 'hits2k', title: 'Hits 2K', url: 'https://listen.reyfm.de/reyfm-hits2k/', genre: 'Y2K Hits', color: 'from-fuchsia-500 to-pink-500' },
  { id: 'summer', title: 'Summer', url: 'https://listen.reyfm.de/reyfm-summer/', genre: 'Summer Hits', color: 'from-yellow-400 to-orange-500' },
  { id: 'lofi', title: 'Lo-Fi', url: 'https://listen.reyfm.de/reyfm-lofi/', genre: 'Chill', color: 'from-teal-500 to-emerald-500' },
  { id: 'chill', title: 'Chill', url: 'https://listen.reyfm.de/reyfm-chill/', genre: 'Relaxation', color: 'from-green-500 to-emerald-500' },
  { 
    id: 'fb-alsace', 
    title: 'Ici Alsace (FR)', 
    url: 'http://direct.francebleu.fr/live/fbalsace-midfi.mp3', 
    genre: 'Radio', 
    color: 'from-blue-600 to-blue-800', 
    logo: 'https://www.radiofrance.com/themes/custom/radiofrance/logo.svg?1768146851',
    streams: [
      { name: 'Midfi (128k)', url: 'http://direct.francebleu.fr/live/fbalsace-midfi.mp3' },
      { name: 'Lofi (32k)', url: 'http://direct.francebleu.fr/live/fbalsace-lofi.mp3' }
    ]
  },
  { 
    id: 'fb-vaucluse', 
    title: 'Ici Vaucluse (FR)', 
    url: 'http://direct.francebleu.fr/live/fbvaucluse-midfi.mp3', 
    genre: 'Radio', 
    color: 'from-blue-500 to-blue-700', 
    logo: 'https://www.radiofrance.com/themes/custom/radiofrance/logo.svg?1768146851',
    streams: [
      { name: 'Midfi (128k)', url: 'http://direct.francebleu.fr/live/fbvaucluse-midfi.mp3' },
      { name: 'Lofi (32k)', url: 'http://direct.francebleu.fr/live/fbvaucluse-lofi.mp3' }
    ]
  },
  {
    id: 'radio-rotation',
    title: 'Radio Rotation',
    url: 'https://radio-rotation.stream.laut.fm/radio-rotation',
    genre: 'Music',
    color: 'from-purple-600 to-indigo-800',
    logo: 'https://tse1.mm.bing.net/th/id/OIP.ZXw5ppGWOAo8HH0lJGrUpwHaHa?rs=1&pid=ImgDetMain&o=7&rm=3'
  },
  {
    id: 'france-maghreb-2',
    title: 'France Maghreb 2',
    url: 'http://francemaghreb2.ice.infomaniak.ch/francemaghreb2-high.mp3',
    genre: 'Radio',
    color: 'from-orange-600 to-red-600',
    logo: 'https://images.lesindesradios.fr/fit-in/300x2000/filters:format(webp)/filters:quality(100)/radios/francemaghreb2/images/logo.png',
    streams: [
      { name: 'MP3 128k (Flux 1)', url: 'http://francemaghreb2.ice.infomaniak.ch/francemaghreb2-high.mp3' },
      { name: 'MP3 128k (Flux 2)', url: 'http://broadcast.infomaniak.net/francemaghreb2-high.mp3' },
      { name: 'MP3 128k (Flux 3)', url: 'http://broadcast.infomaniak.ch/francemaghreb2-high.mp3' },
      { name: 'AAC 64k (Flux 1)', url: 'http://francemaghreb2.ice.infomaniak.ch/francemaghreb2-high.aac' },
      { name: 'AAC 64k (Flux 2)', url: 'http://broadcast.infomaniak.net/francemaghreb2-high.aac' }
    ]
  },
];

export const useRadioAudio = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<RadioState>({
    title: '',
    url: '',
    playing: false,
    volume: 0.9,
    duration: 0,
    currentTime: 0,
    repeatMode: 'none',
    isShuffle: false,
  });

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.crossOrigin = 'anonymous';
      audioRef.current.volume = parseFloat(localStorage.getItem('radio.volume') || '0.9');
    }

    const audio = audioRef.current;

    const handlePlay = () => setState(s => ({ ...s, playing: true }));
    const handlePause = () => setState(s => ({ ...s, playing: false }));
    const handleError = () => setState(s => ({ ...s, playing: false }));
    const handleMetadata = () => {
      setState(s => ({ ...s, duration: isFinite(audio.duration) ? audio.duration : 0 }));
    };
    const handleTimeUpdate = () => {
      setState(s => ({ ...s, currentTime: audio.currentTime }));
    };
    const handleEnded = () => {
      setState(s => {
        if (s.repeatMode === 'one') {
          audio.currentTime = 0;
          audio.play().catch(() => {});
          return s;
        }
        return { ...s, playing: false };
      });
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadedmetadata', handleMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadedmetadata', handleMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const play = useCallback(async (url: string, title: string, logo?: string) => {
    if (audioRef.current) {
      try {
        if (audioRef.current.src !== url) {
          audioRef.current.src = url;
          audioRef.current.load();
        }
        setState(s => ({ ...s, url, title, logo, currentTime: 0, duration: 0, playing: true }));
        
        // Increment play count
        const counts = JSON.parse(localStorage.getItem('radio.plays') || '{}');
        counts[url] = (counts[url] || 0) + 1;
        localStorage.setItem('radio.plays', JSON.stringify(counts));
        localStorage.setItem('radio.overlay', '1');
        window.dispatchEvent(new Event('storage'));

        await audioRef.current.play();
      } catch (e) {
        console.error('Play error:', e);
      }
    }
  }, []);

  const toggle = useCallback(() => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play().catch(e => console.error('Toggle play error:', e));
      } else {
        audioRef.current.pause();
      }
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      setState(s => ({ ...s, title: '', url: '', playing: false, currentTime: 0, duration: 0 }));
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    if (audioRef.current) {
      audioRef.current.volume = vol;
      localStorage.setItem('radio.volume', String(vol));
      setState(s => ({ ...s, volume: vol }));
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current && isFinite(time)) {
      audioRef.current.currentTime = time;
    }
  }, []);

  const setRepeatMode = useCallback((mode: 'none' | 'all' | 'one') => {
    setState(s => ({ ...s, repeatMode: mode }));
  }, []);

  const toggleShuffle = useCallback(() => {
    setState(s => ({ ...s, isShuffle: !s.isShuffle }));
  }, []);

  return { state, play, pause, toggle, stop, setVolume, seek, setRepeatMode, toggleShuffle, stations: STATIONS };
};
