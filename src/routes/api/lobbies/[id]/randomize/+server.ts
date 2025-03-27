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

    // Only the host can randomize players
    if (lobby.host !== playerName) {
        return json({ error: 'Only the host can randomize players' }, { status: 403 });
    }

    // Can't randomize if there's no second player
    if (!lobby.slots.slot2?.player) {
        return json({ error: 'Cannot randomize without a second player' }, { status: 400 });
    }

    // Randomly swap colors
    const shouldSwap = Math.random() < 0.5;
    const updatedLobby: Lobby = {
        ...lobby,
        slots: {
            slot1: {
                player: lobby.slots.slot1?.player,
                color: shouldSwap ? 'black' : 'white'
            },
            slot2: {
                player: lobby.slots.slot2?.player,
                color: shouldSwap ? 'white' : 'black'
            }
        }
    };

    // Update the lobby
    updateLobby(lobbyId, updatedLobby);

    return json(updatedLobby);
}; 