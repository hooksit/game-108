import React from 'react';
import { RoundResult } from '@game-108/shared';
import { Trophy, ArrowRight, AlertCircle } from 'lucide-react';
import { CardView } from '../Card/CardView';

interface RoundEndModalProps {
  result?: RoundResult;
  isHost: boolean;
  onNextRound: () => void;
}

export const RoundEndModal: React.FC<RoundEndModalProps> = ({
  result,
  isHost,
  onNextRound
}) => {
  if (!result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto p-6 rounded-3xl bg-[#1d1611] border border-amber-500/50 shadow-2xl flex flex-col items-center text-white text-center scrollbar-thin">
        {/* Trophy Header */}
        <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300 mb-3 shadow-[0_0_20px_rgba(216,175,92,0.4)]">
          <Trophy className="w-7 h-7" />
        </div>

        <h3 className="text-2xl font-black text-amber-200 tracking-wide">
          Раунд {result.roundNumber} завершён!
        </h3>
        <p className="text-sm text-white/80 mt-1 mb-4">
          Победитель раунда: <span className="font-bold text-amber-300">{result.winnerNickname}</span>
        </p>

        {/* Penalty Attack Information Block (6, 7, ♠K) */}
        {result.penaltyInfo && result.penaltyInfo.cards.length > 0 && (
          <div className="w-full mb-4 p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/50 shadow-inner flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-rose-300 font-bold text-xs mb-2 flex-wrap justify-center">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                Штраф за сброс{' '}
                <strong className="text-amber-300">
                  {result.penaltyInfo.attackCard.suit === 'SPADES' && result.penaltyInfo.attackCard.rank === 'K'
                    ? '♠ Пикового Короля'
                    : result.penaltyInfo.attackCard.rank}
                </strong>
                :
              </span>
              <span className="text-white font-extrabold">{result.penaltyInfo.victimNickname}</span>
              <span className="text-rose-400">получил (+{result.penaltyInfo.cards.length} карт из колоды):</span>
            </div>

            <div className="flex items-center justify-center gap-1.5 flex-wrap py-1">
              {result.penaltyInfo.cards.map((c) => (
                <div key={c.id} className="transform hover:scale-105 transition-transform">
                  <CardView card={c} size="sm" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Players Score Table */}
        <div className="w-full rounded-2xl bg-black/50 border border-white/10 overflow-hidden mb-6">
          <div className="grid grid-cols-4 px-3 py-2 bg-white/5 text-[10px] uppercase font-bold tracking-wider text-amber-200/70 border-b border-white/10">
            <span className="text-left col-span-2">Игрок</span>
            <span className="text-center">Раунд</span>
            <span className="text-right">Счёт</span>
          </div>

          <div className="divide-y divide-white/5">
            {result.players.map((p) => {
              const deltaPrefix = p.deltaScore > 0 ? `+${p.deltaScore}` : p.deltaScore;
              return (
                <div
                  key={p.id}
                  className={`grid grid-cols-4 items-center px-3 py-2.5 text-xs ${p.isWinner ? 'bg-amber-500/10' : ''}`}
                >
                  <div className="flex items-center gap-2 col-span-2 text-left min-w-0">
                    <img
                      src={`/assets/avatars/${p.avatar || 'player'}.png`}
                      alt={p.nickname}
                      className="w-7 h-7 rounded-full border border-amber-400/40 object-cover flex-shrink-0"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold truncate text-white">
                        {p.nickname} {p.isWinner && '👑'}
                      </span>
                      {p.specialEvent && (
                        <span className="text-[10px] font-bold text-amber-400">
                          {p.specialEvent === '107_RESET' && '⚡ 107 → 53!'}
                          {p.specialEvent === '108_RESET' && '🌟 108 → 0!'}
                          {p.specialEvent === 'ELIMINATED' && '❌ Выбывает (>108)'}
                          {p.specialEvent === 'QUEEN_BONUS_20' && '💎 Дама: -20!'}
                          {p.specialEvent === 'QUEEN_BONUS_40' && '👑 ♠Q: -40!'}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className={`text-center font-bold ${p.deltaScore < 0 ? 'text-emerald-400' : p.deltaScore > 0 ? 'text-rose-400' : 'text-white/60'}`}>
                    {deltaPrefix}
                  </span>

                  <span className={`text-right font-extrabold ${p.newScore > 108 ? 'text-rose-500 line-through' : 'text-amber-300'}`}>
                    {p.newScore}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Next Round Button */}
        {isHost ? (
          <button
            onClick={onNextRound}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 text-black font-bold text-base flex items-center justify-center gap-2 shadow-xl hover:brightness-110 active:scale-98 transition-all"
          >
            Следующий раунд
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <p className="text-xs text-amber-200/70 animate-pulse">
            Ожидание запуска следующего раунда создателем...
          </p>
        )}
      </div>
    </div>
  );
};
