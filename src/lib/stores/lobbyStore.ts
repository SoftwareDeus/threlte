import { writable } from 'svelte/store';

// Create a writable store for the lobby ID
export const lobbyId = writable<string | null>(null);

// Create a writable store for the lobbies list
export const lobbies = writable<any[]>([]);

// Helper function to get current lobbies
export function getLobbies(): any[] {
    let currentLobbies: any[] = [];
    lobbies.subscribe(value => {
        currentLobbies = value;
    })();
    return currentLobbies;
}

// Helper function to update lobbies
export function updateLobbies(newLobbies: any[]) {
    lobbies.set(newLobbies);
}

// Helper function to update a single lobby
export function updateLobby(lobbyId: string, updatedLobby: any) {
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