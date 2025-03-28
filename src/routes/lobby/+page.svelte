<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { playerName } from '$lib/stores/playerStore';
    import { lobbyId } from '$lib/stores/lobbyStore';
    import { resources } from '$lib/resources';
    import { ChessColor } from '$lib/types/chess';
    import * as Sentry from '@sentry/sveltekit';

    interface Lobby {
        id: string;
        name: string;
        host: string;
        status: 'waiting' | 'playing';
        created: Date;
        slots: {
            slot1?: {
                player?: string;
                color: ChessColor;
            };
            slot2?: {
                player?: string;
                color: ChessColor;
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
        try {
            if (!$playerName) {
                Sentry.captureMessage('Missing player name', {
                    level: 'error',
                    extra: {
                        errorMessage: resources.errors.common.nameRequired
                    }
                });
                error = resources.errors.common.nameRequired;
                setTimeout(() => goto('/'), 2000);
                return;
            }
            await fetchLobbies();
        } catch (error) {
            Sentry.captureException(error, {
                extra: {
                    errorMessage: resources.errors.common.fetchFailed
                }
            });
            error = resources.errors.common.fetchFailed;
        }
    });

    async function fetchLobbies() {
        try {
            const response = await fetch('/api/lobbies');
            if (!response.ok) {
                throw new Error(resources.errors.common.fetchFailed);
            }
            lobbies = await response.json();
        } catch (e) {
            Sentry.captureException(e, {
                extra: {
                    errorMessage: resources.errors.common.fetchFailed
                }
            });
            console.error(e);
            throw new Error(resources.errors.common.fetchFailed);
        }
    }

    async function createLobby() {
        if (!$playerName) {
            Sentry.captureMessage('Missing player name', {
                level: 'error',
                extra: {
                    errorMessage: resources.errors.common.nameRequired
                }
            });
            error = resources.errors.common.nameRequired;
            setTimeout(() => goto('/'), 2000);
            return;
        }

        if (!newLobbyName.trim()) {
            Sentry.captureMessage('Missing lobby name', {
                level: 'error',
                extra: {
                    errorMessage: resources.errors.common.lobbyNameRequired
                }
            });
            error = resources.errors.common.lobbyNameRequired;
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
                throw new Error(resources.errors.common.createFailed);
            }

            const newLobby = await response.json();
            lobbies = [...lobbies, newLobby];
            goto(`/lobby/${newLobby.id}`);
        } catch (e) {
            Sentry.captureException(e, {
                extra: {
                    errorMessage: resources.errors.common.createFailed
                }
            });
            console.error(e);
            throw new Error(resources.errors.common.createFailed);
        }
    }

    async function joinLobby(lobbyId: string) {
        if (!$playerName) {
            Sentry.captureMessage('Missing player name', {
                level: 'error',
                extra: {
                    errorMessage: resources.errors.common.nameRequired
                }
            });
            error = resources.errors.common.nameRequired;
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
                throw new Error(resources.errors.common.joinFailed);
            }

            const updatedLobby = await response.json();
            lobbies = lobbies.map(l => l.id === lobbyId ? updatedLobby : l);
            goto(`/lobby/${lobbyId}`);
        } catch (e) {
            Sentry.captureException(e, {
                extra: {
                    errorMessage: resources.errors.common.joinFailed
                }
            });
            console.error(e);
            throw new Error(resources.errors.common.joinFailed);
        }
    }

    async function startGame(id: string) {
        if (!$playerName) {
            Sentry.captureMessage('Missing player name', {
                level: 'error',
                extra: {
                    errorMessage: resources.errors.common.nameRequired
                }
            });
            error = resources.errors.common.nameRequired;
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
                throw new Error(resources.errors.common.startFailed);
            }

            const updatedLobby = await response.json();
            lobbies = lobbies.map(l => l.id === id ? updatedLobby : l);
            lobbyId.set(id);
            goto(`/game/${id}`);
        } catch (e) {
            Sentry.captureException(e, {
                extra: {
                    errorMessage: resources.errors.common.startFailed
                }
            });
            console.error(e);
            throw new Error(resources.errors.common.startFailed);
        }
    }

    async function deleteLobby() {
        if (!$playerName || !deleteConfirmId) {
            Sentry.captureMessage('Missing player name or lobby ID', {
                level: 'error',
                extra: {
                    errorMessage: resources.errors.common.nameRequired
                }
            });
            error = resources.errors.common.nameRequired;
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
                throw new Error(resources.errors.common.deleteFailed);
            }

            deleteConfirmId = null;
            await fetchLobbies();
        } catch (e) {
            Sentry.captureException(e, {
                extra: {
                    errorMessage: resources.errors.common.deleteFailed
                }
            });
            console.error(e);
            throw new Error(resources.errors.common.deleteFailed);
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
        <h1 class="text-4xl font-bold mb-8">{resources.ui.lobby.title}</h1>

        <!-- Create Lobby -->
        <div class="mb-8">
            <h2 class="text-2xl font-bold mb-4">{resources.ui.lobby.createNew}</h2>
            <div class="flex gap-4">
                <input
                    type="text"
                    bind:value={newLobbyName}
                    placeholder={resources.ui.lobby.nameInput.placeholder}
                    class="flex-1 px-4 py-2 border-2 border-white/20 rounded bg-white/10 text-white text-base transition-colors focus:outline-none focus:border-[#4CAF50] placeholder-white/50"
                />
                <button
                    on:click={createLobby}
                    class="px-6 py-2 bg-[#4CAF50] text-white rounded hover:bg-[#45a049] transition-colors"
                >
                    {resources.ui.buttons.create}
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
                                <h3 class="text-xl font-bold mb-2">{resources.ui.labels.confirmDelete}</h3>
                                <p class="text-white/70">{resources.ui.labels.confirmDeleteMessage}</p>
                            </div>
                            <div class="w-48 flex justify-end gap-2">
                                <button
                                    on:click={cancelDelete}
                                    class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                                >
                                    {resources.ui.buttons.cancel}
                                </button>
                                <button
                                    on:click={deleteLobby}
                                    class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                >
                                    {resources.ui.buttons.delete}
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
                                    {resources.ui.labels.host}: {lobby.host}
                                    {#if isHost(lobby)}
                                        <span class="text-[#4CAF50] ml-2">({resources.ui.labels.you})</span>
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
                                            {resources.ui.buttons.start}
                                        </button>
                                    {/if}
                                    <button
                                        on:click={() => confirmDelete(lobby.id)}
                                        class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                    >
                                        {resources.ui.buttons.delete}
                                    </button>
                                {:else if isJoined(lobby)}
                                    <button
                                        on:click={() => confirmDelete(lobby.id)}
                                        class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                    >
                                        {resources.ui.buttons.leave}
                                    </button>
                                {:else if lobby.slots?.slot1?.player && lobby.slots?.slot2?.player}
                                    <span class="px-4 py-2 bg-gray-500 text-white rounded">
                                        {resources.ui.labels.full}
                                    </span>
                                    <button
                                        on:click={() => confirmDelete(lobby.id)}
                                        class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                    >
                                        {resources.ui.buttons.delete}
                                    </button>
                                {:else}
                                    <button
                                        on:click={() => joinLobby(lobby.id)}
                                        class="px-4 py-2 bg-[#4CAF50] text-white rounded hover:bg-[#45a049] transition-colors"
                                    >
                                        {resources.ui.buttons.join}
                                    </button>
                                    <button
                                        on:click={() => confirmDelete(lobby.id)}
                                        class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                    >
                                        {resources.ui.buttons.delete}
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
                    {resources.errors.common.closeButton}
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