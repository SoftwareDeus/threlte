<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
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

    let lobby: Lobby | null = null;
    let error: string | null = null;
    let interval: number;

    onMount(() => {
        if (!$playerName) {
            error = 'Please enter your name in the main menu';
            setTimeout(() => goto('/'), 2000);
            return;
        }

        // Set the lobbyId in the store
        lobbyId.set($page.params.id);
        fetchLobby();
        // Set up polling to check for lobby updates
        interval = setInterval(fetchLobby, 1000);

        return () => {
            if (interval) clearInterval(interval);
        };
    });

    async function fetchLobby() {
        try {
            const response = await fetch(`/api/lobbies/${$page.params.id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch lobby');
            }
            const data = await response.json();
            lobby = data;

            // If the game has started, redirect to the game
            if (data.status === 'playing') {
                // Set the lobbyId in the store before redirecting
                lobbyId.set(data.id);
                goto('/game');
            }
        } catch (e) {
            error = 'Failed to fetch lobby';
            console.error(e);
        }
    }

    async function startGame() {
        if (!$playerName || !lobby) return;

        try {
            const response = await fetch(`/api/lobbies/${lobby.id}/start`, {
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
            lobbyId.set(lobby.id);
            goto('/game');
        } catch (e) {
            error = 'Failed to start game';
            console.error(e);
        }
    }

    async function deleteLobby() {
        if (!$playerName || !lobby) return;

        try {
            const response = await fetch(`/api/lobbies/${lobby.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    playerName: $playerName
                })
            });

            if (!response.ok) {
                throw new Error('Failed to delete lobby');
            }

            goto('/lobby');
        } catch (e) {
            error = 'Failed to delete lobby';
            console.error(e);
        }
    }

    function isHost(): boolean {
        return lobby?.host === $playerName;
    }

    function isFull(): boolean {
        return !!lobby?.players.white && !!lobby?.players.black;
    }
</script>

<div class="w-screen h-screen bg-[#1a1a1a] text-white font-sans p-8">
    <div class="max-w-4xl mx-auto">
        <div class="flex justify-between items-center mb-8">
            <h1 class="text-4xl font-bold">Lobby: {lobby?.name || 'Loading...'}</h1>
            <button
                on:click={() => goto('/lobby')}
                class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
                Back to Lobbies
            </button>
        </div>

        {#if lobby}
            <div class="bg-white/10 rounded-lg p-6">
                <div class="mb-6">
                    <h2 class="text-2xl font-bold mb-4">Players</h2>
                    <div class="space-y-4">
                        <div class="flex items-center justify-between p-4 bg-white/5 rounded">
                            <div>
                                <span class="text-lg font-bold">White (Host)</span>
                                <p class="text-white/70">{lobby.players.white}</p>
                            </div>
                            {#if lobby.players.white === $playerName}
                                <span class="px-3 py-1 bg-[#4CAF50] text-white rounded text-sm">You</span>
                            {/if}
                        </div>
                        <div class="flex items-center justify-between p-4 bg-white/5 rounded">
                            <div>
                                <span class="text-lg font-bold">Black</span>
                                <p class="text-white/70">{lobby.players.black || 'Waiting for player...'}</p>
                            </div>
                            {#if lobby.players.black === $playerName}
                                <span class="px-3 py-1 bg-[#4CAF50] text-white rounded text-sm">You</span>
                            {/if}
                        </div>
                    </div>
                </div>

                <div class="flex justify-end gap-4">
                    {#if isHost()}
                        {#if isFull()}
                            <button
                                on:click={startGame}
                                class="px-6 py-2 bg-[#4CAF50] text-white rounded hover:bg-[#45a049] transition-colors"
                            >
                                Start Game
                            </button>
                        {/if}
                        <button
                            on:click={deleteLobby}
                            class="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                        >
                            Delete Lobby
                        </button>
                    {:else}
                        <button
                            on:click={deleteLobby}
                            class="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                        >
                            Leave Lobby
                        </button>
                    {/if}
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