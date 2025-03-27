import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Lobby } from '$lib/types';
import { getLobbies, updateLobbies } from '$lib/scripts/lobbyStore';
import { deleteGameState } from '$lib/scripts/serverGameState';

export const GET: RequestHandler = async ({ params }) => {
    const lobbyId = params.id;
    const currentLobbies = getLobbies();
    const lobby = currentLobbies.find(l => l.id === lobbyId);

    if (!lobby) {
        return json({ error: 'Lobby not found' }, { status: 404 });
    }

    return json(lobby);
};

export const DELETE: RequestHandler = async ({ params, request }) => {
    console.log('Delete request received for lobby:', params.id);
    
    const lobbyId = params.id;
    const body = await request.json();
    console.log('Delete request body:', body);
    
    const { playerName } = body;

    if (!playerName) {
        console.log('No player name provided');
        return json({ error: 'Player name is required' }, { status: 400 });
    }

    const currentLobbies = getLobbies();
    console.log('Current lobbies:', currentLobbies);
    
    const lobbyIndex = currentLobbies.findIndex(l => l.id === lobbyId);
    console.log('Found lobby at index:', lobbyIndex);
    
    if (lobbyIndex === -1) {
        console.log('Lobby not found');
        return json({ error: 'Lobby not found' }, { status: 404 });
    }

    // Remove the lobby from the array
    const updatedLobbies = currentLobbies.filter(l => l.id !== lobbyId);
    console.log('Updated lobbies:', updatedLobbies);
    
    updateLobbies(updatedLobbies);

    // Delete the game state if it exists
    deleteGameState(lobbyId);
    console.log('Game state deleted');

    return json({ success: true });
}; 