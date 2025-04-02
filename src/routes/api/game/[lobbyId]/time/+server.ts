import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ChessColor } from '$lib/types/chess';
import { getGameState, updateGameState } from '$lib/scripts/serverGameState';
import { getLobbies } from '$lib/scripts/lobbyStore';
import { resources } from '$lib/resources';
import * as Sentry from '@sentry/sveltekit';

export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const { playerName, color } = await request.json();
		const lobbyId = params.lobbyId;
		
		console.log(`[Time API] Updating time for lobby ${lobbyId}`, { playerName, color });

		if (!playerName || !color) {
			console.error('[Time API] Missing required fields:', { playerName, color });
			return json(
				{ error: resources.errors.server.validation.missingRequiredFields },
				{ status: 400 }
			);
		}

		// Get in-memory lobbies
		const lobbies = getLobbies();
		console.log(`[Time API] Found ${lobbies.length} lobbies in memory`);
		
		// Find target lobby
		const lobby = lobbies.find((l) => l.id === lobbyId);
		if (!lobby) {
			console.error(`[Time API] Lobby ${lobbyId} not found in memory`);
			return json({ 
				error: resources.errors.server.validation.gameNotFound,
				lobbyIds: lobbies.map(l => l.id) 
			}, { status: 404 });
		}
		
		// Check lobby status
		if (lobby.status !== 'playing') {
			console.error(`[Time API] Lobby ${lobbyId} is not in playing status: ${lobby.status}`);
			return json({ error: resources.errors.server.validation.gameNotFound }, { status: 404 });
		}

		console.log(`[Time API] Lobby slots:`, lobby.slots);
		
		// Determine player color
		console.log(`[Time API] Checking slots for player ${playerName}:`, lobby.slots);
		
		// First find what color the player is assigned in the lobby
		let playerAssignedColor = null;
		
		// Safely check slot1
		if (lobby.slots && 
			typeof lobby.slots === 'object' && 
			'slot1' in lobby.slots && 
			lobby.slots.slot1 && 
			typeof lobby.slots.slot1 === 'object' &&
			'player' in lobby.slots.slot1 &&
			'color' in lobby.slots.slot1 &&
			lobby.slots.slot1.player === playerName) {
			
			playerAssignedColor = lobby.slots.slot1.color;
			console.log(`[Time API] Player ${playerName} is assigned color ${playerAssignedColor} in slot1`);
		} 
		// Safely check slot2
		else if (lobby.slots && 
			typeof lobby.slots === 'object' && 
			'slot2' in lobby.slots && 
			lobby.slots.slot2 && 
			typeof lobby.slots.slot2 === 'object' &&
			'player' in lobby.slots.slot2 &&
			'color' in lobby.slots.slot2 &&
			lobby.slots.slot2.player === playerName) {
			
			playerAssignedColor = lobby.slots.slot2.color;
			console.log(`[Time API] Player ${playerName} is assigned color ${playerAssignedColor} in slot2`);
		}
		
		if (!playerAssignedColor) {
			console.error(`[Time API] Player ${playerName} not found in lobby slots`);
			return json(
				{ error: resources.errors.server.validation.playerNotFound },
				{ status: 400 }
			);
		}
		
		// Now check if the requested color matches their assigned color
		if (playerAssignedColor !== color) {
			console.error(`[Time API] Player ${playerName} requested color ${color} but is assigned ${playerAssignedColor}`);
			return json(
				{ 
					error: resources.errors.server.validation.invalidPlayerOrColor,
					message: `Player is assigned color ${playerAssignedColor}, but requested to update ${color}` 
				},
				{ status: 400 }
			);
		}

		// Get current game state
		const currentState = getGameState(lobbyId);
		console.log(`[Time API] Current game state:`, {
			timeControl: currentState.timeControl,
			timeRemaining: currentState.timeRemaining
		});
		
		if (!currentState.timeControl || !currentState.timeRemaining) {
			console.error(`[Time API] Time control not initialized for lobby ${lobbyId}`);
			return json(
				{ error: resources.errors.server.validation.timeControlNotInitialized },
				{ status: 400 }
			);
		}

		// Update time remaining
		const newTimeRemaining = { ...currentState.timeRemaining };
		newTimeRemaining[color === ChessColor.White ? 'white' : 'black'] -= 1;
		
		console.log(`[Time API] Updating time:`, {
			before: currentState.timeRemaining,
			after: newTimeRemaining
		});

		// Update game state
		updateGameState(lobbyId, {
			...currentState,
			timeRemaining: newTimeRemaining
		});

		return json({ timeRemaining: newTimeRemaining });
	} catch (error) {
		console.error('[Time API] Error updating time:', error);
		Sentry.captureException(error, {
			extra: {
				errorMessage: resources.errors.common.updateFailed,
				context: 'update time endpoint'
			}
		});
		return json({ 
			error: resources.errors.common.updateFailed,
			message: error instanceof Error ? error.message : String(error)
		}, { status: 500 });
	}
};
