import { type ChessPieceData, ChessPieceType } from '../types';
import { ChessColor } from "../types";

// Hilfsfunktion: Finde eine Figur an einer bestimmten Position
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

// Validierungslogik für Bauernzüge
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

	// 3. Diagonales Schlagen (wenn ein Gegner da ist)
	const targetPiece = getPieceAtPosition(targetX, targetY, pieces);
	return !!(Math.abs(targetX - currentX) === 1 &&
		targetY === currentY + direction &&
		targetPiece &&
		targetPiece.color !== piece.color);
}

// Validierungslogik für Springerzüge
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

// Validierungslogik für Turmzüge
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

// Validierungslogik für Läuferzüge
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

// Validierungslogik für Königinzüge
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

// Validierungslogik für Königszüge
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
		[currentX - 1, currentY - 1],
		[currentX + 1, currentY - 1],
		[currentX - 1, currentY + 1],
	];

	return possibleMoves.some(([x, y]) => x === targetX && y === targetY);
}

// **Hauptfunktion: Validiert einen bestimmten Zug**
export function validateMove(
	piece: ChessPieceData,
	[targetX, targetY]: [number, number],
	pieces: ChessPieceData[]
): boolean {
	switch (piece.type) {
		case ChessPieceType.Pawn:
			return validatePawnMove(piece, [targetX, targetY], pieces);
		case ChessPieceType.Knight:
			return validateKnightMove(piece, [targetX, targetY]);
		case ChessPieceType.Rook:
			return validateRookMove(piece, [targetX, targetY], pieces);
		case ChessPieceType.Bishop:
			return validateBishopMove(piece, [targetX, targetY], pieces);
		case ChessPieceType.Queen:
			return validateQueenMove(piece, [targetX, targetY], pieces);
		case ChessPieceType.King:
			return validateKingMove(piece, [targetX, targetY]);
		default:
			return false;
	}
}

// **Hauptfunktion: Gibt alle gültigen Züge für eine Figur zurück**
export function getValidMoves(
	piece: ChessPieceData,
	pieces: ChessPieceData[]
): [number, number][] {
	const possibleMoves: [number, number][] = [];

	// Das Spielfeld durchgehen
	for (let x = 0; x < 8; x++) {
		for (let y = 0; y < 8; y++) {
			if (validateMove(piece, [x, y], pieces)) {
				possibleMoves.push([x, y]);
			}
		}
	}

	return possibleMoves;
}