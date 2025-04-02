import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { BackendLobbyService } from '$lib/services/backend/lobbyService';
import * as Sentry from '@sentry/sveltekit';
import { resources } from '$lib/resources';

export const GET: RequestHandler = async () => {
	try {
		const lobbies = await BackendLobbyService.getLobbies();
		return json(lobbies);
	} catch (error) {
		Sentry.captureException(error, {
			extra: {
				errorMessage: resources.errors.common.fetchFailed
			}
		});
		return json({ error: resources.errors.common.fetchFailed }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { host_id, name } = await request.json();

		if (!host_id || !name) {
			Sentry.captureMessage('Missing required fields', {
				level: 'error',
				extra: {
					errorMessage: resources.errors.server.validation.missingRequiredFields
				}
			});
			return json(
				{ error: resources.errors.server.validation.missingRequiredFields },
				{ status: 400 }
			);
		}

		const newLobbyData = {
			name,
			host_id,
			status: 'waiting' as const,
			player2_id: null,
			time_control: null,
			created: new Date().toISOString()
		};

		const newLobby = await BackendLobbyService.createLobby(newLobbyData);

		return json(newLobby);
	} catch (error) {
		Sentry.captureException(error, {
			extra: {
				errorMessage: resources.errors.common.createFailed
			}
		});
		return json({ error: resources.errors.common.createFailed }, { status: 500 });
	}
};
