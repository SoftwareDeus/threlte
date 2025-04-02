import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Lobby } from '$lib/types/chess';
import { BackendLobbyService } from '$lib/services/backend/lobbyService';
import * as Sentry from '@sentry/sveltekit';
import { resources } from '$lib/resources';

export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const { playerName, timeControl } = await request.json();
		const lobbyId = params.id;

		if (!playerName || !timeControl) {
			return json(
				{ error: resources.errors.server.validation.missingRequiredFields },
				{ status: 400 }
			);
		}

		// Validate timeControl structure
		if (
			timeControl.minutes === undefined ||
			timeControl.increment === undefined ||
			typeof timeControl.minutes !== 'number' ||
			typeof timeControl.increment !== 'number' ||
			timeControl.minutes < 1 ||
			timeControl.minutes > 60 ||
			timeControl.increment < 0 ||
			timeControl.increment > 60
		) {
			return json({ error: resources.errors.server.validation.invalidTimeControl }, { status: 400 });
		}

		// Get the current lobby from database
		const lobby = await BackendLobbyService.getLobby(lobbyId);

		// Only the host can update time settings
		if (lobby.host_id !== playerName) {
			return json(
				{ error: resources.errors.server.validation.onlyHostCanUpdateTime },
				{ status: 403 }
			);
		}

		// Can't update settings if game has started
		if (lobby.status === 'playing') {
			return json(
				{ error: resources.errors.server.validation.cannotUpdateTimeAfterStart },
				{ status: 400 }
			);
		}

		// Update the lobby with new time settings
		const updatedLobby = await BackendLobbyService.updateLobby(lobbyId, {
			time_control: timeControl
		});

		return json(updatedLobby);
	} catch (error) {
		Sentry.captureException(error, {
			extra: {
				errorMessage: resources.errors.common.updateFailed
			}
		});
		return json({ error: resources.errors.common.updateFailed }, { status: 500 });
	}
};
