import type { GameState } from '../types/chess';
import { ChessColor, ChessPieceType } from '../types/chess';

// Store game states for each lobby
const gameStates = new Map<string, GameState>();

// Create initial game state for a lobby
function getInitialState(lobbyId: string): GameState {
    // Initialize the board with pieces in their starting positions
    const board = [];
    const rows = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    
    // Add pawns
    for (let i = 0; i < 8; i++) {
        board.push({
            type: ChessPieceType.Pawn,
            color: ChessColor.White,
            position: `${rows[i]}2`
        });
        board.push({
            type: ChessPieceType.Pawn,
            color: ChessColor.Black,
            position: `${rows[i]}7`
        });
    }

    // Add other pieces
    const backRowPieces = [
        ChessPieceType.Rook,
        ChessPieceType.Knight,
        ChessPieceType.Bishop,
        ChessPieceType.Queen,
        ChessPieceType.King,
        ChessPieceType.Bishop,
        ChessPieceType.Knight,
        ChessPieceType.Rook
    ];

    for (let i = 0; i < 8; i++) {
        board.push({
            type: backRowPieces[i],
            color: ChessColor.White,
            position: `${rows[i]}1`
        });
        board.push({
            type: backRowPieces[i],
            color: ChessColor.Black,
            position: `${rows[i]}8`
        });
    }

    return {
        board,
        activePlayer: ChessColor.White,
        capturedPieces: {
            white: [],
            black: []
        },
        status: null,
        reset: () => {
            gameStates.set(lobbyId, getInitialState(lobbyId));
        }
    };
}

export function getGameState(lobbyId: string): GameState {
    if (!gameStates.has(lobbyId)) {
        gameStates.set(lobbyId, getInitialState(lobbyId));
    }
    return gameStates.get(lobbyId)!;
}

export function updateGameState(lobbyId: string, newState: GameState) {
    gameStates.set(lobbyId, newState);
}

export function deleteGameState(lobbyId: string) {
    gameStates.delete(lobbyId);
} 