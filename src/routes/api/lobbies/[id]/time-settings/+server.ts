import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Lobby } from '$lib/types';
import { getLobbies, updateLobby } from '$lib/scripts/lobbyStore';

export const POST: RequestHandler = async ({ params, request }) => {
    const { playerName, timeControl } = await request.json();
    const lobbyId = params.id;

    if (!playerName || !timeControl) {
        return json({ error: 'Player name and time control are required' }, { status: 400 });
    }

    const currentLobbies = getLobbies();
    const lobby = currentLobbies.find(l => l.id === lobbyId);
    
    if (!lobby) {
        return json({ error: 'Lobby not found' }, { status: 404 });
    }

    // Only the host can update time settings
    if (lobby.host !== playerName) {
        return json({ error: 'Only the host can update time settings' }, { status: 403 });
    }

    // Can't update settings if game has started
    if (lobby.status === 'playing') {
        return json({ error: 'Cannot update time settings after game has started' }, { status: 400 });
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