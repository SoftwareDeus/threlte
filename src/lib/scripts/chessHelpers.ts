import type { ChessPieceData } from "../types";
import { ChessColor } from "../types";
import { validateMove, getValidMoves } from "./moveValidation"; // Importiere die neuen Funktionen
import { gameState } from "./gameState";

// Suche eine Figur an einer bestimmten Position
export function getPieceAtPosition(
	x: number,
	y: number,
	pieces: ChessPieceData[]
): ChessPieceData | null {
	return (
		pieces.find(
			(piece) => piece.position[0] === x && piece.position[1] === y
		) || null
	);
}

// Wähle eine Spielfigur aus und berechne ihre möglichen Züge
export function selectPiece(
	selectedPiece: ChessPieceData | null,
	activePlayer: ChessColor,
	pieces: ChessPieceData[],
): { selected: ChessPieceData | null; moves: [number, number][] } {
	// Wenn keine Figur gewählt wurde, Beenden
	if (!selectedPiece) return { selected: null, moves: [] };

	// Wenn die Figur nicht die des aktiven Spielers ist, beenden
	if (selectedPiece.color !== activePlayer) return { selected: null, moves: [] };

	// Finde alle gültigen Züge für die ausgewählte Figur
	const validMoves = getValidMoves(selectedPiece, pieces);

	return {
		selected: selectedPiece,
		moves: validMoves
	};
}

// Bewegungslogik für eine Figur
export function moveTo(
	selectedPiece: ChessPieceData | null,
	targetX: number,
	targetY: number,
	pieces: ChessPieceData[],
	store: typeof gameState,
	activePlayer: ChessColor,
): { resetSelection: boolean } {
	// Wenn keine Figur ausgewählt ist, beenden
	if (!selectedPiece) return { resetSelection: false };

	// Validieren, ob der Zug gültig ist
	const isValid = validateMove(selectedPiece, [targetX, targetY], pieces);
	if (!isValid) return { resetSelection: false };

	const updatedPieces = pieces.map((piece) => {
		// Wenn die ausgewählte Figur gefunden wurde, aktualisiere ihre Position
		if (piece.id === selectedPiece.id) {
			return {
				...piece,
				position: [targetX, targetY, piece.position[2]]
			};
		}
		// Entferne geschlagene Figuren an der Zielposition
		if (
			piece.position[0] === targetX &&
			piece.position[1] === targetY &&
			piece.color !== selectedPiece.color
		) {
			return null;
		}

		return piece;
	}).filter((piece): piece is ChessPieceData => piece !== null);

	// Aktualisiere den Spielstatus im Store
	store.set({
		pieces: updatedPieces,
		activePlayer: activePlayer === ChessColor.White ? ChessColor.Black : ChessColor.White,
		capturedPieces: {
			white: updatedPieces.filter((piece) => piece.color === ChessColor.Black),
			black: updatedPieces.filter((piece) => piece.color === ChessColor.White)
		}
	});

	// Auswahl zurücksetzen
	return { resetSelection: true };
}