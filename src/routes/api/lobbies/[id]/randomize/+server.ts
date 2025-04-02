import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Lobby } from '$lib/types/chess';
import { BackendLobbyService } from '$lib/services/backend/lobbyService';
import { resources } from '$lib/resources';
import { ChessColor } from '$lib/types/chess';

export const POST: RequestHandler = async ({ params, request }) => {
	const { playerName } = await request.json();
	const lobbyId = params.id;

	if (!playerName) {
		return json({ error: resources.errors.common.nameRequired }, { status: 400 });
	}

	try {
		// Get the lobby
		const lobby = await BackendLobbyService.getLobby(lobbyId);

		if (!lobby) {
			return json({ error: resources.errors.server.validation.lobbyNotFound }, { status: 404 });
		}

		if (lobby.host_id !== playerName) {
			return json(
				{ error: resources.errors.server.validation.onlyHostCanRandomize },
				{ status: 403 }
			);
		}

		if (!lobby.slots.slot2?.player) {
			return json(
				{ error: resources.errors.server.validation.needSecondPlayerForRandom },
				{ status: 400 }
			);
		}

		const shouldSwap = Math.random() < 0.5;
		const updatedLobby: Partial<Lobby> = {
			slots: {
				slot1: {
					player: lobby.slots.slot1?.player || '',
					color: shouldSwap ? ChessColor.Black : ChessColor.White
				},
				slot2: {
					player: lobby.slots.slot2?.player || '',
					color: shouldSwap ? ChessColor.White : ChessColor.Black
				}
			}
		};

		// Update the lobby
		const result = await BackendLobbyService.updateLobby(lobbyId, updatedLobby);
		return json(result);
	} catch (err) {
		console.error('Error in randomizing lobby colors:', err);
		return json({ error: resources.errors.common.updateFailed }, { status: 500 });
	}
};
