import { useRef, useCallback, useEffect, useState } from 'react';

const MAX_SESSION_DURATION = 4 * 60 * 60 * 1000;

export interface Track {
  id: string;
  name: string;
  frequencyHz: number;
  benefit: string;
  duration: number;
  order: number;
  url?: string; // YouTube video ID
  audioUrl?: string; // Direct audio URL: MP3, OGG, or stream URL
}

export interface UseAudioPlayerReturn {
  isPlaying: boolean;
  currentTrack: Track | null;
  currentFrequency: number | null;
  volume: number;
  elapsedTime: number;
  analyserNode: AnalyserNode | null; // always null with YT — kept for API compat
  play: (track: Track, volume?: number) => void;
  stop: () => void;
  setVolume: (vol: number) => void;
  duration: number;
  seekTo: (ms: number) => void;
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

  // Create hidden container for YT iframe once on mount
  useEffect(() => {
    if (containerRef.current) return;
    const div = document.createElement('div');
    div.id = 'yt-player-container';
    div.style.cssText = 'position:fixed;bottom:-1000px;left:-1000px;width:1px;height:1px;opacity:0;pointer-events:none;';
    document.body.appendChild(div);
    containerRef.current = div;
    return () => { div.remove(); };
  }, []);

  const stop = useCallback(() => {
    // FIX BUG 1: cancel any pending player creation before it fires onReady
    if (pendingCancelRef.current) {
      pendingCancelRef.current.cancelled = true;
      pendingCancelRef.current = null;
    }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    // Stop native audio
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
    // FIX BUG 2: only set volume on the player when it's actually playing
    if (isPlaying) {
      try { playerRef.current?.setVolume(clamped * 100); } catch {}
      if (audioRef.current) {
        audioRef.current.volume = clamped;
      }
    }
  }, [isPlaying]);

  const startTimer = useCallback(() => {
    // FIX BUG 3: always reset startTimeRef here so elapsed begins at 0
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      setElapsedTime(elapsed);
      if (elapsed >= MAX_SESSION_DURATION) stop();
    }, 1000);
  }, [stop]);

  const createPlayerAndPlay = useCallback((track: Track, vol: number, cancelRef: { cancelled: boolean }) => {
    if (!containerRef.current) return;
    // Destroy existing player
    try { playerRef.current?.destroy(); } catch {}
    playerRef.current = null;

    const playerId = 'yt-player-' + Date.now();
    const playerDiv = document.createElement('div');
    playerDiv.id = playerId;
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(playerDiv);

    playerRef.current = new window.YT.Player(playerId, {
      videoId: track.url,
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        loop: 1,
        playlist: track.url,
        modestbranding: 1,
        origin: window.location.origin,
      },
      events: {
        onReady: (e: any) => {
          if (!isMountedRef.current || cancelRef.cancelled) {
            try { e.target.destroy(); } catch {}
            return;
          }
          // FIX: Use fallback duration if YT duration is unavailable
          const dur = e.target.getDuration();
          if (dur && dur > 0) {
            setDuration(dur * 1000);
          } else {
            console.warn('[AudioPlayer] Could not get video duration, using fallback');
            setDuration(MAX_SESSION_DURATION); // 4 hours fallback
          }
          e.target.playVideo();
          setIsPlaying(true);
          setCurrentTrack(track);
          setCurrentFrequency(track.frequencyHz);
          setVolumeState(vol);
          startTimer();
        },
        onStateChange: (e: any) => {
          // Handle video ended - restart for looping
          if (e.data === window.YT.PlayerState.ENDED) {
            try { playerRef.current?.seekTo(0); } catch {}
            try { playerRef.current?.playVideo(); } catch {}
          }
        },
        onError: (e: any) => {
          console.error('YT player error:', e.data);
          // Fallback: play with estimated duration on error
          setDuration(MAX_SESSION_DURATION);
          setIsPlaying(true);
          setCurrentTrack(track);
          setCurrentFrequency(track.frequencyHz);
          startTimer();
        },
      },
    });
  }, [startTimer, stop]);

  const playAudio = useCallback((track: Track, vol: number) => {
    stop();
    const audio = new Audio(track.audioUrl);
    audio.volume = vol;
    audio.loop = true;
    audioRef.current = audio;

    const onMeta = () => {
      setDuration(audio.duration * 1000);
    };
    const onTimeUpdate = () => {
      setElapsedTime(audio.currentTime * 1000);
      startTimeRef.current = Date.now() - audio.currentTime * 1000;
    };
    const onEnded = () => {
      audio.currentTime = 0;
      audio.play().catch(() => {});
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
      });
  }, [stop, startTimer]);

  const play = useCallback((track: Track, initialVolume: number = 0.25) => {
    stop();
    if (track.audioUrl) {
      playAudio(track, initialVolume);
      return;
    }
    if (!track.url) {
      console.warn('No URL for track', track.name);
      return;
    }
    // FIX BUG 1: Explicitly cancel stale player
    if (pendingCancelRef.current) {
      pendingCancelRef.current.cancelled = true;
    }
    const cancelRef = { cancelled: false };
    pendingCancelRef.current = cancelRef;
    loadYTApi(() => {
      if (cancelRef.cancelled) return;
      if (!isMountedRef.current || cancelRef.cancelled) return;
      createPlayerAndPlay(track, initialVolume, cancelRef);
    });
  }, [stop, createPlayerAndPlay, playAudio]);

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
    analyserNode: null, // no Web Audio with YT — canvas visualizer will be idle
    play,
    stop,
    setVolume,
    duration,
    seekTo,
  };
}
