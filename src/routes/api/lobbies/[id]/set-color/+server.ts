import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Lobby } from '$lib/types/chess';
import { getLobbies, updateLobby } from '$lib/scripts/lobbyStore';
import { ChessColor } from '$lib/types/chess';
import { resources } from '$lib/resources';

export const POST: RequestHandler = async ({ params, request }) => {
    const { playerName, targetPlayer, color } = await request.json();
    const lobbyId = params.id;

    if (!playerName || !targetPlayer || !color) {
        return json({ error: resources.errors.server.validation.missingRequiredFields }, { status: 400 });
    }

    if (color !== ChessColor.White && color !== ChessColor.Black && color !== ChessColor.Random) {
        return json({ error: resources.errors.server.validation.invalidColor }, { status: 400 });
    }

    const currentLobbies = getLobbies();
    const lobby = currentLobbies.find(l => l.id === lobbyId);
    
    if (!lobby) {
        return json({ error: resources.errors.server.validation.lobbyNotFound }, { status: 404 });
    }

    if (lobby.host !== playerName) {
        return json({ error: resources.errors.server.validation.onlyHostCanSetColors }, { status: 403 });
    }

    if (lobby.slots.slot1?.player !== targetPlayer && lobby.slots.slot2?.player !== targetPlayer) {
        return json({ error: resources.errors.server.validation.targetPlayerNotFound }, { status: 400 });
    }

    const updatedLobby: Lobby = {
        ...lobby,
        slots: {
            slot1: {
                player: lobby.slots.slot1?.player,
                color: lobby.slots.slot1?.player === targetPlayer ? color : (color === ChessColor.White ? ChessColor.Black : color === ChessColor.Black ? ChessColor.White : ChessColor.Random)
            },
            slot2: {
                player: lobby.slots.slot2?.player,
                color: lobby.slots.slot2?.player === targetPlayer ? color : (color === ChessColor.White ? ChessColor.Black : color === ChessColor.Black ? ChessColor.White : ChessColor.Random)
            }
        }
    };

    updateLobby(lobbyId, updatedLobby);

    return json(updatedLobby);
}; 