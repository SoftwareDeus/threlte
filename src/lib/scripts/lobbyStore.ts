import { writable } from 'svelte/store';
import type { Lobby } from '../types';

// Create a writable store for lobbies
export const lobbies = writable<Lobby[]>([]);

// Helper function to get current lobbies
export function getLobbies(): Lobby[] {
    let currentLobbies: Lobby[] = [];
    lobbies.subscribe(value => {
        currentLobbies = value;
    })();
    return currentLobbies;
}

// Helper function to update lobbies
export function updateLobbies(newLobbies: Lobby[]) {
    lobbies.set(newLobbies);
}

// Helper function to update a single lobby
export function updateLobby(lobbyId: string, updatedLobby: Lobby) {
    lobbies.update(currentLobbies => {
        return currentLobbies.map(lobby => 
            lobby.id === lobbyId ? updatedLobby : lobby
        );
    });
}

// Helper function to delete a lobby
export function deleteLobby(lobbyId: string) {
    lobbies.update(currentLobbies => {
        return currentLobbies.filter(lobby => lobby.id !== lobbyId);
    });
} 