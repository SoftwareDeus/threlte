import { browser } from '$app/environment';
import type { PageLoad } from './$types';
import type { Lobby } from '$lib/types/chess';

export const ssr = false; // Disable server-side rendering for this route

export const load: PageLoad = async () => {
	// No need to fetch lobbies on the server side
	// We will load them in the component using onMount
	return {
		lobbies: [] as Lobby[]
	};
}; 