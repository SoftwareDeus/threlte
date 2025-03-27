<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { playerName } from '$lib/stores/playerStore';
    import { lobbyId } from '$lib/stores/lobbyStore';
    import { resources } from '$lib/resources';

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
            error = resources.common.errors.nameRequired;
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
                throw new Error(resources.common.errors.updateFailed);
            }

            const updatedLobby = await response.json();
            lobby = updatedLobby;
        } catch (e) {
            error = resources.common.errors.updateFailed;
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
                throw new Error(resources.common.errors.fetchFailed);
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
            error = resources.common.errors.fetchFailed;
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
                throw new Error(resources.common.errors.startFailed);
            }

            // Set the lobbyId in the store before redirecting
            lobbyId.set(lobby.id);
            goto('/game');
        } catch (e) {
            error = resources.common.errors.startFailed;
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
                throw new Error(resources.common.errors.updateFailed);
            }

            const updatedLobby = await response.json();
            lobby = updatedLobby;
        } catch (e) {
            error = resources.common.errors.updateFailed;
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
                throw new Error(resources.common.errors.updateFailed);
            }

            const updatedLobby = await response.json();
            lobby = updatedLobby;
        } catch (e) {
            error = resources.common.errors.updateFailed;
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
                throw new Error(resources.common.errors.deleteFailed);
            }

            goto('/lobby');
        } catch (e) {
            error = resources.common.errors.deleteFailed;
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

<div class="w-screen h-screen bg-[#1a1a1a] text-white font-sans p-8">
    <div class="max-w-4xl mx-auto">
        <div class="flex justify-between items-center mb-8">
            <h1 class="text-4xl font-bold">{lobby?.name || resources.common.labels.loading}</h1>
            <button
                on:click={() => goto('/lobby')}
                class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
                {resources.common.labels.backToLobbies}
            </button>
        </div>

        {#if lobby}
            <div class="space-y-8">
                <!-- Players -->
                <div class="bg-white/10 rounded-lg p-6">
                    <h2 class="text-2xl font-bold mb-4">{resources.lobby.players.title}</h2>
                    <div class="space-y-4">
                        <!-- Slot 1 -->
                        <div class="p-4 rounded-lg" style="background-color: {lobby.slots.slot1?.color === 'white' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.2)'}">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-4">
                                    <span class="text-lg">{resources.lobby.players.slot1}:</span>
                                    <span class="text-white/70">
                                        {lobby.slots.slot1?.player || resources.lobby.players.waitingForPlayer}
                                    </span>
                                    {#if lobby.slots.slot1?.player === $playerName}
                                        <span class="text-[#4CAF50]">({resources.common.labels.you})</span>
                                    {/if}
                                </div>
                                {#if isHost()}
                                    <div class="flex gap-4">
                                        <label class="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="slot1-color"
                                                checked={lobby?.slots?.slot1?.color === 'white'}
                                                on:change={() => lobby?.slots?.slot1?.player && setPlayerColor(lobby.slots.slot1.player, 'white')}
                                            />
                                            {resources.lobby.players.color.white}
                                        </label>
                                        <label class="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="slot1-color"
                                                checked={lobby?.slots?.slot1?.color === 'black'}
                                                on:change={() => lobby?.slots?.slot1?.player && setPlayerColor(lobby.slots.slot1.player, 'black')}
                                            />
                                            {resources.lobby.players.color.black}
                                        </label>
                                        <label class="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="slot1-color"
                                                checked={lobby?.slots?.slot1?.color === 'random'}
                                                on:change={() => lobby?.slots?.slot1?.player && setPlayerColor(lobby.slots.slot1.player, 'random')}
                                            />
                                            {resources.lobby.players.color.random}
                                        </label>
                                    </div>
                                {/if}
                            </div>
                        </div>

                        <!-- Slot 2 -->
                        <div class="p-4 rounded-lg" style="background-color: {lobby.slots.slot2?.color === 'white' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.2)'}">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-4">
                                    <span class="text-lg">{resources.lobby.players.slot2}:</span>
                                    <span class="text-white/70">
                                        {lobby.slots.slot2?.player || resources.lobby.players.waitingForPlayer}
                                    </span>
                                    {#if lobby.slots.slot2?.player === $playerName}
                                        <span class="text-[#4CAF50]">({resources.common.labels.you})</span>
                                    {/if}
                                </div>
                                {#if isHost()}
                                    <div class="flex gap-4">
                                        <label class="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="slot2-color"
                                                checked={lobby?.slots?.slot2?.color === 'white'}
                                                on:change={() => lobby?.slots?.slot2?.player && setPlayerColor(lobby.slots.slot2.player, 'white')}
                                            />
                                            {resources.lobby.players.color.white}
                                        </label>
                                        <label class="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="slot2-color"
                                                checked={lobby?.slots?.slot2?.color === 'black'}
                                                on:change={() => lobby?.slots?.slot2?.player && setPlayerColor(lobby.slots.slot2.player, 'black')}
                                            />
                                            {resources.lobby.players.color.black}
                                        </label>
                                        <label class="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="slot2-color"
                                                checked={lobby?.slots?.slot2?.color === 'random'}
                                                on:change={() => lobby?.slots?.slot2?.player && setPlayerColor(lobby.slots.slot2.player, 'random')}
                                            />
                                            {resources.lobby.players.color.random}
                                        </label>
                                    </div>
                                {/if}
                            </div>
                        </div>

                        {#if isHost() && isFull()}
                            <div class="flex justify-end mt-4">
                                <button
                                    on:click={handleRandomClick}
                                    class="px-4 py-2 bg-[#4CAF50] text-white rounded hover:bg-[#45a049] transition-colors"
                                >
                                    {resources.common.buttons.randomize}
                                </button>
                            </div>
                        {/if}
                    </div>
                </div>

                <!-- Time Control -->
                <div class="bg-white/10 rounded-lg p-6">
                    <h2 class="text-2xl font-bold mb-4">{resources.lobby.timeControl.title}</h2>
                    <div class="space-y-4">
                        {#if isHost()}
                            <div class="flex items-center gap-4">
                                <label class="text-lg">{resources.lobby.timeControl.minutesLabel}</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="60"
                                    bind:value={timeControl.minutes}
                                    class="w-20 px-2 py-1 bg-white/10 border border-white/20 rounded text-white"
                                />
                            </div>
                            <div class="flex items-center gap-4">
                                <label class="text-lg">{resources.lobby.timeControl.incrementLabel}</label>
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
                                <label class="text-lg">{resources.lobby.timeControl.minutesLabel}</label>
                                <span class="text-white">{lobby?.timeControl?.minutes || 10}</span>
                            </div>
                            <div class="flex items-center gap-4">
                                <label class="text-lg">{resources.lobby.timeControl.incrementLabel}</label>
                                <span class="text-white">{lobby?.timeControl?.increment || 0}</span>
                            </div>
                        {/if}
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex justify-end gap-4">
                    {#if isHost()}
                        <button
                            on:click={deleteLobby}
                            class="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                        >
                            {resources.common.buttons.delete}
                        </button>
                        {#if isFull()}
                            <button
                                on:click={startGame}
                                class="px-6 py-2 bg-[#4CAF50] text-white rounded hover:bg-[#45a049] transition-colors"
                            >
                                {resources.common.buttons.start}
                            </button>
                        {/if}
                    {:else}
                        <button
                            on:click={deleteLobby}
                            class="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                        >
                            {resources.common.buttons.leave}
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
                    {resources.common.errors.closeButton}
                </button>
            </div>
        {/if}
    </div>
</div>

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
        border-color: #4CAF50;
    }

    input[type="radio"]:checked::after {
        content: '';
        position: absolute;
        width: 8px;
        height: 8px;
        background: #4CAF50;
        border-radius: 50%;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }
</style> 