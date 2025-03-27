import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Lobby } from '$lib/types';
import { getLobbies, updateLobbies } from '$lib/scripts/lobbyStore';
import { v4 as uuidv4 } from 'uuid';

export const GET: RequestHandler = async () => {
    const lobbies = getLobbies();
    return json(lobbies);
};

export const POST: RequestHandler = async ({ request }) => {
    const { host, name } = await request.json();

    if (!host || !name) {
        return json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Randomly assign colors to slots
    const shouldSlot1BeWhite = Math.random() < 0.5;

    const newLobby: Lobby = {
        id: uuidv4(),
        name,
        host,
        status: 'waiting',
        created: new Date(),
        slots: {
            slot1: {
                player: host,
                color: shouldSlot1BeWhite ? 'white' : 'black'
            },
            slot2: {
                color: shouldSlot1BeWhite ? 'black' : 'white'
            }
        }
    };

    const currentLobbies = getLobbies();
    updateLobbies([...currentLobbies, newLobby]);
    return json(newLobby);
}; 