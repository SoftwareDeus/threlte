import type { GameState, ChessPiece } from '../types/chess';
import { ChessColor, ChessPieceType } from '../types/chess';

// Store game states for each lobby
const gameStates = new Map<string, GameState>();

// Create initial game state for a lobby
export function getInitialState(
	lobbyId: string,
	timeControl?: { minutes: number; increment: number }
): GameState {
	// Initialize the pieces in their starting positions
	const pieces: ChessPiece[] = [];
	const rows = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

	// Add pawns
	for (let i = 0; i < 8; i++) {
		pieces.push({
			id: `white-pawn-${i}`,
			type: ChessPieceType.Pawn,
			color: ChessColor.White,
			position: `${rows[i]}2`
		});
		pieces.push({
			id: `black-pawn-${i}`,
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
		pieces.push({
			id: `white-${backRowPieces[i]}-${i}`,
			type: backRowPieces[i],
			color: ChessColor.White,
			position: `${rows[i]}1`
		});
		pieces.push({
			id: `black-${backRowPieces[i]}-${i}`,
			type: backRowPieces[i],
			color: ChessColor.Black,
			position: `${rows[i]}8`
		});
	}

	const minutes = timeControl?.minutes || 10;
	const seconds = minutes * 60;

	return {
		pieces,
		activePlayer: ChessColor.White,
		capturedPieces: {
			white: [],
			black: []
		},
		status: null,
		timeControl: timeControl || { minutes: 10, increment: 0 },
		timeRemaining: {
			white: seconds,
			black: seconds
		},
		reset: () => {
			gameStates.set(lobbyId, getInitialState(lobbyId, timeControl));
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
