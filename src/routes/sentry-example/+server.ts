import type { RequestHandler } from '@sveltejs/kit';

/*
 * This is just a very simple API route that throws an example error.
 * Feel free to delete this file and the entire sentry route.
 */

export const GET: RequestHandler = async () => {
	throw new Error('Sentry Example API Route Error');
};
