import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ChessColor } from '$lib/types/chess';
import { getGameState, updateGameState } from '$lib/scripts/serverGameState';
import { getLobbies } from '$lib/scripts/lobbyStore';

export const POST: RequestHandler = async ({ params, request }) => {
    const { playerName, color } = await request.json();
    const lobbyId = params.lobbyId;

    if (!playerName || !color) {
        return json({ error: 'Player name and color are required' }, { status: 400 });
    }

    // Check if lobby exists and is in playing state
    const lobbies = getLobbies();
    const lobby = lobbies.find(l => l.id === lobbyId);
    
    if (!lobby || lobby.status !== 'playing') {
        return json({ error: 'Game not found or not started' }, { status: 404 });
    }

    // Verify player is in the game
    const playerColor = lobby.players.white === playerName ? ChessColor.White :
                       lobby.players.black === playerName ? ChessColor.Black :
                       null;

    if (!playerColor || playerColor !== color) {
        return json({ error: 'Invalid player or color' }, { status: 400 });
    }

    const currentState = getGameState(lobbyId);
    if (!currentState.timeControl || !currentState.timeRemaining) {
        return json({ error: 'Time control not initialized' }, { status: 400 });
    }

    // Update time for the current player
    const newTimeRemaining = { ...currentState.timeRemaining };
    if (color === ChessColor.White) {
        newTimeRemaining.white = Math.max(0, newTimeRemaining.white - 1);
        if (currentState.timeControl.increment > 0) {
            newTimeRemaining.white += currentState.timeControl.increment;
        }
    } else {
        newTimeRemaining.black = Math.max(0, newTimeRemaining.black - 1);
        if (currentState.timeControl.increment > 0) {
            newTimeRemaining.black += currentState.timeControl.increment;
        }
    }

    // Check for time out
    let newStatus = currentState.status;
    if (newTimeRemaining.white <= 0) {
        newStatus = 'Black wins on time';
    } else if (newTimeRemaining.black <= 0) {
        newStatus = 'White wins on time';
    }

    // Update game state
    const newState = {
        ...currentState,
        timeRemaining: newTimeRemaining,
        status: newStatus
    };

    updateGameState(lobbyId, newState);
    return json(newState);
}; 