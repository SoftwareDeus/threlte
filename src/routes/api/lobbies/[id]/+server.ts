import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getLobbies, updateLobbies } from '$lib/scripts/lobbyStore';
import { deleteGameState } from '$lib/scripts/serverGameState';
import { gameState } from '$lib/scripts/gameState';
import { ChessColor } from '$lib/types/chess';

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
    
    const lobby = currentLobbies.find(l => l.id === lobbyId);
    if (!lobby) {
        console.log('Lobby not found');
        return json({ error: 'Lobby not found' }, { status: 404 });
    }

    // Get the other player's name
    const otherPlayer = lobby.slots.slot1?.player === playerName ? 
        lobby.slots.slot2?.player : 
        lobby.slots.slot1?.player;

    // Remove the lobby from the array
    const updatedLobbies = currentLobbies.filter(l => l.id !== lobbyId);
    console.log('Updated lobbies:', updatedLobbies);
    
    updateLobbies(updatedLobbies);

    // Delete the game state if it exists
    deleteGameState(lobbyId);
    console.log('Game state deleted');

    // Reset the game state store for both players
    gameState.set({
        pieces: [],
        activePlayer: ChessColor.White,
        capturedPieces: {
            white: [],
            black: []
        },
        status: null,
        reset: () => {}
    });

    return json({ 
        success: true,
        otherPlayer
    });
}; 