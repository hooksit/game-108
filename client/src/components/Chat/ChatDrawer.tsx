import React, { useState, useRef, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { ChatMessage } from '../../hooks/useGameSocket';

interface ChatDrawerProps {
  isOpen: boolean;
  messages: ChatMessage[];
  myPlayerId: string;
  onClose: () => void;
  onSendMessage: (msg: string) => void;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  messages,
  myPlayerId,
  onClose,
  onSendMessage
}) => {
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text.trim());
    setText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xs sm:max-w-sm h-full bg-[#1b1511] border-l border-amber-500/30 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 text-white">
          <h3 className="font-bold text-amber-200 tracking-wide text-sm">
            Игровой чат
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/50 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-white/40 italic">
              Здесь будут сообщения игроков
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.senderId === myPlayerId;
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] text-amber-400/80 mb-0.5 px-1 font-semibold">
                    {isMe ? 'Вы' : m.nickname}
                  </span>
                  <div
                    className={`
                      px-3 py-2 rounded-2xl text-xs max-w-[85%] break-words
                      ${isMe
                        ? 'bg-amber-600/30 text-amber-100 border border-amber-500/40 rounded-br-none'
                        : 'bg-black/40 text-white/90 border border-white/10 rounded-bl-none'
                      }
                    `}
                  >
                    {m.message}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Field */}
        <form onSubmit={handleSend} className="p-3 border-t border-white/10 flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Сообщение..."
            maxLength={100}
            className="flex-1 px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400 transition-colors shadow-inner"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="p-2.5 rounded-xl bg-amber-500 text-black hover:brightness-110 active:scale-95 transition-all disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
