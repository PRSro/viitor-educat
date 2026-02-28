import { useRef, useCallback, useEffect, useState } from 'react';

const MAX_SESSION_DURATION = 4 * 60 * 60 * 1000;

export interface Track {
  id: string;
  name: string;
  frequencyHz: number;
  benefit: string;
  duration: number;
  order: number;
  url?: string | null;
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
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrequency, setCurrentFrequency] = useState<number | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [volume, setVolumeState] = useState(0.5);
  const [elapsedTime, setElapsedTime] = useState(0);

  const stop = useCallback(() => {
    console.log('[AudioPlayer] Stopping playback');
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop oscillators if running
    oscillatorsRef.current.forEach(osc => { try { osc.stop(); } catch { } });
    oscillatorsRef.current = [];
    oscillatorRef.current = null;

    // Stop audio element if running
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.src = '';
      audioElementRef.current = null;
    }

    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(e => console.error('[AudioPlayer] Context close error:', e));
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    gainRef.current = null;
    setIsPlaying(false);
    setCurrentFrequency(null);
    setCurrentTrack(null);
    setElapsedTime(0);
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    const v = Math.max(0, Math.min(1, newVolume));
    setVolumeState(v);

    if (gainRef.current && audioContextRef.current) {
      gainRef.current.gain.setTargetAtTime(v, audioContextRef.current.currentTime, 0.1);
    }
  }, []);

  const play = useCallback(async (track: Track, initialVolume: number = 0.5) => {
    stop();

    setCurrentFrequency(track.frequencyHz);
    setCurrentTrack(track);
    setIsPlaying(true);
    startTimeRef.current = Date.now();

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ctx;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(initialVolume, ctx.currentTime);
      gainRef.current = gain;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      // Final output chain: source -> gain -> analyser -> destination
      gain.connect(analyser);
      analyser.connect(ctx.destination);

      if (track.url) {
        console.log(`[AudioPlayer] Attempting MP3 playback: ${track.url}`);
        const audio = new Audio();
        audio.src = track.url;
        audio.loop = true;
        audio.crossOrigin = 'anonymous';

        // This connects the HTML5 Audio element to the Web Audio graph
        const source = ctx.createMediaElementSource(audio);
        source.connect(gain);
        sourceNodeRef.current = source;
        audioElementRef.current = audio;

        await audio.play();
        console.log('[AudioPlayer] MP3 playback started successfully');
      } else {
        console.log(`[AudioPlayer] Playing Oscillator: ${track.frequencyHz}Hz`);
        const oscillator = ctx.createOscillator();
        const oscillator2 = ctx.createOscillator();
        const oscillator3 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, ctx.currentTime);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(track.frequencyHz, ctx.currentTime);
        oscillator2.type = 'sine';
        oscillator2.frequency.setValueAtTime(track.frequencyHz + 0.5, ctx.currentTime);
        oscillator3.type = 'sine';
        oscillator3.frequency.setValueAtTime(track.frequencyHz * 2, ctx.currentTime);

        const g1 = ctx.createGain(); g1.gain.value = 1.0;
        const g2 = ctx.createGain(); g2.gain.value = 0.3;
        const g3 = ctx.createGain(); g3.gain.value = 0.15;

        oscillator.connect(g1); g1.connect(filter);
        oscillator2.connect(g2); g2.connect(filter);
        oscillator3.connect(g3); g3.connect(filter);
        filter.connect(gain);

        oscillator.start();
        oscillator2.start();
        oscillator3.start();

        oscillatorRef.current = oscillator;
        oscillatorsRef.current = [oscillator, oscillator2, oscillator3];
      }

      // Resume context if suspended (common in browsers until user gesture)
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

    } catch (err) {
      console.error('[AudioPlayer] Playback error:', err);
      setIsPlaying(false);
      stop();
    }

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      setElapsedTime(elapsed);
      if (elapsed >= MAX_SESSION_DURATION) stop();
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
