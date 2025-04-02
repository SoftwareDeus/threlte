import { writable } from 'svelte/store';
import type { Lobby } from '$lib/types/chess';

// Create a writable store for the current lobby ID
export const lobbyId = writable<string | null>(null);

// Create a writable store for the lobbies list, correctly typed
export const lobbies = writable<Lobby[]>([]);

/*
 * Removed helper functions (getLobbies, updateLobbies, updateLobby, deleteLobby)
 * Components should use lobbyService.ts to fetch/mutate data
 * and then update this store with the results if needed, or re-fetch.
 */
