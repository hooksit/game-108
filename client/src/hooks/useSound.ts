import { useState, useCallback, useRef } from 'react';

export type SoundType = 'deal' | 'play' | 'penalty' | 'victory' | 'pass';

export function useSound() {
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('sound_muted') === 'true';
  });

  const audioCache = useRef<Record<string, HTMLAudioElement>>({});

  const playSound = useCallback((type: SoundType) => {
    if (isMuted) return;

    try {
      let audio = audioCache.current[type];
      if (!audio) {
        audio = new Audio(`/assets/sounds/${type}.wav`);
        audioCache.current[type] = audio;
      }
      audio.currentTime = 0;
      audio.volume = type === 'victory' ? 0.6 : 0.45;
      audio.play().catch(() => {
        // Browser autoplay policy might block before user interaction
      });
    } catch {
      // Audio fallback silent
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem('sound_muted', String(next));
      return next;
    });
  }, []);

  return {
    isMuted,
    toggleMute,
    playSound
  };
}
