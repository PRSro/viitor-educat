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

export function useAudioPlayer(): UseAudioPlayerReturn {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  // FIX BUG 3: initialize to Date.now() so remount doesn't immediately fire stop()
  const startTimeRef = useRef<number>(Date.now());
  const pendingTrackRef = useRef<{ track: Track; volume: number } | null>(null);
  // FIX BUG 1: cancel ref for pending YT player creation
  const pendingCancelRef = useRef<{ cancelled: boolean } | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [currentFrequency, setCurrentFrequency] = useState<number | null>(null);
  const [volume, setVolumeState] = useState(0.25);
  const [elapsedTime, setElapsedTime] = useState(0);

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
          // FIX BUG 1: if stop() was called before onReady, abandon this player
          if (cancelRef.cancelled) {
            try { e.target.destroy(); } catch {}
            return;
          }
          e.target.setVolume(vol * 100);
          e.target.playVideo();
          setIsPlaying(true);
          setCurrentTrack(track);
          setCurrentFrequency(track.frequencyHz);
          setVolumeState(vol);
          startTimer();
        },
        onError: (e: any) => {
          console.warn('YT player error', e.data);
          stop();
        },
      },
    });
  }, [startTimer, stop]);

  const play = useCallback((track: Track, initialVolume: number = 0.25) => {
    stop();
    if (!track.url) { console.warn('No YouTube ID for track', track.name); return; }
    // FIX BUG 1: create a fresh cancel ref for this play invocation
    const cancelRef = { cancelled: false };
    pendingCancelRef.current = cancelRef;
    loadYTApi(() => {
      if (cancelRef.cancelled) return;
      createPlayerAndPlay(track, initialVolume, cancelRef);
    });
  }, [stop, createPlayerAndPlay]);

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
  };
}
