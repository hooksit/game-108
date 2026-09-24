import { useState, useCallback, useRef } from 'react';

export type SoundType = 'deal' | 'draw' | 'play' | 'penalty' | 'victory' | 'pass' | 'message';

const SOUND_FILES: Record<SoundType, string> = {
  play: '/assets/sounds/play.mp3',       // Положил карту на стол
  draw: '/assets/sounds/draw.mp3',       // взял карту из колоды
  deal: '/assets/sounds/deal.mp3',       // начало игры раздача карт
  pass: '/assets/sounds/pass.mp3',       // Постучали колодой - пас
  penalty: '/assets/sounds/penalty.wav',
  victory: '/assets/sounds/victory.wav',
  message: '/assets/sounds/message.wav'
};

export function useSound() {
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('sound_muted') === 'true';
  });

  const audioCache = useRef<Record<string, HTMLAudioElement>>({});

  const playSound = useCallback((type: SoundType) => {
    if (isMuted) return;

    try {
      const src = SOUND_FILES[type];
      if (!src) return;

      let audio = audioCache.current[type];
      if (!audio) {
        audio = new Audio(src);
        audioCache.current[type] = audio;
      }
      
      const soundToPlay = audio.paused ? audio : (audio.cloneNode() as HTMLAudioElement);
      soundToPlay.currentTime = 0;
      soundToPlay.volume = type === 'victory' ? 0.7 : type === 'deal' ? 0.6 : 0.65;
      soundToPlay.play().catch(() => {
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
