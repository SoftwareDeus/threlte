import type { ChessPiece } from '$lib/types/chess';
import { ChessColor, ChessPieceType } from '$lib/types/chess';

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

// Helper function: Find a piece at a specific position
export function getPieceAtPosition(x: number, y: number, pieces: ChessPiece[]): ChessPiece | null {
	const position = numericToChess(x, y);
	return pieces.find((piece) => piece.position === position) || null;
}

// Validation logic for pawn moves
function validatePawnMove(
	piece: ChessPiece,
	targetX: number,
	targetY: number,
	pieces: ChessPiece[]
): boolean {
	const [currentX, currentY] = chessToNumeric(piece.position);
	const direction = piece.color === ChessColor.White ? -1 : 1;

	// 1. One square forward (no piece)
	if (
		targetX === currentX &&
		targetY === currentY + direction &&
		!getPieceAtPosition(targetX, targetY, pieces)
	) {
		return true;
	}

	// 2. Two squares forward (only from starting position)
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

	// 3. Diagonal capture (if opponent is there)
	const targetPiece = getPieceAtPosition(targetX, targetY, pieces);
	return !!(
		Math.abs(targetX - currentX) === 1 &&
		targetY === currentY + direction &&
		targetPiece &&
		targetPiece.color !== piece.color
	);
}

// Validation logic for knight moves
function validateKnightMove(piece: ChessPiece, targetX: number, targetY: number): boolean {
	const [currentX, currentY] = chessToNumeric(piece.position);
	const dx = Math.abs(targetX - currentX);
	const dy = Math.abs(targetY - currentY);
	return (dx === 2 && dy === 1) || (dx === 1 && dy === 2);
}

// Validation logic for rook moves
function validateRookMove(
	piece: ChessPiece,
	targetX: number,
	targetY: number,
	pieces: ChessPiece[]
): boolean {
	const [currentX, currentY] = chessToNumeric(piece.position);
	if (targetX !== currentX && targetY !== currentY) return false;

	// Check if path is clear
	const dx = Math.sign(targetX - currentX);
	const dy = Math.sign(targetY - currentY);
	let x = currentX + dx;
	let y = currentY + dy;

	while (x !== targetX || y !== targetY) {
		if (getPieceAtPosition(x, y, pieces)) return false;
		x += dx;
		y += dy;
	}

	return true;
}

// Validation logic for bishop moves
function validateBishopMove(
	piece: ChessPiece,
	targetX: number,
	targetY: number,
	pieces: ChessPiece[]
): boolean {
	const [currentX, currentY] = chessToNumeric(piece.position);
	if (Math.abs(targetX - currentX) !== Math.abs(targetY - currentY)) return false;

	// Check if path is clear
	const dx = Math.sign(targetX - currentX);
	const dy = Math.sign(targetY - currentY);
	let x = currentX + dx;
	let y = currentY + dy;

	while (x !== targetX || y !== targetY) {
		if (getPieceAtPosition(x, y, pieces)) return false;
		x += dx;
		y += dy;
	}

	return true;
}

// Validation logic for queen moves
function validateQueenMove(
	piece: ChessPiece,
	targetX: number,
	targetY: number,
	pieces: ChessPiece[]
): boolean {
	return (
		validateRookMove(piece, targetX, targetY, pieces) ||
		validateBishopMove(piece, targetX, targetY, pieces)
	);
}

// Validation logic for king moves
function validateKingMove(piece: ChessPiece, targetX: number, targetY: number): boolean {
	const [currentX, currentY] = chessToNumeric(piece.position);
	const dx = Math.abs(targetX - currentX);
	const dy = Math.abs(targetY - currentY);
	return dx <= 1 && dy <= 1;
}

export function validateMove(
	piece: ChessPiece,
	targetX: number,
	targetY: number,
	pieces: ChessPiece[]
): boolean {
	// Check if target position has a piece of the same color
	const targetPiece = getPieceAtPosition(targetX, targetY, pieces);
	if (targetPiece && targetPiece.color === piece.color) {
		return false;
	}

	switch (piece.type) {
		case ChessPieceType.Pawn:
			return validatePawnMove(piece, targetX, targetY, pieces);
		case ChessPieceType.Knight:
			return validateKnightMove(piece, targetX, targetY);
		case ChessPieceType.Bishop:
			return validateBishopMove(piece, targetX, targetY, pieces);
		case ChessPieceType.Rook:
			return validateRookMove(piece, targetX, targetY, pieces);
		case ChessPieceType.Queen:
			return validateQueenMove(piece, targetX, targetY, pieces);
		case ChessPieceType.King:
			return validateKingMove(piece, targetX, targetY);
		default:
			return false;
	}
}

export function getValidMoves(piece: ChessPiece, pieces: ChessPiece[]): [number, number][] {
	const moves: [number, number][] = [];

	// Check all possible positions
	for (let x = 0; x < 8; x++) {
		for (let y = 0; y < 8; y++) {
			if (validateMove(piece, x, y, pieces)) {
				moves.push([x, y]);
			}
		}
	}

	return moves;
}
