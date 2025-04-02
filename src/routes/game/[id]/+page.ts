import type { PageLoad } from './$types';
import { lobbyId } from '$lib/stores/lobbyStore';

export const ssr = false; // Disable server-side rendering for this route

export const load: PageLoad = async ({ params }) => {
	// Store the game/lobby ID for later use
	lobbyId.set(params.id);
	
	return {
		id: params.id
	};
}; 