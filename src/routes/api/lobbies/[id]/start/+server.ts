import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { BackendLobbyService } from '$lib/services/backend/lobbyService';
import * as Sentry from '@sentry/sveltekit';
import { resources } from '$lib/resources';
import { updateLobby, getLobby as getMemoryLobby } from '$lib/scripts/lobbyStore';
import { getInitialState, updateGameState, deleteGameState } from '$lib/scripts/serverGameState';

export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const { userId, timeControl } = await request.json();
		console.log(`[Start API] Starting game for lobby ${params.id} with user ${userId}`, timeControl);

		if (!userId) {
			Sentry.captureMessage('Missing user ID', {
				level: 'error',
				extra: {
					errorMessage: resources.errors.server.validation.playerNameRequired
				}
			});
			return json(
				{ error: resources.errors.server.validation.playerNameRequired },
				{ status: 400 }
			);
		}

		if (!timeControl) {
			Sentry.captureMessage('Missing time control', {
				level: 'error',
				extra: {
					errorMessage: resources.errors.server.validation.invalidTimeControl
				}
			});
			return json(
				{ error: resources.errors.server.validation.invalidTimeControl },
				{ status: 400 }
			);
		}

		// Check if lobby exists in memory before starting
		const memoryLobby = getMemoryLobby(params.id);
		if (!memoryLobby) {
			console.log(`[Start API] Lobby ${params.id} not found in memory, will attempt to load from DB`);
		} else {
			console.log(`[Start API] Found memory lobby:`, memoryLobby);
		}

		// Start the game in the database
		try {
			// Attempt to start the game in the database
			const lobby = await BackendLobbyService.startGame(params.id, userId, timeControl);
			
			try {
				// Initialize the game state
				console.log(`[Start API] Initializing game state for lobby ${params.id}`);
				
				// First clear any existing game state
				deleteGameState(params.id);
				
				// Create a fresh initial game state with the specified time control
				const initialState = getInitialState(params.id, timeControl);
				console.log(`[Start API] Created initial game state with ${initialState.pieces.length} pieces`);
				
				// Update the in-memory game state
				updateGameState(params.id, initialState);
				
				// Update the in-memory lobby state
				updateLobby(params.id, lobby);
				
				console.log(`[Start API] Game started successfully for lobby ${params.id}`);
			} catch (storeError) {
				console.error(`[Start API] Error initializing game state:`, storeError);
				Sentry.captureException(storeError, {
					extra: {
						errorMessage: 'Failed to initialize game state',
						lobbyId: params.id
					}
				});
				// We still want to return success as the DB update succeeded
				// But log the error for debugging
			}
			
			// Add a short delay to ensure state is updated before returning
			await new Promise(resolve => setTimeout(resolve, 100));
			
			return json(lobby);
		} catch (dbError) {
			console.error(`[Start API] Database error:`, dbError);
			// Return a more detailed error message
			const errorMessage = dbError instanceof Error 
				? `${resources.errors.common.startFailed}: ${dbError.message}`
				: resources.errors.common.startFailed;
				
			return json({ error: errorMessage }, { status: 500 });
		}
	} catch (error) {
		console.error(`[Start API] Unexpected error:`, error);
		Sentry.captureException(error, {
			extra: {
				errorMessage: resources.errors.common.startFailed,
				requestParams: params
			}
		});
		
		// Return a more helpful error message
		const errorMessage = error instanceof Error 
			? `${resources.errors.common.startFailed}: ${error.message}`
			: resources.errors.common.startFailed;
			
		return json({ error: errorMessage }, { status: 500 });
	}
};
