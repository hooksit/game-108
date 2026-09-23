import React, { useState, useEffect } from 'react';
import { Menu, Signal, Copy, Check, Volume2, VolumeX } from 'lucide-react';

interface TopBarProps {
  roundNumber: number;
  roomId?: string;
  isMuted?: boolean;
  onToggleSound?: () => void;
  onOpenMenu?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  roundNumber,
  roomId,
  isMuted = false,
  onToggleSound,
  onOpenMenu
}) => {
  const [time, setTime] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const copyRoomId = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="relative z-30 flex items-center justify-between w-full px-4 py-2 text-white">
      {/* Left: Menu button & Round number */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMenu}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md active:scale-95 transition-all text-amber-200/90 hover:text-amber-100"
          title="Меню"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-amber-200/60 font-medium">Партия</span>
          <span className="text-sm font-bold text-amber-100 tracking-wide">
            {roundNumber > 0 ? `${roundNumber}/12` : 'Лобби'}
          </span>
        </div>
      </div>

      {/* Center: Room Code Badge */}
      {roomId && (
        <button
          onClick={copyRoomId}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-amber-500/30 text-amber-200 text-xs font-semibold backdrop-blur-md hover:bg-black/60 transition-all active:scale-95"
          title="Нажмите чтобы скопировать код"
        >
          <span className="text-white/60">Код:</span>
          <span className="font-mono tracking-widest text-amber-300">{roomId}</span>
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-white/50" />}
        </button>
      )}

      {/* Right: Sound toggle, Clock & Signal */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md">
        {onToggleSound && (
          <button
            onClick={onToggleSound}
            className="p-1 text-amber-200/80 hover:text-amber-100 transition-colors active:scale-90"
            title={isMuted ? 'Включить звук' : 'Выключить звук'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-white/40" /> : <Volume2 className="w-4 h-4 text-amber-300" />}
          </button>
        )}
        <span className="text-xs font-semibold tracking-wider text-white/90">{time}</span>
        <Signal className="w-4 h-4 text-emerald-400" />
      </div>
    </header>
  );
};
