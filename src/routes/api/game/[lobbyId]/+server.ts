import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { GameState } from '$lib/types/chess';
import { ChessColor } from '$lib/types/chess';
import { getGameState, updateGameState, getInitialState } from '$lib/scripts/serverGameState';
import { getLobbies } from '$lib/scripts/lobbyStore';
import * as Sentry from '@sentry/sveltekit';
import { resources } from '$lib/resources';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const lobbyId = params.lobbyId;

		// Check if lobby exists and is in playing state
		const lobbies = getLobbies();
		const lobby = lobbies.find((l) => l.id === lobbyId);

		if (!lobby || lobby.status !== 'playing') {
			Sentry.captureMessage('Game not found or not started', {
				level: 'error',
				extra: {
					errorMessage: resources.errors.server.validation.gameNotFound,
					lobbyId
				}
			});
			return json({ error: resources.errors.server.validation.gameNotFound }, { status: 404 });
		}

		const gameState = getGameState(lobbyId);
		return json(gameState);
	} catch (error) {
		Sentry.captureException(error, {
			extra: {
				errorMessage: resources.errors.common.fetchFailed
			}
		});
		return json({ error: resources.errors.common.fetchFailed }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const lobbyId = params.lobbyId;
		const { playerName, move } = await request.json();
		
		console.log(`[Game API] Making move for lobby ${lobbyId}`, { playerName, move });

		const lobbies = getLobbies();
		console.log(`[Game API] Found ${lobbies.length} lobbies in memory`);
		
		const lobby = lobbies.find((l) => l.id === lobbyId);
		if (!lobby) {
			console.error(`[Game API] Lobby ${lobbyId} not found in memory`);
			return json({ 
				error: resources.errors.server.validation.gameNotFound,
				lobbyIds: lobbies.map(l => l.id) 
			}, { status: 404 });
		}

		if (lobby.status !== 'playing') {
			console.error(`[Game API] Lobby ${lobbyId} is not in playing status: ${lobby.status}`);
			Sentry.captureMessage('Game not found or not started', {
				level: 'error',
				extra: {
					errorMessage: resources.errors.server.validation.gameNotFound,
					lobbyId,
					lobbyStatus: lobby.status
				}
			});
			return json({ error: resources.errors.server.validation.gameNotFound }, { status: 404 });
		}

		if (!move || !move.pieceId || !move.targetPosition) {
			console.error(`[Game API] Invalid move:`, move);
			Sentry.captureMessage('Invalid move', {
				level: 'error',
				extra: {
					errorMessage: resources.errors.server.validation.invalidMove,
					move
				}
			});
			return json({ error: resources.errors.server.validation.invalidMove }, { status: 400 });
		}

		const currentState = getGameState(lobbyId);
		console.log(`[Game API] Current game state has ${currentState.pieces.length} pieces`);
		
		// Log piece IDs to help with debugging
		console.log(`[Game API] Looking for piece ID: ${move.pieceId}`);
		console.log(`[Game API] Available piece IDs:`, currentState.pieces.map(p => p.id));
		console.log(`[Game API] Available piece positions:`, currentState.pieces.map(p => p.position));

		// Try to find the piece by ID or position 
		// (be flexible in case client sends position instead of ID or vice versa)
		let piece = currentState.pieces.find((p) => p.id === move.pieceId);
		
		// If piece not found by ID, try to find it by position (backward compatibility)
		if (!piece) {
			console.log(`[Game API] Piece not found by ID, trying position`);
			piece = currentState.pieces.find((p) => p.position === move.pieceId);
		}
		
		if (!piece) {
			console.error(`[Game API] Piece with ID or position ${move.pieceId} not found`);
			Sentry.captureMessage('Piece not found', {
				level: 'error',
				extra: {
					errorMessage: resources.errors.server.validation.pieceNotFound,
					pieceId: move.pieceId,
					availablePieces: currentState.pieces.map(p => ({ id: p.id, position: p.position }))
				}
			});
			return json({ error: resources.errors.server.validation.pieceNotFound }, { status: 400 });
		}
		
		console.log(`[Game API] Found piece:`, piece);

		const playerColor =
			lobby.slots.slot1?.player === playerName && lobby.slots.slot1?.color
				? lobby.slots.slot1.color === 'white'
					? ChessColor.White
					: ChessColor.Black
				: lobby.slots.slot2?.player === playerName && lobby.slots.slot2?.color
					? lobby.slots.slot2.color === 'white'
						? ChessColor.White
						: ChessColor.Black
					: null;

		if (!playerColor) {
			Sentry.captureMessage('Player not found in lobby', {
				level: 'error',
				extra: {
					errorMessage: resources.errors.server.validation.playerNotFound
				}
			});
			return json({ error: resources.errors.server.validation.playerNotFound }, { status: 400 });
		}

		if (currentState.activePlayer !== playerColor) {
			Sentry.captureMessage("Not player's turn", {
				level: 'error',
				extra: {
					errorMessage: resources.errors.server.validation.notYourTurn
				}
			});
			return json({ error: resources.errors.server.validation.notYourTurn }, { status: 400 });
		}

		if (piece.color !== playerColor) {
			Sentry.captureMessage("Cannot move opponent's pieces", {
				level: 'error',
				extra: {
					errorMessage: resources.errors.server.validation.cannotMoveOpponent
				}
			});
			return json(
				{ error: resources.errors.server.validation.cannotMoveOpponent },
				{ status: 400 }
			);
		}

		const targetPiece = currentState.pieces.find((p) => p.position === move.targetPosition);

		// Check if target position is occupied by a piece of the same color
		if (targetPiece && targetPiece.color === piece.color) {
			Sentry.captureMessage('Cannot capture own piece', {
				level: 'error',
				extra: {
					errorMessage: resources.errors.server.validation.invalidMove
				}
			});
			return json({ error: resources.errors.server.validation.invalidMove }, { status: 400 });
		}

		// Update the board
		const newPieces = currentState.pieces
			.filter((p) => p.position !== move.targetPosition) // Remove captured piece if any
			.map((p) => {
				// Update the piece if it matches by ID or if it matches by position
				if (p.id === move.pieceId || p.position === move.pieceId) {
					console.log(`[Game API] Moving piece from ${p.position} to ${move.targetPosition}`);
					return { ...p, position: move.targetPosition };
				}
				return p;
			});

		// If a piece was captured, add it to capturedPieces
		const newCapturedPieces = { ...currentState.capturedPieces };
		if (targetPiece) {
			if (targetPiece.color === ChessColor.White) {
				newCapturedPieces.white.push(targetPiece);
			} else {
				newCapturedPieces.black.push(targetPiece);
			}
		}

		// Create new game state
		const newState: GameState = {
			...currentState,
			pieces: newPieces,
			capturedPieces: newCapturedPieces,
			activePlayer:
				currentState.activePlayer === ChessColor.White ? ChessColor.Black : ChessColor.White,
			lastMove: move
		};

		// Update the game state
		updateGameState(lobbyId, newState);

		return json(newState);
	} catch (error) {
		Sentry.captureException(error, {
			extra: {
				errorMessage: resources.errors.common.updateFailed
			}
		});
		return json({ error: resources.errors.common.updateFailed }, { status: 500 });
	}
};
