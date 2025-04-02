import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { BackendLobbyService } from '$lib/services/backend/lobbyService';
import * as Sentry from '@sentry/sveltekit';
import { resources } from '$lib/resources';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const lobby = await BackendLobbyService.getLobby(params.id);
		return json(lobby);
	} catch (error) {
		Sentry.captureException(error, {
			extra: {
				errorMessage: resources.errors.common.fetchFailed
			}
		});
		return json({ error: resources.errors.common.fetchFailed }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		await BackendLobbyService.deleteLobby(params.id);
		return json({ success: true });
	} catch (error) {
		Sentry.captureException(error, {
			extra: {
				errorMessage: resources.errors.common.deleteFailed
			}
		});
		return json({ error: resources.errors.common.deleteFailed }, { status: 500 });
	}
};
