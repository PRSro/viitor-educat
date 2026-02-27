import { useRef, useCallback, useEffect, useState } from 'react';

const MAX_SESSION_DURATION = 4 * 60 * 60 * 1000;

export interface Track {
  id: string;
  name: string;
  frequencyHz: number;
  benefit: string;
  duration: number;
  order: number;
}

export interface UseAudioPlayerReturn {
  isPlaying: boolean;
  currentFrequency: number | null;
  currentTrack: Track | null;
  volume: number;
  elapsedTime: number;
  analyserNode: AnalyserNode | null;
  play: (track: Track, volume?: number) => void;
  stop: () => void;
  setVolume: (volume: number) => void;
}

export function useAudioPlayer(): UseAudioPlayerReturn {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrequency, setCurrentFrequency] = useState<number | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [volume, setVolumeState] = useState(0.5);
  const [elapsedTime, setElapsedTime] = useState(0);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    analyserRef.current = null;
    setIsPlaying(false);
    setCurrentFrequency(null);
    setCurrentTrack(null);
    setElapsedTime(0);
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    
    if (gainRef.current && audioContextRef.current) {
      gainRef.current.gain.setValueAtTime(clampedVolume, audioContextRef.current.currentTime);
    }
  }, []);

  const play = useCallback((track: Track, initialVolume: number = 0.5) => {
    stop();

    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const analyser = ctx.createAnalyser();
    
    analyser.fftSize = 256;
    analyserRef.current = analyser;

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(track.frequencyHz, ctx.currentTime);
    
    const clampedVolume = Math.max(0, Math.min(1, initialVolume));
    gain.gain.setValueAtTime(clampedVolume, ctx.currentTime);
    setVolumeState(clampedVolume);

    oscillator.connect(gain);
    gain.connect(analyser);
    analyser.connect(ctx.destination);
    
    oscillator.start();

    audioContextRef.current = ctx;
    oscillatorRef.current = oscillator;
    gainRef.current = gain;
    
    setCurrentFrequency(track.frequencyHz);
    setCurrentTrack(track);
    setIsPlaying(true);
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      setElapsedTime(elapsed);
      
      if (elapsed >= MAX_SESSION_DURATION) {
        stop();
      }
    }, 1000);
  }, [stop]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    isPlaying,
    currentFrequency,
    currentTrack,
    volume,
    elapsedTime,
    analyserNode: analyserRef.current,
    play,
    stop,
    setVolume,
  };
}
