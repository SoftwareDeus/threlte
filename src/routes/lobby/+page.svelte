<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
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
                color: 'white' | 'black';
            };
            slot2?: {
                player?: string;
                color: 'white' | 'black';
            };
        };
        timeControl?: {
            minutes: number;
            increment: number;
        };
    }

    let lobbies: Lobby[] = [];
    let newLobbyName = '';
    let error: string | null = null;
    let deleteConfirmId: string | null = null;

    onMount(async () => {
        if (!$playerName) {
            error = resources.common.errors.nameRequired;
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
            error = resources.common.errors.fetchFailed;
            console.error(e);
        }
    }

    async function createLobby() {
        if (!$playerName) {
            error = resources.common.errors.nameRequired;
            setTimeout(() => goto('/'), 2000);
            return;
        }

        if (!newLobbyName.trim()) {
            error = resources.lobby.nameInput.placeholder;
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
                throw new Error(resources.common.errors.createFailed);
            }

            const newLobby = await response.json();
            goto(`/lobby/${newLobby.id}`);
        } catch (e) {
            error = resources.common.errors.createFailed;
            console.error(e);
        }
    }

    async function joinLobby(lobbyId: string) {
        if (!$playerName) {
            error = resources.common.errors.nameRequired;
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
                throw new Error(resources.common.errors.joinFailed);
            }

            goto(`/lobby/${lobbyId}`);
        } catch (e) {
            error = resources.common.errors.joinFailed;
            console.error(e);
        }
    }

    async function startGame(id: string) {
        if (!$playerName) {
            error = resources.common.errors.nameRequired;
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
                throw new Error(resources.common.errors.startFailed);
            }

            // Set the lobbyId in the store before redirecting
            lobbyId.set(id);
            goto('/game');
        } catch (e) {
            error = resources.common.errors.startFailed;
            console.error(e);
        }
    }

    async function deleteLobby() {
        if (!$playerName || !deleteConfirmId) {
            error = resources.common.errors.nameRequired;
            setTimeout(() => goto('/'), 2000);
            return;
        }

        try {
            const response = await fetch(`/api/lobbies/${deleteConfirmId}`, {
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

            deleteConfirmId = null;
            await fetchLobbies();
        } catch (e) {
            error = resources.common.errors.deleteFailed;
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
        return lobby.host === $playerName;
    }

    function isJoined(lobby: Lobby): boolean {
        return lobby.slots?.slot1?.player === $playerName || lobby.slots?.slot2?.player === $playerName;
    }
</script>

<div class="w-screen h-screen bg-[#1a1a1a] text-white font-sans p-8">
    <div class="max-w-4xl mx-auto">
        <h1 class="text-4xl font-bold mb-8">{resources.lobby.title}</h1>

        <!-- Create Lobby -->
        <div class="mb-8">
            <h2 class="text-2xl font-bold mb-4">{resources.lobby.createNew}</h2>
            <div class="flex gap-4">
                <input
                    type="text"
                    bind:value={newLobbyName}
                    placeholder={resources.lobby.nameInput.placeholder}
                    class="flex-1 px-4 py-2 border-2 border-white/20 rounded bg-white/10 text-white text-base transition-colors focus:outline-none focus:border-[#4CAF50] placeholder-white/50"
                />
                <button
                    on:click={createLobby}
                    class="px-6 py-2 bg-[#4CAF50] text-white rounded hover:bg-[#45a049] transition-colors"
                >
                    {resources.common.buttons.create}
                </button>
            </div>
        </div>

        <!-- Lobby List -->
        <div class="space-y-4 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
            {#each lobbies as lobby, index (lobby.id)}
                {#if deleteConfirmId === lobby.id}
                    <div class="bg-white/10 rounded-lg p-4 h-[100px] flex items-center">
                        <div class="w-full flex justify-between items-center">
                            <div class="w-16 text-center text-white/50">
                                {index + 1}
                            </div>
                            <div class="flex-1 text-center">
                                <h3 class="text-xl font-bold mb-2">{resources.common.labels.confirmDelete}</h3>
                                <p class="text-white/70">{resources.common.labels.confirmDeleteMessage}</p>
                            </div>
                            <div class="w-48 flex justify-end gap-2">
                                <button
                                    on:click={cancelDelete}
                                    class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                                >
                                    {resources.common.buttons.cancel}
                                </button>
                                <button
                                    on:click={deleteLobby}
                                    class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                >
                                    {resources.common.buttons.delete}
                                </button>
                            </div>
                        </div>
                    </div>
                {:else}
                    <div class="bg-white/10 rounded-lg p-4 hover:bg-white/20 transition-colors h-[100px] flex items-center">
                        <div class="w-full flex justify-between items-center">
                            <div class="w-16 text-center text-white/50">
                                {index + 1}
                            </div>
                            <div class="flex-1">
                                <h3 class="text-xl font-bold">{lobby.name}</h3>
                                <p class="text-white/70">
                                    {resources.common.labels.host}: {lobby.host}
                                    {#if isHost(lobby)}
                                        <span class="text-[#4CAF50] ml-2">({resources.common.labels.you})</span>
                                    {/if}
                                </p>
                                <div class="text-sm text-white/50 mt-1">
                                    {#if lobby.slots.slot1?.player}
                                        <span class="mr-2">Slot 1: {lobby.slots.slot1.player} ({lobby.slots.slot1.color})</span>
                                    {/if}
                                    {#if lobby.slots.slot2?.player}
                                        <span>Slot 2: {lobby.slots.slot2.player} ({lobby.slots.slot2.color})</span>
                                    {/if}
                                </div>
                            </div>
                            <div class="w-48 flex justify-end gap-2">
                                {#if isHost(lobby)}
                                    {#if lobby.slots?.slot1?.player && lobby.slots?.slot2?.player}
                                        <button
                                            on:click={() => startGame(lobby.id)}
                                            class="px-4 py-2 bg-[#4CAF50] text-white rounded hover:bg-[#45a049] transition-colors"
                                        >
                                            {resources.common.buttons.start}
                                        </button>
                                    {/if}
                                    <button
                                        on:click={() => confirmDelete(lobby.id)}
                                        class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                    >
                                        {resources.common.buttons.delete}
                                    </button>
                                {:else if isJoined(lobby)}
                                    <button
                                        on:click={() => confirmDelete(lobby.id)}
                                        class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                    >
                                        {resources.common.buttons.leave}
                                    </button>
                                {:else if lobby.slots?.slot1?.player && lobby.slots?.slot2?.player}
                                    <span class="px-4 py-2 bg-gray-500 text-white rounded">
                                        {resources.common.labels.full}
                                    </span>
                                    <button
                                        on:click={() => confirmDelete(lobby.id)}
                                        class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                    >
                                        {resources.common.buttons.delete}
                                    </button>
                                {:else}
                                    <button
                                        on:click={() => joinLobby(lobby.id)}
                                        class="px-4 py-2 bg-[#4CAF50] text-white rounded hover:bg-[#45a049] transition-colors"
                                    >
                                        {resources.common.buttons.join}
                                    </button>
                                    <button
                                        on:click={() => confirmDelete(lobby.id)}
                                        class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                    >
                                        {resources.common.buttons.delete}
                                    </button>
                                {/if}
                            </div>
                        </div>
                    </div>
                {/if}
            {/each}
        </div>

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