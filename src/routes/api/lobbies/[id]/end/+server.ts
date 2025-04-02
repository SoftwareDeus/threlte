import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { BackendLobbyService } from '$lib/services/backend/lobbyService';
import * as Sentry from '@sentry/sveltekit';
import { resources } from '$lib/resources';
import { deleteGameState } from '$lib/scripts/serverGameState';
import { ChessColor } from '$lib/types/chess';

export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const { playerName, winner } = await request.json();
		console.log(`[End API] Ending game for lobby ${params.id}`, { playerName, winner });

		if (!playerName) {
			Sentry.captureMessage('Missing player name', {
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

		try {
			// Get the current lobby state first
			const lobby = await BackendLobbyService.getLobby(params.id);
			
			// Only allow players in the lobby to end the game
			let isInLobby = false;
			
			if (lobby.host_id === playerName) {
				isInLobby = true;
				console.log(`[End API] Player ${playerName} is the host`);
			} else if (lobby.player2_id === playerName) {
				isInLobby = true;
				console.log(`[End API] Player ${playerName} is player 2`);
			}
			
			if (!isInLobby) {
				console.error(`[End API] Player ${playerName} is not in the lobby`);
				return json(
					{ error: resources.errors.server.validation.notInLobby },
					{ status: 403 }
				);
			}
			
			// Only allow ending games that are in 'playing' status
			if (lobby.status !== 'playing') {
				console.error(`[End API] Lobby ${params.id} is not in playing status: ${lobby.status}`);
				return json(
					{ error: resources.errors.server.validation.gameStarted },
					{ status: 400 }
				);
			}

			// Determine which color the player is
			let playerColor = null;
			
			// Safely check slot1
			if (lobby.slots && 
				typeof lobby.slots === 'object' && 
				'slot1' in lobby.slots && 
				lobby.slots.slot1 && 
				typeof lobby.slots.slot1 === 'object' &&
				'player' in lobby.slots.slot1 &&
				'color' in lobby.slots.slot1 &&
				lobby.slots.slot1.player === playerName) {
				
				playerColor = lobby.slots.slot1.color;
				console.log(`[End API] Player ${playerName} is playing as ${playerColor}`);
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
				
				playerColor = lobby.slots.slot2.color;
				console.log(`[End API] Player ${playerName} is playing as ${playerColor}`);
			}
			
			// Update the lobby status to 'waiting' (since we don't have a 'finished' status)
			// We'll just reset to waiting status, as the Lobby type doesn't have a result field
			const winnerText = winner === ChessColor.White ? 'White' : 
				winner === ChessColor.Black ? 'Black' : 'Draw';
				
			const updatedLobby = await BackendLobbyService.updateLobby(params.id, {
				status: 'waiting', // Reset to 'waiting' since we don't have a 'finished' status
				// Store winner information in the lobby name as we don't have a dedicated field
				name: `${lobby.name} (${winnerText})`
			});
			
			// Clean up the game state
			deleteGameState(params.id);
			
			return json({ success: true, lobby: updatedLobby });
		} catch (error) {
			console.error(`[End API] Error ending game:`, error);
			Sentry.captureException(error, {
				extra: {
					errorMessage: resources.errors.common.updateFailed,
					context: 'end game endpoint'
				}
			});
			
			const errorMessage = error instanceof Error 
				? error.message 
				: resources.errors.common.updateFailed;
				
			return json({ error: errorMessage }, { status: 500 });
		}
	} catch (error) {
		console.error(`[End API] Unexpected error:`, error);
		Sentry.captureException(error, {
			extra: {
				errorMessage: resources.errors.common.updateFailed,
				requestParams: params
			}
		});
		return json({ error: resources.errors.common.updateFailed }, { status: 500 });
	}
}; 