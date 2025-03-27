<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { playerName } from '$lib/stores/playerStore';
    import { lobbyId } from '$lib/stores/lobbyStore';

    interface Lobby {
        id: string;
        name: string;
        host: string;
        status: 'waiting' | 'playing';
        created: Date;
        players: {
            white?: string;
            black?: string;
        };
    }

    let lobbies: Lobby[] = [];
    let newLobbyName = '';
    let error: string | null = null;
    let deleteConfirmId: string | null = null;

    onMount(async () => {
        if (!$playerName) {
            error = 'Please enter your name in the main menu';
            setTimeout(() => goto('/'), 2000);
            return;
        }
        await fetchLobbies();
    });

    async function fetchLobbies() {
        try {
            const response = await fetch('/api/lobbies');
            lobbies = await response.json();
        } catch (e) {
            error = 'Failed to fetch lobbies';
            console.error(e);
        }
    }

    async function createLobby() {
        if (!$playerName) {
            error = 'Please enter your name in the main menu';
            setTimeout(() => goto('/'), 2000);
            return;
        }

        if (!newLobbyName.trim()) {
            error = 'Please enter a lobby name';
            return;
        }

        try {
            const response = await fetch('/api/lobbies', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: newLobbyName,
                    host: $playerName
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create lobby');
            }

            const newLobby = await response.json();
            goto(`/lobby/${newLobby.id}`);
        } catch (e) {
            error = 'Failed to create lobby';
            console.error(e);
        }
    }

    async function joinLobby(lobbyId: string) {
        if (!$playerName) {
            error = 'Please enter your name in the main menu';
            setTimeout(() => goto('/'), 2000);
            return;
        }

        try {
            const response = await fetch(`/api/lobbies/${lobbyId}/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    playerName: $playerName
                })
            });

            if (!response.ok) {
                throw new Error('Failed to join lobby');
            }

            goto(`/lobby/${lobbyId}`);
        } catch (e) {
            error = 'Failed to join lobby';
            console.error(e);
        }
    }

    async function startGame(id: string) {
        if (!$playerName) {
            error = 'Please enter your name in the main menu';
            setTimeout(() => goto('/'), 2000);
            return;
        }

        try {
            const response = await fetch(`/api/lobbies/${id}/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    playerName: $playerName
                })
            });

            if (!response.ok) {
                throw new Error('Failed to start game');
            }

            // Set the lobbyId in the store before redirecting
            lobbyId.set(id);
            goto('/game');
        } catch (e) {
            error = 'Failed to start game';
            console.error(e);
        }
    }

    async function deleteLobby() {
        if (!$playerName || !deleteConfirmId) {
            error = 'Please enter your name in the main menu';
            setTimeout(() => goto('/'), 2000);
            return;
        }

        try {
            const response = await fetch(`/api/lobbies/${deleteConfirmId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete lobby');
            }

            deleteConfirmId = null;
            await fetchLobbies();
        } catch (e) {
            error = 'Failed to delete lobby';
            console.error(e);
        }
    }

    function confirmDelete(lobbyId: string) {
        deleteConfirmId = lobbyId;
    }

    function cancelDelete() {
        deleteConfirmId = null;
    }

    function isHost(lobby: Lobby): boolean {
        return lobby.players.white === $playerName;
    }

    function isJoined(lobby: Lobby): boolean {
        return lobby.players.white === $playerName || lobby.players.black === $playerName;
    }
</script>

<div class="w-screen h-screen bg-[#1a1a1a] text-white font-sans p-8">
    <div class="max-w-4xl mx-auto">
        <h1 class="text-4xl font-bold mb-8">Chess Lobbies</h1>

        <!-- Create Lobby -->
        <div class="mb-8">
            <h2 class="text-2xl font-bold mb-4">Create New Lobby</h2>
            <div class="flex gap-4">
                <input
                    type="text"
                    bind:value={newLobbyName}
                    placeholder="Enter lobby name"
                    class="flex-1 px-4 py-2 border-2 border-white/20 rounded bg-white/10 text-white text-base transition-colors focus:outline-none focus:border-[#4CAF50] placeholder-white/50"
                />
                <button
                    on:click={createLobby}
                    class="px-6 py-2 bg-[#4CAF50] text-white rounded hover:bg-[#45a049] transition-colors"
                >
                    Create Lobby
                </button>
            </div>
        </div>

        <!-- Lobby List -->
        <div class="space-y-4 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
            {#each lobbies as lobby (lobby.id)}
                <div class="bg-white/10 rounded-lg p-4 hover:bg-white/20 transition-colors">
                    <div class="flex justify-between items-center mb-2">
                        <h3 class="text-xl font-bold">{lobby.name}</h3>
                        <div class="flex gap-2">
                            {#if isHost(lobby)}
                                <button
                                    on:click={() => startGame(lobby.id)}
                                    class="px-4 py-2 bg-[#4CAF50] text-white rounded hover:bg-[#45a049] transition-colors"
                                >
                                    Start Game
                                </button>
                                <button
                                    on:click={() => confirmDelete(lobby.id)}
                                    class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                >
                                    Delete
                                </button>
                            {:else if isJoined(lobby)}
                                <span class="px-4 py-2 bg-[#4CAF50]/50 text-white rounded">
                                    Joined
                                </span>
                                <button
                                    on:click={() => confirmDelete(lobby.id)}
                                    class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                >
                                    Leave
                                </button>
                            {:else if lobby.players.white && lobby.players.black}
                                <span class="px-4 py-2 bg-gray-500 text-white rounded">
                                    Full
                                </span>
                                <button
                                    on:click={() => confirmDelete(lobby.id)}
                                    class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                >
                                    Delete
                                </button>
                            {:else}
                                <button
                                    on:click={() => joinLobby(lobby.id)}
                                    class="px-4 py-2 bg-[#4CAF50] text-white rounded hover:bg-[#45a049] transition-colors"
                                >
                                    Join
                                </button>
                                <button
                                    on:click={() => confirmDelete(lobby.id)}
                                    class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                >
                                    Delete
                                </button>
                            {/if}
                        </div>
                    </div>
                    <div class="text-sm text-white/70">
                        Host: {lobby.players.white || 'Waiting...'}
                        <br>
                        Player: {lobby.players.black || 'Waiting...'}
                    </div>
                </div>
            {/each}
        </div>

        <!-- Delete Confirmation -->
        {#if deleteConfirmId}
            <div class="fixed inset-0 bg-black/50 flex items-center justify-center">
                <div class="bg-[#1a1a1a] p-6 rounded-lg max-w-md w-full mx-4">
                    {#if lobbies.find(l => l.id === deleteConfirmId)}
                        {@const lobby = lobbies.find(l => l.id === deleteConfirmId)!}
                        <h3 class="text-xl font-bold mb-4">Confirm {isHost(lobby) ? 'Delete' : 'Leave'}</h3>
                        <p class="mb-6">Are you sure you want to {isHost(lobby) ? 'delete' : 'leave'} this lobby?</p>
                    {/if}
                    <div class="flex justify-end gap-4">
                        <button
                            on:click={cancelDelete}
                            class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            on:click={deleteLobby}
                            class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                        >
                            {lobbies.find(l => l.id === deleteConfirmId) && isHost(lobbies.find(l => l.id === deleteConfirmId)!) ? 'Delete' : 'Leave'}
                        </button>
                    </div>
                </div>
            </div>
        {/if}

        <!-- Error Message -->
        {#if error}
            <div class="fixed bottom-4 right-4 bg-red-500/90 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-4">
                <span>{error}</span>
                <button
                    on:click={() => error = null}
                    class="text-white hover:text-white/80"
                >
                    ×
                </button>
            </div>
        {/if}
    </div>
</div>

<style>
    .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
    }

    .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.3);
    }
</style> 