import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { GameState } from '$lib/types/chess';
import { ChessColor } from '$lib/types/chess';
import { getGameState, updateGameState } from '$lib/scripts/serverGameState';
import { getLobbies } from '$lib/scripts/lobbyStore';
import { resources } from '$lib/resources';

export const POST: RequestHandler = async ({ params, request }) => {
    const lobbyId = params.lobbyId;
    const { playerName, move } = await request.json();

    if (!playerName || !move) {
        return json({ error: resources.errors.server.validation.missingRequiredFields }, { status: 400 });
    }

    // Get current game state
    const currentState = getGameState(lobbyId);
    
    // Get lobby to check player color
    const lobbies = getLobbies();
    const lobby = lobbies.find(l => l.id === lobbyId);
    
    if (!lobby) {
        return json({ error: resources.errors.server.validation.lobbyNotFound }, { status: 404 });
    }

    // Determine player's color from lobby
    const playerColor = lobby.slots.slot1?.player === playerName && lobby.slots.slot1?.color ? 
                       (lobby.slots.slot1.color === ChessColor.White ? ChessColor.White : ChessColor.Black) :
                       lobby.slots.slot2?.player === playerName && lobby.slots.slot2?.color ?
                       (lobby.slots.slot2.color === ChessColor.White ? ChessColor.White : ChessColor.Black) :
                       null;

    if (!playerColor) {
        return json({ error: resources.errors.server.validation.playerNotFound }, { status: 400 });
    }

    if (currentState.activePlayer !== playerColor) {
        return json({ error: resources.errors.server.validation.notYourTurn }, { status: 400 });
    }

    // Find the piece being moved
    const piece = currentState.pieces.find(p => p.id === move.pieceId);
    if (!piece) {
        return json({ error: resources.errors.server.validation.pieceNotFound }, { status: 400 });
    }

    // Check if the piece belongs to the player
    if (piece.color !== playerColor) {
        return json({ error: resources.errors.server.validation.cannotMoveOpponent }, { status: 400 });
    }

    // TODO: Implement move validation and execution
    return json({ success: true });
}; 