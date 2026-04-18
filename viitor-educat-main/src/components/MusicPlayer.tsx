import { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, Music, X, Play, Pause, Clock, Sparkles, Repeat, Shuffle, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { useAudioPlayer, Track } from '@/hooks/use-audio-player';
import { api } from '@/lib/apiClient';
import { getToken } from '@/modules/core/services/authService';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useSettings } from '@/contexts/SettingsContext';

interface MusicPlayerProps {
  className?: string;
}

interface TracksResponse {
  tracks: Track[];
}

interface PreferenceResponse {
  preference: {
    trackId: string | null;
    volume: number;
    elapsedTime: number;
    track: Track | null;
  } | null;
}

export function MusicPlayer({ className }: MusicPlayerProps) {
  const { isOpen, openPlayer, closePlayer } = useMusicPlayer();
  const { theme } = useSettings();
  const [tracks, setTracks] = useState<Track[]>([
    {
      id: '1', frequencyHz: 432,
      name: 'Frutiger Aero — 432Hz',
      benefit: 'Natural tuning, aquatic serenity.',
      duration: 3600000, order: 0,
      audioUrl: '/assets/music/safe-haven.mp3'
    },
    { id: '2', frequencyHz: 174, name: 'Foundation — 174Hz', benefit: 'Removes pain and strengthens security.', duration: 3600000, order: 1, url: 'MTwSC3jMOIQ' },
    { id: '3', frequencyHz: 285, name: 'Healing — 285Hz', benefit: 'Heals tissues and organs.', duration: 3600000, order: 2, url: 'CbiHT9-ca70' },
    { id: '4', frequencyHz: 396, name: 'Liberation — 396Hz', benefit: 'Liberates guilt and fear.', duration: 3600000, order: 3, url: 'e_hdIsuG4YQ' },
    { id: '5', frequencyHz: 417, name: 'Transformation — 417Hz', benefit: 'Facilitates change.', duration: 3600000, order: 4, url: 'FTvt9oRRl7E' },
    { id: '6', frequencyHz: 528, name: 'Miracle — 528Hz', benefit: 'DNA repair, the love frequency.', duration: 3600000, order: 5, url: 'Yt4GCauOnb8' },
    { id: '7', frequencyHz: 639, name: 'Harmony — 639Hz', benefit: 'Harmonises relationships.', duration: 3600000, order: 6, url: 'V58xwG4X4iU' },
    { id: '8', frequencyHz: 741, name: 'Awakening — 741Hz', benefit: 'Awakens intuition.', duration: 3600000, order: 7, url: 'M8OKFqmvHwI' },
    { id: '9', frequencyHz: 852, name: 'Spiritual Order — 852Hz', benefit: 'Restores spiritual order.', duration: 3600000, order: 8, url: 'uFQxT-Ht8tY' },
    { id: '10', frequencyHz: 963, name: 'Divine Consciousness — 963Hz', benefit: 'Highest spiritual frequency.', duration: 3600000, order: 9, url: 'uhnF59zejNY' },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [waitingForGesture, setWaitingForGesture] = useState(false);
  const pendingAutoplayRef = useRef<Track | null>(null);
  const hasShownToastRef = useRef(false);
  const tracksFromBackend = useRef(false);
  const [isOfflineFallback, setIsOfflineFallback] = useState(false);
  const preferenceVolumeRef = useRef<number>(0.25);

  const touchStartY = useRef<number>(0);
  const popoverRef = useRef<HTMLDivElement>(null);
  const analyserCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);

  const setIsOpen = (open: boolean) => {
    if (open) openPlayer();
    else closePlayer();
  };

  const {
    isPlaying,
    currentTrack,
    volume,
    elapsedTime,
    duration,
    analyserNode,
    play,
    stop,
    seekTo,
    setVolume,
    loopMode,
    shuffleMode,
    setLoopMode,
    setShuffleMode,
  } = useAudioPlayer();

  useEffect(() => {
    try {
      const cached = localStorage.getItem('ves_music_pref');
      if (cached) {
        const { trackId, volume: cachedVol, elapsedTime: cachedTime } = JSON.parse(cached);
        const savedTrack = tracks.find(t => t.id === trackId);
        if (savedTrack) {
          preferenceVolumeRef.current = cachedVol;
          setVolume(cachedVol);
          pendingAutoplayRef.current = savedTrack;
          if (cachedTime && cachedTime > 0) {
            setTimeout(() => seekTo(cachedTime), 500);
          }
        }
      }
    } catch {  }
  }, []);

  useEffect(() => {
    const fetchTracks = async (attempt = 0) => {
      setIsLoading(true);
      try {
        if (import.meta.env.DEV) console.log(`[MusicPlayer] Fetching tracks (attempt ${attempt + 1})`);
        const response = await api.get<TracksResponse>('/api/music/tracks');
        if (import.meta.env.DEV) console.log('[MusicPlayer] Tracks response:', response);
        setTracks(response.tracks);
        tracksFromBackend.current = true;
        setIsOfflineFallback(false);
        setIsLoading(false);
      } catch (error) {
        if (attempt === 0) {
          console.warn('[MusicPlayer] Failed to fetch tracks, retrying in 3s...', error);
          setTimeout(() => fetchTracks(1), 3000);
        } else {
          console.error('[MusicPlayer] Failed to fetch tracks after retry, using fallback', error);
          setIsOfflineFallback(true);
          setIsLoading(false);
        }
      }
    };
    fetchTracks();
  }, []);

  useEffect(() => {
    if (tracks.length === 0) return;
    if (!tracksFromBackend.current) return;

    const token = getToken();
    if (!token) return;

    api.get<PreferenceResponse>('/api/music/preferences')
      .then(response => {
        if (response.preference?.trackId && response.preference?.track) {
          const savedTrack = tracks.find(t => t.id === response.preference?.trackId);
          if (savedTrack) {
            const prefVol = response.preference.volume ?? 0.25;
            const savedTime = response.preference.elapsedTime ?? 0;
            preferenceVolumeRef.current = prefVol;
            setVolume(prefVol);

            localStorage.setItem('ves_music_pref', JSON.stringify({ 
              trackId: savedTrack.id, 
              volume: prefVol,
              elapsedTime: savedTime
            }));

            if (isOpen) {
              play(savedTrack, prefVol, tracks);
              if (savedTime > 0) {
                setTimeout(() => seekTo(savedTime), 1000);
              }
            } else {
              pendingAutoplayRef.current = savedTrack;
              setWaitingForGesture(true);
            }
          }
        }
      })
      .catch(() => {});
  }, [tracks]);

  useEffect(() => {
    handleGestureManual();
  }, [isOpen, waitingForGesture]);

  useEffect(() => {
    if (!waitingForGesture) return;

    const timeout = setTimeout(() => {
      if (waitingForGesture) {
        setWaitingForGesture(false);
        pendingAutoplayRef.current = null;
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [waitingForGesture]);

  const handleGestureManual = useCallback(() => {
    if (waitingForGesture && pendingAutoplayRef.current) {
      play(pendingAutoplayRef.current, preferenceVolumeRef.current, tracks);
      pendingAutoplayRef.current = null;
      setWaitingForGesture(false);
    }
  }, [waitingForGesture, play, tracks]);

  const savePreference = useCallback(async (trackId: string | null, vol: number, elapsed: number = 0) => {
    if (trackId) {
      localStorage.setItem('ves_music_pref', JSON.stringify({ trackId, volume: vol, elapsedTime: elapsed }));
    } else {
      localStorage.removeItem('ves_music_pref');
    }

    const token = getToken();
    if (!token) return;

    try {
      await api.patch('/api/music/preferences', { trackId, volume: vol, elapsedTime: elapsed });
    } catch (error) {
      console.error('Failed to save preference:', error);
    }
  }, []);

  const handlePlay = (track: Track) => {
    if (import.meta.env.DEV) console.log('[MusicPlayer] handlePlay called for track:', track.name, 'URL:', track.url);
    preferenceVolumeRef.current = volume;
    play(track, volume, tracks);
    savePreference(track.id, volume, 0);
  };

  const handleStop = () => {
    stop();
    savePreference(null, volume, elapsedTime);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0] / 100);
    if (currentTrack) {
      savePreference(currentTrack.id, value[0] / 100, elapsedTime);
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePopoverTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handlePopoverTouchMove = (e: React.TouchEvent) => {
    const deltaY = e.touches[0].clientY - touchStartY.current;
    if (deltaY > 80) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !analyserNode || !analyserCanvasRef.current) return;

    const canvas = analyserCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyserNode.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'rgba(0, 0, 0, 0)';
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, '#10b981');
        gradient.addColorStop(1, '#059669');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, analyserNode]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (isPlaying) {
          handleStop();
        } else if (currentTrack) {
          play(currentTrack, volume, tracks);
        }
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        setVolume(volume === 0 ? preferenceVolumeRef.current : 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPlaying, currentTrack, volume, tracks, play, stop, setVolume]);

  const cycleLoopMode = () => {
    const modes: ('track' | 'list' | 'off')[] = ['off', 'track', 'list'];
    const currentIndex = modes.indexOf(loopMode);
    setLoopMode(modes[(currentIndex + 1) % modes.length]);
  };

  return (
    <div className={`fixed bottom-6 right-4 z-[9999] pb-safe ${className}`}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="default"
            size="icon"
            onClick={handleGestureManual}
            aria-label="Toggle ambient music"
            className={`
              h-12 w-12 rounded-full shadow-lg
              bg-primary hover:bg-primary/90
              dark:bg-primary dark:hover:bg-primary/90
              border-2 border-white/40 text-white
              transition-all duration-300
              ${isPlaying ? 'animate-pulse shadow-emerald-400/60' : 'shadow-emerald-500/30'}
            `}
          >
            {isPlaying ? (
              <Volume2 className="h-5 w-5" />
            ) : (
              <Music className="h-5 w-5" />
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          ref={popoverRef}
          onTouchStart={handlePopoverTouchStart}
          onTouchMove={handlePopoverTouchMove}
          className="w-[calc(100vw-2rem)] max-w-80 p-4 bg-background/95 backdrop-blur border border-border shadow-xl"
          align="end"
          side="top"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Ambient Music</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {isPlaying && currentTrack && (
            <div className="mb-3 p-2 rounded-lg bg-primary/10 border border-primary/20 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-2xl font-bold text-primary">{currentTrack.frequencyHz}Hz</span>
                <span className="text-xs text-muted-foreground animate-pulse">● LIVE</span>
              </div>
              <p className="font-medium text-sm">{currentTrack.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {currentTrack.benefit}
              </p>

              {analyserNode && (
                <canvas
                  ref={analyserCanvasRef}
                  width={280}
                  height={32}
                  className="w-full h-8 mt-2 rounded"
                />
              )}
              
              <div className="mt-2.5 flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-8 text-right">{formatTime(elapsedTime)}</span>
                <Slider
                  value={[elapsedTime]}
                  max={duration > 0 ? duration : 3600000}
                  step={1000}
                  onValueChange={(val) => seekTo(val[0])}
                  className="flex-1"
                />
                <span className="text-[10px] text-muted-foreground w-10 text-left">{duration > 0 ? formatTime(duration) : '1:00:00'}</span>
              </div>
            </div>
          )}

          <div className="space-y-1 max-h-48 overflow-y-auto mb-3">
            {isOfflineFallback && (
              <div className="flex justify-center mb-2">
                <div className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-[10px] opacity-80">
                  Using offline tracks
                </div>
              </div>
            )}
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Loading ambient tracks...
              </p>
            ) : (
              tracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => handlePlay(track)}
                  className={`
                    w-full flex items-center justify-between p-2 rounded-lg
                    text-left transition-colors hover:bg-accent
                    relative group/item
                    ${currentTrack?.id === track.id ? 'bg-primary/10 border border-primary/30' : ''}
                  `}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{track.name}</p>
                      {'audioUrl' in track && (
                        <span className="text-[9px] text-primary/50 ml-1">local</span>
                      )}
                      {track.name.includes('Frutiger Aero') && theme === 'light' && (
                        <Badge variant="outline" className="h-4 px-1 text-[10px] bg-accent/20 border-accent/30 text-accent gap-1 animate-pulse">
                          <Sparkles className="h-2 w-2" /> Theme Track
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{track.benefit}</p>
                  </div>
                  {currentTrack?.id === track.id && isPlaying ? (
                    <Pause className="h-4 w-4 text-primary flex-shrink-0" />
                  ) : (
                    <Play className="h-4 w-4 text-muted-foreground flex-shrink-0 group-hover/item:text-primary" />
                  )}
                </button>
              ))
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 mb-1">
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 px-2 ${loopMode !== 'off' ? 'text-primary' : 'text-muted-foreground'}`}
                onClick={cycleLoopMode}
                title={`Loop: ${loopMode}`}
              >
                <Repeat className="h-3 w-3 mr-1" />
                <span className="text-[10px]">
                  {loopMode === 'track' ? '1' : loopMode === 'list' ? '∞' : '-'}
                </span>
              </Button>
              <div className="flex items-center gap-2 flex-1">
                {volume === 0 ? (
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                )}
                <Slider
                  value={[volume * 100]}
                  onValueChange={handleVolumeChange}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-8">
                  {Math.round(volume * 100)}%
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 px-2 ${shuffleMode ? 'text-primary' : 'text-muted-foreground'}`}
                onClick={() => setShuffleMode(!shuffleMode)}
                title="Shuffle"
              >
                <Shuffle className="h-3 w-3" />
              </Button>
            </div>

            {isPlaying && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleStop}
              >
                <Pause className="h-4 w-4 mr-2" />
                Stop
              </Button>
            )}

            <div className="flex items-center gap-1 text-xs text-muted-foreground justify-center">
              <Clock className="h-3 w-3" />
              <span>Auto-stops after 4 hours</span>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {waitingForGesture && (
        <div className="fixed bottom-20 right-4 z-50 animate-bounce">
          <div className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-xl border-2 border-white/20">
            TAP ICON FOR MUSIC 🎵
          </div>
        </div>
      )}
    </div>
  );
}