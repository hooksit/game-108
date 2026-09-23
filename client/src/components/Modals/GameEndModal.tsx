import React, { useEffect } from 'react';
import { PlayerPublic } from '@game-108/shared';
import confetti from 'canvas-confetti';
import { Award, RotateCcw } from 'lucide-react';

interface GameEndModalProps {
  winner?: PlayerPublic;
  roundCount: number;
  onRestart: () => void;
}

export const GameEndModal: React.FC<GameEndModalProps> = ({
  winner,
  roundCount,
  onRestart
}) => {
  useEffect(() => {
    // Fire festive fireworks confetti
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#dfb76c', '#ffffff', '#22c55e']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#dfb76c', '#ffffff', '#ef4444']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  if (!winner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="w-full max-w-sm p-6 sm:p-8 rounded-3xl bg-[#1d1611] border-2 border-amber-400 shadow-2xl flex flex-col items-center text-white text-center">
        <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-300 mb-4 shadow-[0_0_30px_rgba(216,175,92,0.6)]">
          <Award className="w-10 h-10" />
        </div>

        <h2 className="text-3xl font-black text-amber-300 tracking-wider mb-1">
          ПОБЕДА!
        </h2>
        
        <p className="text-sm text-white/70 mb-5">
          Победитель партии «108»:
        </p>

        <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-black/50 border border-white/10 w-full mb-6">
          <img
            src={`/assets/avatars/${winner.avatar || 'player'}.png`}
            alt={winner.nickname}
            className="w-16 h-16 rounded-full border-2 border-amber-400 object-cover shadow-lg"
          />
          <span className="text-xl font-bold text-white">
            {winner.nickname}
          </span>
          <span className="text-xs text-amber-300 font-semibold">
            Итоговый счёт: {winner.score} • Сыграно раундов: {roundCount}
          </span>
        </div>

        <button
          onClick={onRestart}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 text-black font-bold text-base flex items-center justify-center gap-2 shadow-xl hover:brightness-110 active:scale-98 transition-all"
        >
          <RotateCcw className="w-5 h-5" />
          В главное меню
        </button>
      </div>
    </div>
  );
};
