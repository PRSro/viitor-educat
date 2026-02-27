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
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
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
    
    oscillatorsRef.current.forEach(osc => {
      osc.stop();
    });
    oscillatorsRef.current = [];
    oscillatorRef.current = null;
    
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
    const oscillator2 = ctx.createOscillator();
    const oscillator3 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    const analyser = ctx.createAnalyser();
    
    analyser.fftSize = 256;
    analyserRef.current = analyser;

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(track.frequencyHz, ctx.currentTime);

    oscillator2.type = 'sine';
    oscillator2.frequency.setValueAtTime(track.frequencyHz + 0.5, ctx.currentTime);

    oscillator3.type = 'sine';
    oscillator3.frequency.setValueAtTime(track.frequencyHz * 2, ctx.currentTime);

    const gain1 = ctx.createGain(); gain1.gain.value = 1.0;
    const gain2 = ctx.createGain(); gain2.gain.value = 0.3;
    const gain3 = ctx.createGain(); gain3.gain.value = 0.15;

    oscillator.connect(gain1); gain1.connect(filter);
    oscillator2.connect(gain2); gain2.connect(filter);
    oscillator3.connect(gain3); gain3.connect(filter);
    filter.connect(gain);
    gain.connect(analyser);
    analyser.connect(ctx.destination);
    
    oscillator.start();
    oscillator2.start();
    oscillator3.start();

    audioContextRef.current = ctx;
    oscillatorRef.current = oscillator;
    oscillatorsRef.current = [oscillator, oscillator2, oscillator3];
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
