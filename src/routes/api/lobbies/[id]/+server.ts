import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getLobbies, updateLobbies } from '$lib/scripts/lobbyStore';
import { deleteGameState } from '$lib/scripts/serverGameState';
import { gameState } from '$lib/scripts/gameState';
import { ChessColor } from '$lib/types/chess';
import * as Sentry from '@sentry/sveltekit';
import { resources } from '$lib/resources';

export const GET: RequestHandler = async ({ params }) => {
    try {
        const lobbyId = params.id;
        const currentLobbies = getLobbies();
        const lobby = currentLobbies.find(l => l.id === lobbyId);

        if (!lobby) {
            Sentry.captureMessage('Lobby not found', {
                level: 'error',
                extra: {
                    errorMessage: resources.errors.server.validation.lobbyNotFound,
                    lobbyId
                }
            });
            return json({ error: resources.errors.server.validation.lobbyNotFound }, { status: 404 });
        }

        return json(lobby);
    } catch (error) {
        Sentry.captureException(error, {
            extra: {
                errorMessage: resources.errors.common.fetchFailed
            }
        });
        return json({ error: resources.errors.common.fetchFailed }, { status: 500 });
    }
};

export const DELETE: RequestHandler = async ({ params, request }) => {
    try {
        const lobbyId = params.id;
        const body = await request.json();
        const { playerName } = body;

        if (!playerName) {
            Sentry.captureMessage('Missing player name', {
                level: 'error',
                extra: {
                    errorMessage: resources.errors.server.validation.playerNameRequired
                }
            });
            return json({ error: resources.errors.server.validation.playerNameRequired }, { status: 400 });
        }

        const currentLobbies = getLobbies();
        const lobby = currentLobbies.find(l => l.id === lobbyId);
        
        if (!lobby) {
            Sentry.captureMessage('Lobby not found', {
                level: 'error',
                extra: {
                    errorMessage: resources.errors.server.validation.lobbyNotFound,
                    lobbyId
                }
            });
            return json({ error: resources.errors.server.validation.lobbyNotFound }, { status: 404 });
        }

        // Get the other player's name
        const otherPlayer = lobby.slots.slot1?.player === playerName ? 
            lobby.slots.slot2?.player : 
            lobby.slots.slot1?.player;

        // Remove the lobby from the array
        const updatedLobbies = currentLobbies.filter(l => l.id !== lobbyId);
        updateLobbies(updatedLobbies);

        // Delete the game state if it exists
        deleteGameState(lobbyId);

        // Reset the game state store for both players
        gameState.set({
            pieces: [],
            activePlayer: ChessColor.White,
            capturedPieces: {
                white: [],
                black: []
            },
            status: null,
            reset: () => {}
        });

        return json({ 
            success: true,
            otherPlayer
        });
    } catch (error) {
        Sentry.captureException(error, {
            extra: {
                errorMessage: resources.errors.common.deleteFailed
            }
        });
        return json({ error: resources.errors.common.deleteFailed }, { status: 500 });
    }
}; 