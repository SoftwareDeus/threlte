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

    // Check if lobby is already in game
    if (lobby.status === 'playing') {
        return json({ error: 'Lobby is already in game' }, { status: 400 });
    }

    // Check if player is already in the lobby
    if (lobby.players.white === playerName || lobby.players.black === playerName) {
        return json({ error: 'Player is already in this lobby' }, { status: 400 });
    }

    // If the player is the host, they can't join as black
    if (lobby.host === playerName) {
        return json({ error: 'Host cannot join as black' }, { status: 400 });
    }

    // If someone has already joined as black, the lobby is full
    if (lobby.players.black) {
        return json({ error: 'Lobby is already full' }, { status: 400 });
    }

    // Create updated lobby with new player
    const updatedLobby: Lobby = {
        ...lobby,
        players: {
            ...lobby.players,
            black: playerName
        }
    };

    // Update the lobby
    updateLobby(lobbyId, updatedLobby);

    return json(updatedLobby);
}; 