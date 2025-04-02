import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ChessColor } from '$lib/types/chess';
import { resources } from '$lib/resources';
import { BackendLobbyService } from '$lib/services/backend/lobbyService';
import * as Sentry from '@sentry/sveltekit';

export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const { userId, targetPlayer, color } = await request.json();

		if (!userId || !targetPlayer || !color) {
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

		const validColors = [ChessColor.White, ChessColor.Black];
		if (!validColors.includes(color as ChessColor)) {
			Sentry.captureMessage('Invalid color', {
				level: 'error',
				extra: {
					errorMessage: resources.errors.server.validation.invalidColor,
					providedColor: color
				}
			});
			return json({ error: resources.errors.server.validation.invalidColor }, { status: 400 });
		}

		const lobby = await BackendLobbyService.setPlayerColor(
			params.id,
			userId,
			targetPlayer,
			color as ChessColor
		);
		return json(lobby);
	} catch (error: unknown) {
		Sentry.captureException(error, {
			extra: {
				errorMessage: resources.errors.common.updateFailed,
				context: 'set-color endpoint'
			}
		});
		const errorMessage =
			error instanceof Error ? error.message : resources.errors.common.updateFailed;
		return json({ error: errorMessage }, { status: 500 });
	}
};
