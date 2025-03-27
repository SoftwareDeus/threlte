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

    // Can't join if already in the lobby
    if (lobby.slots.slot1?.player === playerName || lobby.slots.slot2?.player === playerName) {
        return json({ error: 'Already in this lobby' }, { status: 400 });
    }

    // Can't join if lobby is full
    if (lobby.slots.slot1?.player && lobby.slots.slot2?.player) {
        return json({ error: 'Lobby is full' }, { status: 400 });
    }

    // Can't join if game has started
    if (lobby.status === 'playing') {
        return json({ error: 'Game has already started' }, { status: 400 });
    }

    // Fill the empty slot
    const updatedLobby: Lobby = {
        ...lobby,
        slots: {
            slot1: lobby.slots.slot1?.player ? lobby.slots.slot1 : { player: playerName, color: lobby.slots.slot1?.color || 'white' },
            slot2: lobby.slots.slot2?.player ? lobby.slots.slot2 : { player: playerName, color: lobby.slots.slot2?.color || 'black' }
        }
    };

    // Update the lobby
    updateLobby(lobbyId, updatedLobby);

    return json(updatedLobby);
}; 