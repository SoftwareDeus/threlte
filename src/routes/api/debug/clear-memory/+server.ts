import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getLobbies, updateLobby, deleteLobby } from '$lib/scripts/lobbyStore';
import { deleteGameState } from '$lib/scripts/serverGameState';

// Debug endpoint to clear all in-memory data
export const POST: RequestHandler = async () => {
    try {
        // Get all in-memory lobbies
        const memoryLobbies = getLobbies();
        let clearedCount = 0;
        
        // Delete each lobby and its game state
        for (const lobby of memoryLobbies) {
            deleteGameState(lobby.id);
            deleteLobby(lobby.id);
            clearedCount++;
        }
        
        return json({
            success: true,
            clearedLobbies: clearedCount,
            message: `Cleared ${clearedCount} lobbies from memory`
        });
    } catch (error) {
        console.error('Error clearing memory data:', error);
        return json({ 
            error: 'Failed to clear memory data',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}; 