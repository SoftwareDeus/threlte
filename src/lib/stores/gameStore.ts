import { writable } from 'svelte/store';
import type { GameState } from '../types/chess';
import { ChessColor } from '../types/chess';

export const initialState: GameState = {
    board: [],
    activePlayer: ChessColor.White,
    capturedPieces: {
        white: [],
        black: []
    },
    status: null,
    playerName: undefined,
    reset: () => {
        // Reset logic will be implemented here
        gameState.set(initialState);
    }
};

export const gameState = writable<GameState>(initialState);
export const activePlayer = writable<ChessColor>(ChessColor.White); 