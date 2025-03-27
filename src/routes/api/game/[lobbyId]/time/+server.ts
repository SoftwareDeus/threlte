import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ChessColor } from '$lib/types/chess';
import { getGameState, updateGameState } from '$lib/scripts/serverGameState';
import { getLobbies } from '$lib/scripts/lobbyStore';
import { resources } from '$lib/resources';

export const POST: RequestHandler = async ({ params, request }) => {
    const { playerName, color } = await request.json();
    const lobbyId = params.lobbyId;

    if (!playerName || !color) {
        return json({ error: resources.errors.server.validation.missingRequiredFields }, { status: 400 });
    }

    // Check if lobby exists and is in playing state
    const lobbies = getLobbies();
    const lobby = lobbies.find(l => l.id === lobbyId);
    if (!lobby || lobby.status !== 'playing') {
        return json({ error: resources.errors.server.validation.gameNotFound }, { status: 404 });
    }

    // Verify player is in the game
    const playerColor = lobby.slots.slot1?.player === playerName && lobby.slots.slot1?.color ?
                       (lobby.slots.slot1.color === ChessColor.White ? ChessColor.White : ChessColor.Black) :
                       lobby.slots.slot2?.player === playerName && lobby.slots.slot2?.color ?
                       (lobby.slots.slot2.color === ChessColor.White ? ChessColor.White : ChessColor.Black) :
                       null;

    if (!playerColor || playerColor !== color) {
        return json({ error: resources.errors.server.validation.invalidPlayerOrColor }, { status: 400 });
    }

    const currentState = getGameState(lobbyId);
    if (!currentState.timeControl || !currentState.timeRemaining) {
        return json({ error: resources.errors.server.validation.timeControlNotInitialized }, { status: 400 });
    }

    // Update time for the current player
    const newTimeRemaining = { ...currentState.timeRemaining };
    newTimeRemaining[color === ChessColor.White ? 'white' : 'black'] -= 1;

    // Update the game state
    updateGameState(lobbyId, {
        ...currentState,
        timeRemaining: newTimeRemaining
    });

    return json({ timeRemaining: newTimeRemaining });
}; 