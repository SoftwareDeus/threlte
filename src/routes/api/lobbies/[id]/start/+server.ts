import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Lobby } from '$lib/types';
import { getLobbies, updateLobby } from '$lib/scripts/lobbyStore';
import { getGameState, updateGameState } from '$lib/scripts/serverGameState';
import { resources } from '$lib/resources';

export const POST: RequestHandler = async ({ params, request }) => {
    const { playerName, timeControl } = await request.json();
    const lobbyId = params.id;

    if (!playerName) {
        return json({ error: resources.common.errors.playerNameRequired }, { status: 400 });
    }

    const currentLobbies = getLobbies();
    const lobby = currentLobbies.find(l => l.id === lobbyId);
    
    if (!lobby) {
        return json({ error: resources.common.errors.lobbyNotFound }, { status: 404 });
    }

    // Only the host can start the game
    if (lobby.host !== playerName) {
        return json({ error: resources.common.errors.onlyHostCanStart }, { status: 403 });
    }

    // Can't start without a second player
    if (!lobby.slots.slot1?.player || !lobby.slots.slot2?.player) {
        return json({ error: resources.common.errors.needSecondPlayer }, { status: 400 });
    }

    // Create updated lobby with game started
    const updatedLobby: Lobby = {
        ...lobby,
        status: 'playing',
        timeControl
    };

    // Update the lobby
    updateLobby(lobbyId, updatedLobby);

    // Initialize game state with time control
    const gameState = getGameState(lobbyId);
    updateGameState(lobbyId, {
        ...gameState,
        timeControl,
        timeRemaining: {
            white: timeControl.minutes * 60,
            black: timeControl.minutes * 60
        }
    });

    return json(updatedLobby);
}; 