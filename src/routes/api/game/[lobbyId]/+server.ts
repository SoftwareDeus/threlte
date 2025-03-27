import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { GameState } from '$lib/types/chess';
import { ChessColor } from '$lib/types/chess';
import { getGameState, updateGameState } from '$lib/scripts/serverGameState';
import { getLobbies } from '$lib/scripts/lobbyStore';

export const GET: RequestHandler = async ({ params }) => {
    const lobbyId = params.lobbyId;
    
    // Check if lobby exists and is in playing state
    const lobbies = getLobbies();
    const lobby = lobbies.find(l => l.id === lobbyId);
    
    if (!lobby || lobby.status !== 'playing') {
        return json({ error: 'Game not found or not started' }, { status: 404 });
    }

    const gameState = getGameState(lobbyId);
    return json(gameState);
};

export const POST: RequestHandler = async ({ params, request }) => {
    const lobbyId = params.lobbyId;
    const { playerName, move } = await request.json();
    
    // Check if lobby exists and is in playing state
    const lobbies = getLobbies();
    const lobby = lobbies.find(l => l.id === lobbyId);
    
    if (!lobby || lobby.status !== 'playing') {
        return json({ error: 'Game not found or not started' }, { status: 404 });
    }

    // Validate move
    if (!move || !move.pieceId || !move.targetPosition) {
        return json({ error: 'Invalid move' }, { status: 400 });
    }

    const currentState = getGameState(lobbyId);

    // Find the piece being moved
    const piece = currentState.board.find(p => p.position === move.pieceId);
    if (!piece) {
        return json({ error: 'Piece not found' }, { status: 400 });
    }

    // Determine player's color from lobby
    const playerColor = lobby.slots.slot1?.player === playerName && lobby.slots.slot1?.color ? 
                       (lobby.slots.slot1.color === 'white' ? ChessColor.White : ChessColor.Black) :
                       lobby.slots.slot2?.player === playerName && lobby.slots.slot2?.color ?
                       (lobby.slots.slot2.color === 'white' ? ChessColor.White : ChessColor.Black) :
                       null;

    if (!playerColor) {
        return json({ error: 'Player not found in lobby' }, { status: 400 });
    }

    // Check if it's the player's turn and they're moving their own pieces
    if (currentState.activePlayer !== playerColor) {
        return json({ error: 'Not your turn' }, { status: 400 });
    }

    if (piece.color !== playerColor) {
        return json({ error: 'Cannot move opponent\'s pieces' }, { status: 400 });
    }

    // Check if target position is occupied by a piece of the same color
    const targetPiece = currentState.board.find(p => p.position === move.targetPosition);
    if (targetPiece && targetPiece.color === piece.color) {
        return json({ error: 'Cannot capture your own piece' }, { status: 400 });
    }

    // Update the board
    const newBoard = currentState.board
        .filter(p => p.position !== move.targetPosition) // Remove captured piece if any
        .map(p => {
            if (p.position === move.pieceId) {
                return { ...p, position: move.targetPosition };
            }
            return p;
        });

    // If a piece was captured, add it to capturedPieces
    let newCapturedPieces = { ...currentState.capturedPieces };
    if (targetPiece) {
        if (targetPiece.color === ChessColor.White) {
            newCapturedPieces.white.push(targetPiece);
        } else {
            newCapturedPieces.black.push(targetPiece);
        }
    }

    // Create new game state
    const newState: GameState = {
        ...currentState,
        board: newBoard,
        capturedPieces: newCapturedPieces,
        activePlayer: currentState.activePlayer === ChessColor.White ? ChessColor.Black : ChessColor.White,
        lastMove: move
    };

    // Update the game state
    updateGameState(lobbyId, newState);

    return json(newState);
}; 