import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Lobby } from '$lib/types/chess';
import { ChessColor } from '$lib/types/chess';
import { getLobbies, updateLobbies } from '$lib/scripts/lobbyStore';
import { v4 as uuidv4 } from 'uuid';
import * as Sentry from '@sentry/sveltekit';
import { resources } from '$lib/resources';

export const GET: RequestHandler = async () => {
    try {
        const lobbies = getLobbies();
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
        const { host, name } = await request.json();

        if (!host || !name) {
            Sentry.captureMessage('Missing required fields', {
                level: 'error',
                extra: {
                    errorMessage: resources.errors.server.validation.missingRequiredFields
                }
            });
            return json({ error: resources.errors.server.validation.missingRequiredFields }, { status: 400 });
        }

        // Randomly assign colors to slots
        const shouldSlot1BeWhite = Math.random() < 0.5;

        const newLobby: Lobby = {
            id: uuidv4(),
            name,
            host,
            status: 'waiting',
            created: new Date(),
            slots: {
                slot1: {
                    player: host,
                    color: shouldSlot1BeWhite ? ChessColor.White : ChessColor.Black
                }
            }
        };

        const currentLobbies = getLobbies();
        updateLobbies([...currentLobbies, newLobby]);
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