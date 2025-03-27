import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Lobby } from '$lib/types';
import { getLobbies, updateLobbies } from '$lib/scripts/lobbyStore';
import { v4 as uuidv4 } from 'uuid';

export const GET: RequestHandler = async () => {
    const currentLobbies = getLobbies();
    return json(currentLobbies);
};

export const POST: RequestHandler = async ({ request }) => {
    const { host, name } = await request.json();

    if (!host || !name) {
        return json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newLobby: Lobby = {
        id: uuidv4(),
        name,
        host,
        status: 'waiting',
        created: new Date(),
        players: {
            white: host,
            black: undefined
        }
    };

    const currentLobbies = getLobbies();
    updateLobbies([...currentLobbies, newLobby]);
    return json(newLobby);
}; 