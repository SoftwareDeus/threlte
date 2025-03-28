import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { GameState } from '$lib/types/chess';
import { ChessColor } from '$lib/types/chess';
import { getGameState, updateGameState } from '$lib/scripts/serverGameState';
import { getLobbies } from '$lib/scripts/lobbyStore';
import * as Sentry from '@sentry/sveltekit';
import { resources } from '$lib/resources';

export const GET: RequestHandler = async ({ params }) => {
    try {
        const lobbyId = params.lobbyId;
        
        // Check if lobby exists and is in playing state
        const lobbies = getLobbies();
        const lobby = lobbies.find(l => l.id === lobbyId);
        
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
        
        // Check if lobby exists and is in playing state
        const lobbies = getLobbies();
        const lobby = lobbies.find(l => l.id === lobbyId);
        
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

        // Validate move
        if (!move || !move.pieceId || !move.targetPosition) {
            Sentry.captureMessage('Invalid move', {
                level: 'error',
                extra: {
                    errorMessage: resources.errors.server.validation.invalidMove
                }
            });
            return json({ error: resources.errors.server.validation.invalidMove }, { status: 400 });
        }

        const currentState = getGameState(lobbyId);

        // Find the piece being moved
        const piece = currentState.pieces.find(p => p.position === move.pieceId);
        if (!piece) {
            Sentry.captureMessage('Piece not found', {
                level: 'error',
                extra: {
                    errorMessage: resources.errors.server.validation.pieceNotFound
                }
            });
            return json({ error: resources.errors.server.validation.pieceNotFound }, { status: 400 });
        }

        // Determine player's color from lobby
        const playerColor = lobby.slots.slot1?.player === playerName && lobby.slots.slot1?.color ? 
                       (lobby.slots.slot1.color === 'white' ? ChessColor.White : ChessColor.Black) :
                       lobby.slots.slot2?.player === playerName && lobby.slots.slot2?.color ?
                       (lobby.slots.slot2.color === 'white' ? ChessColor.White : ChessColor.Black) :
                       null;

        if (!playerColor) {
            Sentry.captureMessage('Player not found in lobby', {
                level: 'error',
                extra: {
                    errorMessage: resources.errors.server.validation.playerNotFound
                }
            });
            return json({ error: resources.errors.server.validation.playerNotFound }, { status: 400 });
        }

        // Check if it's the player's turn and they're moving their own pieces
        if (currentState.activePlayer !== playerColor) {
            Sentry.captureMessage('Not player\'s turn', {
                level: 'error',
                extra: {
                    errorMessage: resources.errors.server.validation.notYourTurn
                }
            });
            return json({ error: resources.errors.server.validation.notYourTurn }, { status: 400 });
        }

        if (piece.color !== playerColor) {
            Sentry.captureMessage('Cannot move opponent\'s pieces', {
                level: 'error',
                extra: {
                    errorMessage: resources.errors.server.validation.cannotMoveOpponent
                }
            });
            return json({ error: resources.errors.server.validation.cannotMoveOpponent }, { status: 400 });
        }

        // Check if target position is occupied by a piece of the same color
        const targetPiece = currentState.pieces.find(p => p.position === move.targetPosition);
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
            .filter(p => p.position !== move.targetPosition) // Remove captured piece if any
            .map(p => {
                if (p.position === move.pieceId) {
                    return { ...p, position: move.targetPosition };
                }
                return p;
            });

        // If a piece was captured, add it to capturedPieces
        let newCapturedPieces = { ...currentState.capturedPieces };
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
            activePlayer: currentState.activePlayer === ChessColor.White ? ChessColor.Black : ChessColor.White,
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