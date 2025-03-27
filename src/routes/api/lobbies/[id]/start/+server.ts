import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Lobby } from '$lib/types';
import { getLobbies, updateLobby } from '$lib/scripts/lobbyStore';

export const POST: RequestHandler = async ({ params, request }) => {
    const { playerName } = await request.json();
    const lobbyId = params.id;

    if (!playerName) {
        return json({ error: 'Player name is required' }, { status: 400 });
    }

    const currentLobbies = getLobbies();
    const lobby = currentLobbies.find(l => l.id === lobbyId);
    
    if (!lobby) {
        return json({ error: 'Lobby not found' }, { status: 404 });
    }

    // Only the host can start the game
    if (lobby.host !== playerName) {
        return json({ error: 'Only the host can start the game' }, { status: 403 });
    }

    // Can't start without a second player
    if (!lobby.players.black) {
        return json({ error: 'Cannot start game without a second player' }, { status: 400 });
    }

    // Create updated lobby with game started
    const updatedLobby: Lobby = {
        ...lobby,
        status: 'playing'
    };

    // Update the lobby
    updateLobby(lobbyId, updatedLobby);

    return json(updatedLobby);
}; 