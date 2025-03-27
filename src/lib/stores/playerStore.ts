import { writable } from 'svelte/store';
import { ChessColor } from '../types/chess';

export const playerName = writable<string>('');
export const playerColor = writable<ChessColor | null>(null);
export const whitePlayerName = writable<string>('');
export const blackPlayerName = writable<string>(''); 