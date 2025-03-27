import type { ChessPiece, GameState } from "$lib/types/chess";
import { ChessColor } from "$lib/types/chess";
import { validateMove, getValidMoves } from "./moveValidation";
import { gameState } from "$lib/stores/gameStore";
import { lobbyId } from "$lib/stores/lobbyStore";
import { playerName } from "$lib/stores/playerStore";
import { get } from "svelte/store";

// Convert numeric coordinates to chess notation
function numericToChess(x: number, y: number): string {
	const file = String.fromCharCode('a'.charCodeAt(0) + x);
	const rank = 8 - y;
	return `${file}${rank}`;
}

// Convert chess notation to numeric coordinates
function chessToNumeric(position: string): [number, number] {
	const [file, rank] = position.split('');
	const x = file.charCodeAt(0) - 'a'.charCodeAt(0);
	const y = 8 - parseInt(rank);
	return [x, y];
}

// Find a piece at a specific position
export function getPieceAtPosition(
	x: number,
	y: number,
	pieces: ChessPiece[]
): ChessPiece | null {
	const position = numericToChess(x, y);
	return pieces.find(
		(piece) => piece.position === position
	) || null;
}

// Select a piece and calculate its possible moves
export function selectPiece(
	selectedPiece: ChessPiece | null,
	activePlayer: ChessColor,
	pieces: ChessPiece[],
): { selected: ChessPiece | null; moves: [number, number][] } {
	if (!selectedPiece) return { selected: null, moves: [] };
	if (selectedPiece.color !== activePlayer) return { selected: null, moves: [] };
	const validMoves = getValidMoves(selectedPiece, pieces);
	return {
		selected: selectedPiece,
		moves: validMoves
	};
}

// Movement logic for a piece
export async function moveTo(
	selectedPiece: ChessPiece | null,
	targetX: number,
	targetY: number,
	pieces: ChessPiece[],
	store: typeof gameState,
	activePlayer: ChessColor,
): Promise<{ resetSelection: () => void }> {
	if (!selectedPiece) return { resetSelection: () => {} };
	if (!validateMove(selectedPiece, targetX, targetY, pieces)) {
		console.error('Invalid move');
		return { resetSelection: () => {} };
	}

	const move = {
		pieceId: selectedPiece.position,
		targetPosition: numericToChess(targetX, targetY)
	};

	try {
		const currentState = get(store);
		const currentLobbyId = get(lobbyId);
		const currentPlayerName = get(playerName);
		
		if (!currentLobbyId) {
			console.error('Missing lobby ID');
			return { resetSelection: () => {} };
		}

		if (!currentPlayerName) {
			console.error('Missing player name');
			return { resetSelection: () => {} };
		}

		const response = await fetch(`/api/game/${currentLobbyId}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				playerName: currentPlayerName,
				move
			})
		});

		if (!response.ok) {
			const error = await response.json();
			console.error('Move failed:', error);
			throw new Error(error.error || 'Move failed');
		}

		const newState = await response.json();
		store.set(newState);

		return { resetSelection: () => {} };
	} catch (error) {
		console.error('Failed to send move:', error);
		throw error;
	}
}