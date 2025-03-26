import type { ChessPieceData } from "../types";
import { ChessColor, ChessPieceType } from "../types";

// Hilfsfunktion: Finde eine Figur an einer bestimmten Position
function getPieceAtPosition(
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

// Validierungslogik für spezifische Figuren
function validatePawnMove(
	piece: ChessPieceData,
	[targetX, targetY]: [number, number],
	pieces: ChessPieceData[]
): boolean {
	const [currentX, currentY] = piece.position;
	const direction = piece.color === ChessColor.White ? -1 : 1;

	// 1. Ein Feld vorwärts (ohne Figur)
	if (
		targetX === currentX &&
		targetY === currentY + direction &&
		!getPieceAtPosition(targetX, targetY, pieces)
	) {
		return true;
	}

	// 2. Zwei Felder vorwärts (nur vom Startfeld aus)
	const startRow = piece.color === ChessColor.White ? 6 : 1;
	if (
		targetX === currentX &&
		targetY === currentY + 2 * direction &&
		currentY === startRow &&
		!getPieceAtPosition(targetX, targetY, pieces) &&
		!getPieceAtPosition(currentX, currentY + direction, pieces)
	) {
		return true;
	}

	// 3. Diagonales Schlagen (nur bei gegnerischer Figur)
	const targetPiece = getPieceAtPosition(targetX, targetY, pieces);
	if (
		Math.abs(targetX - currentX) === 1 &&
		targetY === currentY + direction &&
		targetPiece &&
		targetPiece.color !== piece.color
	) {
		return true;
	}

	return false;
}

function validateKnightMove(
	piece: ChessPieceData,
	[targetX, targetY]: [number, number]
): boolean {
	const [currentX, currentY] = piece.position;

	const possibleMoves = [
		[currentX + 2, currentY + 1],
		[currentX + 2, currentY - 1],
		[currentX - 2, currentY + 1],
		[currentX - 2, currentY - 1],
		[currentX + 1, currentY + 2],
		[currentX + 1, currentY - 2],
		[currentX - 1, currentY + 2],
		[currentX - 1, currentY - 2],
	];

	return possibleMoves.some(([x, y]) => x === targetX && y === targetY);
}

function validateRookMove(
	piece: ChessPieceData,
	[targetX, targetY]: [number, number],
	pieces: ChessPieceData[]
): boolean {
	const [currentX, currentY] = piece.position;

	if (currentX !== targetX && currentY !== targetY) {
		return false;
	}

	const directionX = Math.sign(targetX - currentX);
	const directionY = Math.sign(targetY - currentY);

	let currentPosX = currentX + directionX;
	let currentPosY = currentY + directionY;

	while (currentPosX !== targetX || currentPosY !== targetY) {
		if (getPieceAtPosition(currentPosX, currentPosY, pieces)) {
			return false;
		}

		currentPosX += directionX;
		currentPosY += directionY;
	}

	const targetPiece = getPieceAtPosition(targetX, targetY, pieces);
	return !targetPiece || targetPiece.color !== piece.color;
}

function validateBishopMove(
	piece: ChessPieceData,
	[targetX, targetY]: [number, number],
	pieces: ChessPieceData[]
): boolean {
	const [currentX, currentY] = piece.position;

	if (Math.abs(targetX - currentX) !== Math.abs(targetY - currentY)) {
		return false;
	}

	const directionX = Math.sign(targetX - currentX);
	const directionY = Math.sign(targetY - currentY);

	let currentPosX = currentX + directionX;
	let currentPosY = currentY + directionY;

	while (currentPosX !== targetX || currentPosY !== targetY) {
		if (getPieceAtPosition(currentPosX, currentPosY, pieces)) {
			return false;
		}

		currentPosX += directionX;
		currentPosY += directionY;
	}

	const targetPiece = getPieceAtPosition(targetX, targetY, pieces);
	return !targetPiece || targetPiece.color !== piece.color;
}

function validateQueenMove(
	piece: ChessPieceData,
	[targetX, targetY]: [number, number],
	pieces: ChessPieceData[]
): boolean {
	return (
		validateRookMove(piece, [targetX, targetY], pieces) ||
		validateBishopMove(piece, [targetX, targetY], pieces)
	);
}

function validateKingMove(
	piece: ChessPieceData,
	[targetX, targetY]: [number, number]
): boolean {
	const [currentX, currentY] = piece.position;
	const possibleMoves = [
		[currentX + 1, currentY],
		[currentX - 1, currentY],
		[currentX, currentY + 1],
		[currentX, currentY - 1],
		[currentX + 1, currentY + 1],
		[currentX - 1, currentY + 1],
		[currentX + 1, currentY - 1],
		[currentX - 1, currentY - 1],
	];

	return possibleMoves.some(([x, y]) => x === targetX && y === targetY);
}

// Hauptfunktion: Validierung eines Zuges basierend auf dem Figurtyp
export function validateMove(
	piece: ChessPieceData,
	target: [number, number],
	pieces: ChessPieceData[]
): boolean {
	switch (piece.type) {
		case ChessPieceType.Pawn:
			return validatePawnMove(piece, target, pieces);
		case ChessPieceType.Knight:
			return validateKnightMove(piece, target);
		case ChessPieceType.Rook:
			return validateRookMove(piece, target, pieces);
		case ChessPieceType.Bishop:
			return validateBishopMove(piece, target, pieces);
		case ChessPieceType.Queen:
			return validateQueenMove(piece, target, pieces);
		case ChessPieceType.King:
			return validateKingMove(piece, target);
		default:
			return false;
	}
}

// Funktion: Alle gültigen Züge einer Figur berechnen
export function getValidMoves(
	piece: ChessPieceData,
	pieces: ChessPieceData[]
): [number, number][] {
	const validMoves: [number, number][] = [];

	// Das Brett hat standardmäßig die Dimensionen 8x8
	const boardSize = 8;

	// Überprüfe alle potenziellen Zielkoordinaten auf dem Brett
	for (let x = 0; x < boardSize; x++) {
		for (let y = 0; y < boardSize; y++) {
			// Wenn der Zug gültig ist, füge die Koordinaten den möglichen Zügen hinzu
			if (validateMove(piece, [x, y], pieces)) {
				validMoves.push([x, y]);
			}
		}
	}

	return validMoves;
}