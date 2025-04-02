import type { Lobby } from '$lib/types/chess';

// In-memory store for lobbies on the server
const lobbies: Map<string, Lobby> = new Map();

/**
 * Get all lobbies
 */
export function getLobbies(): Lobby[] {
  return Array.from(lobbies.values());
}

/**
 * Get a lobby by ID
 * @param id The lobby ID
 */
export function getLobby(id: string): Lobby | undefined {
  return lobbies.get(id);
}

/**
 * Add or update a lobby
 * @param id The lobby ID
 * @param lobby The lobby data
 */
export function updateLobby(id: string, lobby: Lobby): void {
  lobbies.set(id, lobby);
}

/**
 * Remove a lobby
 * @param id The lobby ID
 */
export function deleteLobby(id: string): void {
  lobbies.delete(id);
} 