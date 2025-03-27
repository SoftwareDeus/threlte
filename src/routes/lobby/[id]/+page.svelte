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
        slots: {
            slot1?: {
                player?: string;
                color: 'white' | 'black' | 'random';
            };
            slot2?: {
                player?: string;
                color: 'white' | 'black' | 'random';
            };
        };
        timeControl?: {
            minutes: number;
            increment: number;
        };
    }

    let lobby: Lobby | null = null;
    let error: string | null = null;
    let interval: number;
    let timeControl = {
        minutes: 10,
        increment: 0
    };

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

    async function updateTimeSettings() {
        if (!$playerName || !lobby) return;

        try {
            const response = await fetch(`/api/lobbies/${lobby.id}/time-settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    playerName: $playerName,
                    timeControl
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update time settings');
            }

            const updatedLobby = await response.json();
            lobby = updatedLobby;
        } catch (e) {
            error = 'Failed to update time settings';
            console.error(e);
        }
    }

    // Watch for changes in timeControl and update the lobby
    $: if (isHost() && lobby) {
        updateTimeSettings();
    }

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
            // If either player has random selected, randomize colors before starting
            if (lobby.slots.slot1?.color === 'random' || lobby.slots.slot2?.color === 'random') {
                await randomizePlayers();
            }

            const response = await fetch(`/api/lobbies/${lobby.id}/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    playerName: $playerName,
                    timeControl
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

    async function randomizePlayers() {
        if (!$playerName || !lobby) return;

        try {
            const response = await fetch(`/api/lobbies/${lobby.id}/randomize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    playerName: $playerName
                })
            });

            if (!response.ok) {
                throw new Error('Failed to randomize players');
            }

            const updatedLobby = await response.json();
            lobby = updatedLobby;
        } catch (e) {
            error = 'Failed to randomize players';
            console.error(e);
        }
    }

    function handleRandomClick() {
        if (lobby?.slots.slot1?.player && lobby?.slots.slot2?.player) {
            randomizePlayers();
        }
    }

    async function setPlayerColor(targetPlayer: string, color: 'white' | 'black' | 'random') {
        if (!$playerName || !lobby) return;

        try {
            const response = await fetch(`/api/lobbies/${lobby.id}/set-color`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    playerName: $playerName,
                    targetPlayer,
                    color
                })
            });

            if (!response.ok) {
                throw new Error('Failed to set player color');
            }

            const updatedLobby = await response.json();
            lobby = updatedLobby;
        } catch (e) {
            error = 'Failed to set player color';
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
        return !!lobby?.slots.slot1?.player && !!lobby?.slots.slot2?.player;
    }
</script>

<style>
    input[type="radio"] {
        appearance: none;
        -webkit-appearance: none;
        width: 16px;
        height: 16px;
        border: 2px solid #666;
        border-radius: 50%;
        outline: none;
        margin-right: 5px;
        position: relative;
        cursor: pointer;
    }

    input[type="radio"]:checked {
        border-color: white;
        background-color: white;
    }

    input[type="radio"]:checked::before {
        content: '';
        position: absolute;
        width: 8px;
        height: 8px;
        background-color: #1a1a1a;
        border-radius: 50%;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }
</style>

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
                        <div 
                            class="flex items-center justify-between p-4 rounded {!lobby.slots.slot1?.color ? 'bg-white/5' : lobby.slots.slot1.color === 'white' ? 'bg-white/20' : lobby.slots.slot1.color === 'black' ? 'bg-black/20' : 'bg-gray-500/20'}">
                            <div class="flex items-center gap-4">
                                <div>
                                    <span class="text-lg font-bold">Slot 1</span>
                                    <p class="text-white/70">{lobby.slots.slot1?.player || 'Waiting for player...'}</p>
                                </div>
                                {#if isHost()}
                                    <div class="flex items-center gap-4">
                                        <div class="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="color-slot1"
                                                id="white-{lobby?.slots?.slot1?.player}"
                                                checked={lobby?.slots?.slot1?.color === 'white'}
                                                on:change={() => lobby?.slots?.slot1?.player && setPlayerColor(lobby.slots.slot1.player, 'white' as const)}
                                                class="w-4 h-4"
                                            />
                                            <label for="white-{lobby?.slots?.slot1?.player}" class="text-sm font-medium text-white">White</label>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="color-slot1"
                                                id="black-{lobby?.slots?.slot1?.player}"
                                                checked={lobby?.slots?.slot1?.color === 'black'}
                                                on:change={() => lobby?.slots?.slot1?.player && setPlayerColor(lobby.slots.slot1.player, 'black' as const)}
                                                class="w-4 h-4"
                                            />
                                            <label for="black-{lobby?.slots?.slot1?.player}" class="text-sm font-medium text-white">Black</label>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="color-slot1"
                                                id="random-{lobby?.slots?.slot1?.player}"
                                                checked={lobby?.slots?.slot1?.color === 'random'}
                                                on:change={() => lobby?.slots?.slot1?.player && setPlayerColor(lobby.slots.slot1.player, 'random')}
                                                class="w-4 h-4"
                                            />
                                            <label for="random-{lobby?.slots?.slot1?.player}" class="text-sm font-medium text-white">Random</label>
                                        </div>
                                    </div>
                                {/if}
                            </div>
                            {#if lobby.slots.slot1?.player === $playerName}
                                <span class="px-3 py-1 bg-[#4CAF50] text-white rounded text-sm">You</span>
                            {/if}
                        </div>
                        <div 
                            class="flex items-center justify-between p-4 rounded {!lobby.slots.slot2?.color ? 'bg-white/5' : lobby.slots.slot2.color === 'white' ? 'bg-white/20' : lobby.slots.slot2.color === 'black' ? 'bg-black/20' : 'bg-gray-500/20'}">
                            <div class="flex items-center gap-4">
                                <div>
                                    <span class="text-lg font-bold">Slot 2</span>
                                    <p class="text-white/70">{lobby.slots.slot2?.player || 'Waiting for player...'}</p>
                                </div>
                                {#if isHost()}
                                    <div class="flex items-center gap-4">
                                        <div class="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="color-slot2"
                                                id="white-{lobby?.slots?.slot2?.player}"
                                                checked={lobby?.slots?.slot2?.color === 'white'}
                                                on:change={() => lobby?.slots?.slot2?.player && setPlayerColor(lobby.slots.slot2.player, 'white' as const)}
                                                class="w-4 h-4"
                                            />
                                            <label for="white-{lobby?.slots?.slot2?.player}" class="text-sm font-medium text-white">White</label>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="color-slot2"
                                                id="black-{lobby?.slots?.slot2?.player}"
                                                checked={lobby?.slots?.slot2?.color === 'black'}
                                                on:change={() => lobby?.slots?.slot2?.player && setPlayerColor(lobby.slots.slot2.player, 'black' as const)}
                                                class="w-4 h-4"
                                            />
                                            <label for="black-{lobby?.slots?.slot2?.player}" class="text-sm font-medium text-white">Black</label>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="color-slot2"
                                                id="random-{lobby?.slots?.slot2?.player}"
                                                checked={lobby?.slots?.slot2?.color === 'random'}
                                                on:change={() => lobby?.slots?.slot2?.player && setPlayerColor(lobby.slots.slot2.player, 'random')}
                                                class="w-4 h-4"
                                            />
                                            <label for="random-{lobby?.slots?.slot2?.player}" class="text-sm font-medium text-white">Random</label>
                                        </div>
                                    </div>
                                {/if}
                            </div>
                            {#if lobby.slots.slot2?.player === $playerName}
                                <span class="px-3 py-1 bg-[#4CAF50] text-white rounded text-sm">You</span>
                            {/if}
                        </div>
                    </div>
                    {#if isHost() && isFull()}
                        <div class="mt-4 flex gap-4">
                            <button
                                on:click={startGame}
                                class="px-6 py-2 bg-[#4CAF50] text-white rounded hover:bg-[#45a049] transition-colors"
                            >
                                Start Game
                            </button>
                        </div>
                    {/if}
                </div>

                <div class="mb-6">
                    <h2 class="text-2xl font-bold mb-4">Time Control</h2>
                    <div class="space-y-4 bg-white/5 rounded p-4">
                        {#if isHost()}
                            <div class="flex items-center gap-4">
                                <label class="text-lg">Minutes per player:</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="60"
                                    bind:value={timeControl.minutes}
                                    class="w-20 px-2 py-1 bg-white/10 border border-white/20 rounded text-white"
                                />
                            </div>
                            <div class="flex items-center gap-4">
                                <label class="text-lg">Increment (seconds):</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="60"
                                    bind:value={timeControl.increment}
                                    class="w-20 px-2 py-1 bg-white/10 border border-white/20 rounded text-white"
                                />
                            </div>
                        {:else}
                            <div class="flex items-center gap-4">
                                <label class="text-lg">Minutes per player:</label>
                                <span class="text-white">{lobby?.timeControl?.minutes || 10}</span>
                            </div>
                            <div class="flex items-center gap-4">
                                <label class="text-lg">Increment (seconds):</label>
                                <span class="text-white">{lobby?.timeControl?.increment || 0}</span>
                            </div>
                        {/if}
                    </div>
                </div>

                <div class="flex justify-end gap-4">
                    {#if isHost()}
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