import { Card, Suit } from './card.js';
import { GameStateView } from './game.js';

// Client -> Server events
export interface ClientToServerEvents {
  'room:create': (data: { nickname: string; avatar?: string }, callback: (response: { success: boolean; roomId?: string; error?: string }) => void) => void;
  'room:join': (data: { roomId: string; nickname: string; avatar?: string }, callback: (response: { success: boolean; error?: string }) => void) => void;
  'room:leave': () => void;
  'game:start': (callback?: (response: { success: boolean; error?: string }) => void) => void;
  
  'card:play': (data: { cardId: string }, callback?: (response: { success: boolean; error?: string }) => void) => void;
  'card:draw': (callback?: (response: { success: boolean; error?: string }) => void) => void;
  'card:pass': (callback?: (response: { success: boolean; error?: string }) => void) => void;
  
  'queen:selectSuit': (data: { suit: Suit }, callback?: (response: { success: boolean; error?: string }) => void) => void;
  
  'eight:draw': (callback?: (response: { success: boolean; error?: string }) => void) => void;
  'eight:stop': (callback?: (response: { success: boolean; error?: string }) => void) => void;
  'eight:select': (data: { cardId: string }, callback?: (response: { success: boolean; error?: string }) => void) => void;
  
  'round:next': (callback?: (response: { success: boolean; error?: string }) => void) => void;
  'chat:send': (data: { message: string }) => void;
}

// Server -> Client events
export interface ServerToClientEvents {
  'game:state': (state: GameStateView) => void;
  'game:error': (data: { message: string }) => void;
  'chat:message': (data: { senderId: string; nickname: string; message: string; timestamp: number }) => void;
  'action:notice': (data: { text: string; type?: 'info' | 'penalty' | 'win' | 'special' }) => void;
}
