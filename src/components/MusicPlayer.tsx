import { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, Music, X, Play, Pause, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { useAudioPlayer, Track } from '@/hooks/use-audio-player';
import { api } from '@/lib/apiClient';
import { getToken } from '@/modules/core/services/authService';

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
  const [isOpen, setIsOpen] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  
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
        const response = await api.get<TracksResponse>('/music/tracks');
        setTracks(response.tracks);
      } catch (error) {
        console.error('Failed to fetch tracks:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTracks();
  }, []);

  useEffect(() => {
    const fetchPreference = async () => {
      const token = getToken();
      if (!token) return;
      
      try {
        const response = await api.get<PreferenceResponse>('/music/preferences');
        if (response.preference?.track && tracks.length > 0) {
          const savedTrack = tracks.find(t => t.id === response.preference?.trackId);
          if (savedTrack) {
            play(savedTrack, response.preference.volume);
          }
        } else if (tracks.length > 0) {
          play(tracks[0], 0.25);
        }
      } catch (error) {
        console.error('Failed to fetch preference:', error);
      }
    };
    
    if (tracks.length > 0) {
      fetchPreference();
    }
  }, [tracks]);

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

  useEffect(() => {
    if (!analyserNode || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyserNode.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'rgba(30, 30, 30, 0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        gradient.addColorStop(0, '#8b5cf6');
        gradient.addColorStop(0.5, '#ec4899');
        gradient.addColorStop(1, '#06b6d4');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyserNode]);

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className={`
              h-12 w-12 rounded-full shadow-lg bg-background/95 backdrop-blur
              border border-border hover:bg-accent hover:text-accent-foreground
              transition-all duration-300
              ${isPlaying ? 'animate-pulse border-primary' : ''}
            `}
          >
            {isPlaying ? (
              <Volume2 className="h-5 w-5 text-primary" />
            ) : (
              <Music className="h-5 w-5" />
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent 
          className="w-80 p-4 bg-background/95 backdrop-blur border border-border shadow-xl"
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
            <div className="mb-3 p-2 rounded-lg bg-primary/10 border border-primary/20">
              <canvas
                ref={canvasRef}
                width={280}
                height={40}
                className="w-full rounded mb-2"
              />
              <div className="text-center">
                <p className="font-medium text-sm">{currentTrack.name}</p>
                <p className="text-xs text-muted-foreground">
                  {currentTrack.frequencyHz}Hz • {formatTime(elapsedTime)}
                </p>
              </div>
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
                    ${currentTrack?.id === track.id ? 'bg-primary/10 border border-primary/30' : ''}
                  `}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{track.name}</p>
                    <p className="text-xs text-muted-foreground">{track.benefit}</p>
                  </div>
                  {currentTrack?.id === track.id && isPlaying ? (
                    <Pause className="h-4 w-4 text-primary flex-shrink-0" />
                  ) : (
                    <Play className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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
    </div>
  );
}
