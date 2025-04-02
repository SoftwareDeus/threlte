import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { BackendLobbyService } from '$lib/services/backend/lobbyService';
import * as Sentry from '@sentry/sveltekit';
import { resources } from '$lib/resources';

export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const { userId } = await request.json();

		if (!userId) {
			Sentry.captureMessage('Missing user ID', {
				level: 'error',
				extra: {
					errorMessage: resources.errors.server.validation.playerNameRequired
				}
			});
			return json(
				{ error: resources.errors.server.validation.playerNameRequired },
				{ status: 400 }
			);
		}

		const lobby = await BackendLobbyService.joinLobby(params.id, userId);
		return json(lobby);
	} catch (error) {
		Sentry.captureException(error, {
			extra: {
				errorMessage: resources.errors.common.joinFailed
			}
		});
		return json({ error: resources.errors.common.joinFailed }, { status: 500 });
	}
};
