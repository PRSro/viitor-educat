import { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, Music, X, Play, Pause, Clock } from 'lucide-react';
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
import { Sparkles } from 'lucide-react';

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
    track: Track | null;
  } | null;
}

export function MusicPlayer({ className }: MusicPlayerProps) {
  const { isOpen, openPlayer, closePlayer } = useMusicPlayer();
  const { theme } = useSettings();
  const [tracks, setTracks] = useState<Track[]>([
    { id: '1', frequencyHz: 432, name: 'Frutiger Aero — 432Hz', benefit: 'Natural tuning, aquatic serenity.', duration: 3600, order: 0, url: 'CfhddcGwsWY' },
    { id: '2', frequencyHz: 174, name: 'Foundation — 174Hz', benefit: 'Removes pain and strengthens security.', duration: 3600, order: 1, url: 'FkJfGEkVUhE' },
    { id: '3', frequencyHz: 285, name: 'Healing — 285Hz', benefit: 'Heals tissues and organs.', duration: 3600, order: 2, url: 'q1eBkrxSJeQ' },
    { id: '4', frequencyHz: 396, name: 'Liberation — 396Hz', benefit: 'Liberates guilt and fear.', duration: 3600, order: 3, url: 'pEGT80dDR60' },
    { id: '5', frequencyHz: 417, name: 'Transformation — 417Hz', benefit: 'Facilitates change.', duration: 3600, order: 4, url: 'dBNMnWJBIF8' },
    { id: '6', frequencyHz: 528, name: 'Miracle — 528Hz', benefit: 'DNA repair, the love frequency.', duration: 3600, order: 5, url: 'FEnxTz-KWNY' },
    { id: '7', frequencyHz: 639, name: 'Harmony — 639Hz', benefit: 'Harmonises relationships.', duration: 3600, order: 6, url: 'A4Tcoa_BHZY' },
    { id: '8', frequencyHz: 741, name: 'Awakening — 741Hz', benefit: 'Awakens intuition.', duration: 3600, order: 7, url: 'Tc5c-BWKGPQ' },
    { id: '9', frequencyHz: 852, name: 'Spiritual Order — 852Hz', benefit: 'Restores spiritual order.', duration: 3600, order: 8, url: '7NCsRfpbBEI' },
    { id: '10', frequencyHz: 963, name: 'Divine Consciousness — 963Hz', benefit: 'Highest spiritual frequency.', duration: 3600, order: 9, url: 'L8IkuQIGiUY' },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [waitingForGesture, setWaitingForGesture] = useState(false);
  const pendingAutoplayRef = useRef<Track | null>(null);
  const hasShownToastRef = useRef(false);

  const setIsOpen = (open: boolean) => {
    if (open) openPlayer();
    else closePlayer();
  };

  const {
    isPlaying,
    currentTrack,
    volume,
    elapsedTime,
    analyserNode,
    play,
    stop,
    setVolume
  } = useAudioPlayer();

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        console.log('[MusicPlayer] Fetching tracks from /music/tracks');
        const response = await api.get<TracksResponse>('/music/tracks');
        console.log('[MusicPlayer] Tracks response:', response);
        setTracks(response.tracks);
      } catch (error) {
        console.error('[MusicPlayer] Failed to fetch tracks:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTracks();
  }, []);

  useEffect(() => {
    if (tracks.length === 0) return;

    const token = getToken();
    if (!token) return; // Guest: don't auto-play

    // Logged in — fetch saved preference
    api.get<PreferenceResponse>('/music/preferences')
      .then(response => {
        // Only restore if they had an explicit saved track
        if (response.preference?.trackId && response.preference?.track) {
          const savedTrack = tracks.find(t => t.id === response.preference?.trackId);
          if (savedTrack) {
            pendingAutoplayRef.current = savedTrack;
            setWaitingForGesture(true);
          }
          // No else — if no saved preference, don't auto-play anything
        }
      })
      .catch(() => {
        // Preference fetch failed — don't auto-play
      });
  }, [tracks]);

  const handleGestureManual = useCallback(() => {
    if (waitingForGesture && pendingAutoplayRef.current) {
      play(pendingAutoplayRef.current, 0.2);
      pendingAutoplayRef.current = null;
      setWaitingForGesture(false);
    }
  }, [waitingForGesture, play]);

  useEffect(() => {
    if (!waitingForGesture) return;

    const timeout = setTimeout(() => {
      if (waitingForGesture) {
        setWaitingForGesture(false);
        pendingAutoplayRef.current = null;
      }
    }, 10000); // Wait longer for icon tap

    return () => clearTimeout(timeout);
  }, [waitingForGesture]);

  const savePreference = useCallback(async (trackId: string | null, vol: number) => {
    const token = getToken();
    if (!token) return;

    try {
      await api.patch('/music/preferences', { trackId, volume: vol });
    } catch (error) {
      console.error('Failed to save preference:', error);
    }
  }, []);

  const handlePlay = (track: Track) => {
    console.log('[MusicPlayer] handlePlay called for track:', track.name, 'URL:', track.url);
    play(track, volume);
    savePreference(track.id, volume);
  };

  const handleStop = () => {
    stop();
    savePreference(null, volume);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0] / 100);
    if (currentTrack) {
      savePreference(currentTrack.id, value[0] / 100);
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



  return (
    <div className={`fixed bottom-6 right-4 z-[9999] pb-safe ${className}`}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="default"
            size="icon"
            className={`
              h-12 w-12 rounded-full shadow-lg
              bg-emerald-500 hover:bg-emerald-600
              dark:bg-emerald-500 dark:hover:bg-emerald-600
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
              <p className="text-xs text-muted-foreground mt-1">{formatTime(elapsedTime)} elapsed</p>
            </div>
          )}

          <div className="space-y-1 max-h-48 overflow-y-auto mb-3">
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
                      {track.name === 'Frutiger Aero' && theme === 'light' && (
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
            <div className="flex items-center gap-2">
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
