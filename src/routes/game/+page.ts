import type { PageLoad } from './$types';

export const ssr = false; // Disable server-side rendering for this route

export const load: PageLoad = async () => {
	// No data needed on server-side for this route
	return {};
}; 