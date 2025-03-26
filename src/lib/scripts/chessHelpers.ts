import type { ChessPieceData } from "../types";
import { getValidMoves, validateMove } from "./moveValidation";

export function selectPiece(
	piece: ChessPieceData,
	activePlayer: string,
	pieces: ChessPieceData[],
	event: MouseEvent
): { selected: ChessPieceData | null; moves: [number, number][] } {
	event.stopPropagation();

	if (piece.color === activePlayer) {
		const validMoves = getValidMoves(piece, pieces);
		return { selected: piece, moves: validMoves };
	} else {
		console.warn("Das ist nicht dein Zug!", { piece, activePlayer });
		return { selected: null, moves: [] };
	}
}

export function moveTo(
	selectedPiece: ChessPieceData | null,
	targetX: number,
	targetY: number,
	pieces: ChessPieceData[],
	gameState: any,
	activePlayer: string,
	event: MouseEvent
): { updatedState: any; resetSelection: boolean } {
	event.stopPropagation();

	if (!selectedPiece) {
		console.warn("Keine Figur ausgewählt!");
		return { updatedState: null, resetSelection: false };
	}

	if (validateMove(selectedPiece, [targetX, targetY], pieces)) {
		gameState.update((state: any) => {
			const pieceIndex = state.pieces.findIndex(
				(p: ChessPieceData) =>
					p.position[0] === selectedPiece.position[0] &&
					p.position[1] === selectedPiece.position[1]
			);

			if (pieceIndex === -1) {
				console.error("Fehler: Figur nicht gefunden.");
				return state;
			}

			const targetPieceIndex = state.pieces.findIndex(
				(p: ChessPieceData) => p.position[0] === targetX && p.position[1] === targetY
			);

			// Kollisions- oder Angriffslogik
			if (
				targetPieceIndex > -1 &&
				selectedPiece.color === state.pieces[targetPieceIndex].color
			) {
				console.warn("Ungültiger Zug: Figur deiner Farbe blockiert.");
				return state;
			}

			if (
				targetPieceIndex > -1 &&
				state.pieces[targetPieceIndex].color !== selectedPiece.color
			) {
				const capturedPiece = state.pieces[targetPieceIndex];
				if (selectedPiece.color === "white") {
					state.capturedPieces.white.push(capturedPiece);
				} else {
					state.capturedPieces.black.push(capturedPiece);
				}
				state.pieces.splice(targetPieceIndex, 1); // Gegner entfernen
			}

			// Bewegung durchführen
			state.pieces[pieceIndex].position = [targetX, targetY, 0];

			// Spieler wechseln
			state.activePlayer = activePlayer === "white" ? "black" : "white";
			return state;
		});
		return { updatedState: gameState, resetSelection: true };
	} else {
		console.warn("Ungültiger Zug!", { selectedPiece, target: [targetX, targetY] });
		return { updatedState: null, resetSelection: false };
	}
}