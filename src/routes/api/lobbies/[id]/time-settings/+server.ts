import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Lobby } from '$lib/types';
import { getLobbies, updateLobby } from '$lib/scripts/lobbyStore';
import { resources } from '$lib/resources';

export const POST: RequestHandler = async ({ params, request }) => {
    const { playerName, timeControl } = await request.json();
    const lobbyId = params.id;

    if (!playerName || !timeControl) {
        return json({ error: resources.common.errors.missingRequiredFields }, { status: 400 });
    }

    const currentLobbies = getLobbies();
    const lobby = currentLobbies.find(l => l.id === lobbyId);
    
    if (!lobby) {
        return json({ error: resources.common.errors.lobbyNotFound }, { status: 404 });
    }

    // Only the host can update time settings
    if (lobby.host !== playerName) {
        return json({ error: resources.common.errors.onlyHostCanUpdateTime }, { status: 403 });
    }

    // Can't update settings if game has started
    if (lobby.status === 'playing') {
        return json({ error: resources.common.errors.cannotUpdateTimeAfterStart }, { status: 400 });
    }

    // Create updated lobby with new time settings
    const updatedLobby: Lobby = {
        ...lobby,
        timeControl
    };

    // Update the lobby
    updateLobby(lobbyId, updatedLobby);

    return json(updatedLobby);
}; 