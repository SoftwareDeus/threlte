import { writable } from 'svelte/store';
import type { ChessPieceData, GameState, ChessPiece } from '$lib/types/chess';
import { ChessPieceType, ChessColor } from '$lib/types/chess';

let idCounter = 0;
function generateId(): string {
	return `piece_${idCounter++}`;
}

const startConfiguration: ChessPieceData[] = [
	{ id: generateId(), type: ChessPieceType.Rook, position: [0, 0, 0], color: ChessColor.Black },
	{ id: generateId(), type: ChessPieceType.Knight, position: [1, 0, 0], color: ChessColor.Black },
	{ id: generateId(), type: ChessPieceType.Bishop, position: [2, 0, 0], color: ChessColor.Black },
	{ id: generateId(), type: ChessPieceType.Queen, position: [3, 0, 0], color: ChessColor.Black },
	{ id: generateId(), type: ChessPieceType.King, position: [4, 0, 0], color: ChessColor.Black },
	{ id: generateId(), type: ChessPieceType.Bishop, position: [5, 0, 0], color: ChessColor.Black },
	{ id: generateId(), type: ChessPieceType.Knight, position: [6, 0, 0], color: ChessColor.Black },
	{ id: generateId(), type: ChessPieceType.Rook, position: [7, 0, 0], color: ChessColor.Black },
	...Array(8)
		.fill(null)
		.map(
			(_, i): ChessPieceData => ({
				id: generateId(),
				type: ChessPieceType.Pawn,
				position: [i, 1, 0],
				color: ChessColor.Black
			})
		),

	{ id: generateId(), type: ChessPieceType.Rook, position: [0, 7, 0], color: ChessColor.White },
	{ id: generateId(), type: ChessPieceType.Knight, position: [1, 7, 0], color: ChessColor.White },
	{ id: generateId(), type: ChessPieceType.Bishop, position: [2, 7, 0], color: ChessColor.White },
	{ id: generateId(), type: ChessPieceType.Queen, position: [3, 7, 0], color: ChessColor.White },
	{ id: generateId(), type: ChessPieceType.King, position: [4, 7, 0], color: ChessColor.White },
	{ id: generateId(), type: ChessPieceType.Bishop, position: [5, 7, 0], color: ChessColor.White },
	{ id: generateId(), type: ChessPieceType.Knight, position: [6, 7, 0], color: ChessColor.White },
	{ id: generateId(), type: ChessPieceType.Rook, position: [7, 7, 0], color: ChessColor.White },
	...Array(8)
		.fill(null)
		.map(
			(_, i): ChessPieceData => ({
				id: generateId(),
				type: ChessPieceType.Pawn,
				position: [i, 6, 0],
				color: ChessColor.White
			})
		)
];

function convertPosition(pos: [number, number, number]): string {
	const files = 'abcdefgh';
	const ranks = '87654321';
	return `${files[pos[0]]}${ranks[pos[1]]}`;
}

function convertPieceData(piece: ChessPieceData): ChessPiece {
	return {
		id: piece.id,
		type: piece.type,
		color: piece.color,
		position: convertPosition(piece.position)
	};
}

export const initialState: GameState = {
	pieces: startConfiguration.map(convertPieceData),
	activePlayer: ChessColor.White,
	capturedPieces: {
		white: [],
		black: []
	}
};

export const gameState = writable<GameState>(initialState);
