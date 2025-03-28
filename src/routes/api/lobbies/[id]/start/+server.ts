import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Lobby } from '$lib/types/chess';
import { getLobbies, updateLobby } from '$lib/scripts/lobbyStore';
import { getGameState, updateGameState } from '$lib/scripts/serverGameState';
import { resources } from '$lib/resources';

export const POST: RequestHandler = async ({ params, request }) => {
    const { playerName, timeControl } = await request.json();
    const lobbyId = params.id;

    if (!playerName) {
        return json({ error: resources.errors.server.validation.playerNameRequired }, { status: 400 });
    }

    const currentLobbies = getLobbies();
    const lobby = currentLobbies.find(l => l.id === lobbyId);
    
    if (!lobby) {
        return json({ error: resources.errors.server.validation.lobbyNotFound }, { status: 404 });
    }

    if (lobby.host !== playerName) {
        return json({ error: resources.errors.server.validation.onlyHostCanStart }, { status: 403 });
    }

    if (!lobby.slots.slot1?.player || !lobby.slots.slot2?.player) {
        return json({ error: resources.errors.server.validation.needSecondPlayer }, { status: 400 });
    }

    const updatedLobby: Lobby = {
        ...lobby,
        status: 'playing',
        timeControl
    };

    updateLobby(lobbyId, updatedLobby);

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