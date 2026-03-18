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
  const startTimeRef = useRef<number>(0);
  const pendingTrackRef = useRef<{ track: Track; volume: number } | null>(null);

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
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    try { playerRef.current?.stopVideo(); } catch {}
    setIsPlaying(false);
    setCurrentTrack(null);
    setCurrentFrequency(null);
    setElapsedTime(0);
  }, []);

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    try { playerRef.current?.setVolume(clamped * 100); } catch {}
  }, []);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      setElapsedTime(elapsed);
      if (elapsed >= MAX_SESSION_DURATION) stop();
    }, 1000);
  }, [stop]);

  const createPlayerAndPlay = useCallback((track: Track, vol: number) => {
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
    loadYTApi(() => createPlayerAndPlay(track, initialVolume));
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
