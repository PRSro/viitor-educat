import { useRef, useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

const MAX_SESSION_DURATION = 4 * 60 * 60 * 1000;
const CROSSFADE_DURATION = 1500;

export interface Track {
  id: string;
  name: string;
  frequencyHz: number;
  benefit: string;
  duration: number;
  order: number;
  url?: string;
  audioUrl?: string;
}

export interface UseAudioPlayerReturn {
  isPlaying: boolean;
  currentTrack: Track | null;
  currentFrequency: number | null;
  volume: number;
  elapsedTime: number;
  analyserNode: AnalyserNode | null;
  play: (track: Track, volume?: number) => void;
  stop: () => void;
  setVolume: (vol: number) => void;
  duration: number;
  seekTo: (ms: number) => void;
  loopMode: 'track' | 'list' | 'off';
  shuffleMode: boolean;
  setLoopMode: (mode: 'track' | 'list' | 'off') => void;
  setShuffleMode: (enabled: boolean) => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

let ytApiLoaded = false;
let ytApiCallbacks: (() => void)[] = [];

function loadYTApi(callback: () => void) {
  if (ytApiLoaded && window.YT?.Player) {
    callback();
    return;
  }
  ytApiCallbacks.push(callback);
  if (document.getElementById('yt-iframe-api')) return;
  const script = document.createElement('script');
  script.id = 'yt-iframe-api';
  script.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(script);
  window.onYouTubeIframeAPIReady = () => {
    ytApiLoaded = true;
    ytApiCallbacks.forEach(cb => cb());
    ytApiCallbacks = [];
  };
}

let handleTimeUpdate: (() => void) | null = null;
let handleMeta: (() => void) | null = null;
let handleAudioEnded: (() => void) | null = null;

export function useAudioPlayer(): UseAudioPlayerReturn {
  const playerRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const pendingTrackRef = useRef<{ track: Track; volume: number } | null>(null);
  const pendingCancelRef = useRef<{ cancelled: boolean } | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const handleMetaRef = useRef<(() => void) | null>(null);
  const handleTimeUpdateRef = useRef<(() => void) | null>(null);
  const handleAudioEndedRef = useRef<(() => void) | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const originalVolumeRef = useRef(0.25);
  const tracksRef = useRef<Track[]>([]);
  const onTrackEndRef = useRef<(() => void) | null>(null);

  const [loopMode, setLoopModeState] = useState<'track' | 'list' | 'off'>('list');
  const [shuffleMode, setShuffleModeState] = useState(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [currentFrequency, setCurrentFrequency] = useState<number | null>(null);
  const [volume, setVolumeState] = useState(0.25);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (containerRef.current) return;
    const div = document.createElement('div');
    div.id = 'yt-player-container';
    div.style.cssText = 'position:fixed;bottom:-1000px;left:-1000px;width:1px;height:1px;opacity:0;pointer-events:none;';
    document.body.appendChild(div);
    containerRef.current = div;
    return () => { div.remove(); };
  }, []);

  const setLoopMode = useCallback((mode: 'track' | 'list' | 'off') => {
    setLoopModeState(mode);
  }, []);

  const setShuffleMode = useCallback((enabled: boolean) => {
    setShuffleModeState(enabled);
  }, []);

  const stop = useCallback(() => {
    if (pendingCancelRef.current) {
      pendingCancelRef.current.cancelled = true;
      pendingCancelRef.current = null;
    }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (fadeIntervalRef.current) { clearInterval(fadeIntervalRef.current); fadeIntervalRef.current = null; }
    if (audioRef.current) {
      audioRef.current.pause();
      if (handleTimeUpdateRef.current) audioRef.current.removeEventListener('timeupdate', handleTimeUpdateRef.current);
      if (handleMetaRef.current) audioRef.current.removeEventListener('loadedmetadata', handleMetaRef.current);
      if (handleAudioEndedRef.current) audioRef.current.removeEventListener('ended', handleAudioEndedRef.current);
      audioRef.current = null;
    }
    handleMetaRef.current = null;
    handleTimeUpdateRef.current = null;
    handleAudioEndedRef.current = null;
    try { playerRef.current?.stopVideo(); } catch {}
    try { playerRef.current?.destroy(); } catch {}
    playerRef.current = null;
    setIsPlaying(false);
    setCurrentTrack(null);
    setCurrentFrequency(null);
    setElapsedTime(0);
  }, []);

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    if (isPlaying) {
      try { playerRef.current?.setVolume(clamped * 100); } catch {}
      if (audioRef.current) {
        audioRef.current.volume = clamped;
      }
    }
  }, [isPlaying]);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      setElapsedTime(elapsed);
      if (elapsed >= MAX_SESSION_DURATION) {
        if (onTrackEndRef.current) onTrackEndRef.current();
      }
    }, 1000);
  }, []);

  const createPlayerAndPlay = useCallback((track: Track, vol: number, cancelRef: { cancelled: boolean }, tracks: Track[] = []) => {
    if (!containerRef.current) return;
    try { playerRef.current?.destroy(); } catch {}
    playerRef.current = null;

    const playerId = 'yt-player-' + Date.now();
    const playerDiv = document.createElement('div');
    playerDiv.id = playerId;
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(playerDiv);

    tracksRef.current = tracks;
    onTrackEndRef.current = () => {
      if (loopMode === 'track') {
        try { playerRef.current?.seekTo(0); } catch {}
        try { playerRef.current?.playVideo(); } catch {}
      } else if (loopMode === 'list' && tracks.length > 0) {
        const currentIndex = tracks.findIndex(t => t.id === track.id);
        const nextIndex = (currentIndex + 1) % tracks.length;
        if (nextIndex === 0 && currentIndex === tracks.length - 1) {
          stop();
          return;
        }
        const nextTrack = shuffleMode 
          ? tracks[Math.floor(Math.random() * tracks.length)]
          : tracks[nextIndex];
        if (pendingCancelRef.current) {
          pendingCancelRef.current.cancelled = true;
        }
        const newCancelRef = { cancelled: false };
        pendingCancelRef.current = newCancelRef;
        loadYTApi(() => {
          if (!newCancelRef.cancelled && isMountedRef.current) {
            createPlayerAndPlay(nextTrack, vol, newCancelRef, tracks);
          }
        });
      } else {
        stop();
      }
    };

    playerRef.current = new window.YT.Player(playerId, {
      videoId: track.url,
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        loop: loopMode === 'track' ? 1 : 0,
        playlist: loopMode === 'track' ? track.url : undefined,
        modestbranding: 1,
        origin: window.location.origin,
      },
      events: {
        onReady: (e: any) => {
          if (!isMountedRef.current || cancelRef.cancelled) {
            try { e.target.destroy(); } catch {}
            return;
          }
          const dur = e.target.getDuration();
          if (dur && dur > 0) {
            setDuration(dur * 1000);
          } else {
            setDuration(MAX_SESSION_DURATION);
          }
          e.target.playVideo();
          setIsPlaying(true);
          setCurrentTrack(track);
          setCurrentFrequency(track.frequencyHz);
          setVolumeState(vol);
          startTimer();
        },
        onStateChange: (e: any) => {
          if (e.data === window.YT.PlayerState.ENDED) {
            if (loopMode === 'track') {
              try { playerRef.current?.seekTo(0); } catch {}
              try { playerRef.current?.playVideo(); } catch {}
            } else if (onTrackEndRef.current) {
              onTrackEndRef.current();
            }
          }
        },
        onError: (e: any) => {
          console.error('YT player error:', e.data);
          toast.error(`Failed to load YouTube video for ${track.name}`);
          setDuration(MAX_SESSION_DURATION);
          setIsPlaying(true);
          setCurrentTrack(track);
          setCurrentFrequency(track.frequencyHz);
          startTimer();
        },
      },
    });
  }, [loopMode, shuffleMode, startTimer, stop]);

  const fadeOutAndPlay = useCallback((newTrack: Track, vol: number, tracks: Track[] = []) => {
    const targetVolume = vol;
    originalVolumeRef.current = targetVolume;
    const fadeSteps = 20;
    const stepDuration = CROSSFADE_DURATION / fadeSteps;
    const volumeStep = targetVolume / fadeSteps;
    let currentStep = 0;

    fadeIntervalRef.current = setInterval(() => {
      currentStep++;
      const newVol = Math.max(0, targetVolume - (volumeStep * currentStep));
      setVolumeState(newVol);
      if (audioRef.current) audioRef.current.volume = newVol;
      try { playerRef.current?.setVolume(newVol * 100); } catch {}

      if (currentStep >= fadeSteps) {
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
        
        if (newTrack.audioUrl) {
          try {
            playAudio(newTrack, vol, tracks);
          } catch (err) {
            console.warn('[AudioPlayer] playAudio failed in fadeOutAndPlay:', err);
            toast.error(`Failed to play "${newTrack.name}". The file may be unavailable.`);
          }
        } else if (newTrack.url) {
          if (pendingCancelRef.current) pendingCancelRef.current.cancelled = true;
          const cancelRef = { cancelled: false };
          pendingCancelRef.current = cancelRef;
          loadYTApi(() => {
            if (!cancelRef.cancelled && isMountedRef.current) {
              createPlayerAndPlay(newTrack, vol, cancelRef, tracks);
            }
          });
        }
        
        setTimeout(() => {
          let fadeBackStep = 0;
          fadeIntervalRef.current = setInterval(() => {
            fadeBackStep++;
            const fadeBackVol = (volumeStep * fadeBackStep);
            setVolumeState(Math.min(originalVolumeRef.current, fadeBackVol));
            if (audioRef.current) audioRef.current.volume = fadeBackVol;
            try { playerRef.current?.setVolume(fadeBackVol * 100); } catch {}
            if (fadeBackStep >= fadeSteps) {
              if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
              fadeIntervalRef.current = null;
            }
          }, stepDuration);
        }, 100);
      }
    }, stepDuration);
  }, [volume, setVolume, createPlayerAndPlay]);

  const playAudio = useCallback((track: Track, vol: number, tracks: Track[] = []) => {
    stop();
    const audio = new Audio(track.audioUrl);
    audio.volume = vol;
    audio.loop = loopMode === 'track';
    audioRef.current = audio;

    const onError = () => {
      console.error(`[AudioPlayer] Failed to load audio: ${track.audioUrl}`);
      toast.error(`Failed to load "${track.name}". The audio file may be unavailable.`);
      stop();
    };

    audio.addEventListener('error', onError);

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 64;
    }

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    try {
      sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audio);
      sourceNodeRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
    } catch (e) {
      console.warn('[AudioPlayer] Could not connect analyser:', e);
    }

    const onMeta = () => {
      setDuration(audio.duration * 1000);
    };
    const onTimeUpdate = () => {
      setElapsedTime(audio.currentTime * 1000);
      startTimeRef.current = Date.now() - audio.currentTime * 1000;
    };
    const onEnded = () => {
      if (loopMode === 'list' && tracks.length > 0) {
        const currentIndex = tracks.findIndex(t => t.id === track.id);
        const nextIndex = (currentIndex + 1) % tracks.length;
        if (nextIndex === 0 && currentIndex === tracks.length - 1) {
          stop();
          return;
        }
        const nextTrack = shuffleMode 
          ? tracks[Math.floor(Math.random() * tracks.length)]
          : tracks[nextIndex];
        fadeOutAndPlay(nextTrack, vol, tracks);
      } else {
        audio.currentTime = 0;
        if (loopMode !== 'track') {
          audio.play().catch(() => {});
        }
      }
    };

    handleMetaRef.current = onMeta;
    handleTimeUpdateRef.current = onTimeUpdate;
    handleAudioEndedRef.current = onEnded;

    audio.addEventListener('loadedmetadata', handleMetaRef.current);
    audio.addEventListener('timeupdate', handleTimeUpdateRef.current);
    audio.addEventListener('ended', handleAudioEndedRef.current);

    audio.play()
      .then(() => {
        setIsPlaying(true);
        setCurrentTrack(track);
        setCurrentFrequency(track.frequencyHz);
        setVolumeState(vol);
        startTimer();
      })
      .catch((err) => {
        console.warn('[AudioPlayer] Native audio play failed:', err);
        stop();
        toast.error(`Failed to play "${track.name}". The file may be unavailable.`);
      });
  }, [loopMode, shuffleMode, stop, startTimer, fadeOutAndPlay]);

  const seekTo = useCallback((ms: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = ms / 1000;
      setElapsedTime(ms);
      startTimeRef.current = Date.now() - ms;
      return;
    }
    try {
      playerRef.current?.seekTo(ms / 1000, true);
      setElapsedTime(ms);
      startTimeRef.current = Date.now() - ms;
    } catch (err) {
      console.warn('Failed to seek', err);
    }
  }, []);

  useEffect(() => () => stop(), [stop]);

  return {
    isPlaying,
    currentTrack,
    currentFrequency,
    volume,
    elapsedTime,
    analyserNode: analyserRef.current,
    play: (track: Track, initialVolume: number = 0.25, tracks: Track[] = []) => {
      if (isPlaying && currentTrack) {
        fadeOutAndPlay(track, initialVolume, tracks);
      } else {
        if (track.audioUrl) {
          playAudio(track, initialVolume, tracks);
        } else if (track.url) {
          if (pendingCancelRef.current) pendingCancelRef.current.cancelled = true;
          const cancelRef = { cancelled: false };
          pendingCancelRef.current = cancelRef;
          loadYTApi(() => {
            if (!cancelRef.cancelled && isMountedRef.current) {
              createPlayerAndPlay(track, initialVolume, cancelRef, tracks);
            }
          });
        } else {
          console.warn('No URL for track', track.name);
          toast.error(`Cannot play "${track.name}" - no audio source available`);
        }
      }
    },
    stop,
    setVolume,
    duration,
    seekTo,
    loopMode,
    shuffleMode,
    setLoopMode,
    setShuffleMode,
  };
}