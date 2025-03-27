import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { GameState } from '$lib/types';
import { ChessColor } from '$lib/types';
import { getGameState, updateGameState } from '$lib/scripts/serverGameState';
import { getLobbies } from '$lib/scripts/lobbyStore';

export const POST: RequestHandler = async ({ params, request }) => {
    const lobbyId = params.lobbyId;
    const { playerName, move } = await request.json();

    if (!playerName || !move) {
        return json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get current game state
    const currentState = getGameState(lobbyId);
    
    // Get lobby to check player color
    const lobbies = getLobbies();
    const lobby = lobbies.find(l => l.id === lobbyId);
    
    if (!lobby) {
        return json({ error: 'Lobby not found' }, { status: 404 });
    }

    // Check if it's the player's turn
    let playerColor: ChessColor | null = 
        lobby.players.white === playerName ? ChessColor.White : 
        lobby.players.black === playerName ? ChessColor.Black : 
        null;

    if (!playerColor) {
        return json({ error: 'Player not found in lobby' }, { status: 400 });
    }

    // At this point, playerColor is guaranteed to be ChessColor
    playerColor = playerColor as ChessColor;

    if (currentState.activePlayer !== playerColor) {
        return json({ error: 'Not your turn' }, { status: 400 });
    }

    // Update game state with the move
    const updatedState: GameState = {
        ...currentState,
        pieces: currentState.pieces.map(piece => {
            if (piece.id === move.pieceId) {
                return {
                    ...piece,
                    position: move.to
                };
            }
            return piece;
        }),
        activePlayer: currentState.activePlayer === ChessColor.White ? ChessColor.Black : ChessColor.White,
        lastMove: move,
        capturedPieces: {
            ...currentState.capturedPieces
        }
    };

    // If a piece was captured, add it to captured pieces
    if (move.capturedPiece) {
        updatedState.capturedPieces[playerColor === ChessColor.White ? 'white' : 'black'].push(move.capturedPiece);
    }

    // Update the game state on the server
    updateGameState(lobbyId, updatedState);

    // Return the updated game state
    return json(updatedState);
}; 