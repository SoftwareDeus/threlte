<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { goto } from '$app/navigation';
    import { playerName } from '$lib/stores/playerStore';
    import { lobbyId } from '$lib/stores/lobbyStore';
    import { resources } from '$lib/resources';
    import type { Lobby } from '$lib/types/chess';
    import * as Sentry from '@sentry/sveltekit';
    import LobbyList from '$lib/components/lobby/LobbyList.svelte';
    import CreateLobbyForm from '$lib/components/lobby/CreateLobbyForm.svelte';
    import { getLobbies, createLobby, joinLobby, startLobby, deleteLobby } from '$lib/services/lobbyService';

    let lobbies: Lobby[] = [];
    let newLobbyName = '';
    let error: string | null = null;
    let deleteConfirmId: string | null = null;
    let pollInterval: NodeJS.Timeout;

    async function fetchLobbies() {
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
            lobbies = await getLobbies();
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

    async function createLobbyHandler() {
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
            const newLobby = await createLobby($playerName, newLobbyName);
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

    async function joinLobbyHandler(id: string) {
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
            const updatedLobby = await joinLobby(id, $playerName);
            lobbies = lobbies.map(l => l.id === id ? updatedLobby : l);
            goto(`/lobby/${id}`);
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
            await startLobby(id, $playerName, { minutes: 10, increment: 0 });
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

    async function deleteLobbyHandler() {
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
            await deleteLobby(deleteConfirmId, $playerName);
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
            // Start polling for lobby updates every 2 seconds
            pollInterval = setInterval(fetchLobbies, 2000);
        } catch (error) {
            Sentry.captureException(error, {
                extra: {
                    errorMessage: resources.errors.common.fetchFailed
                }
            });
            error = resources.errors.common.fetchFailed;
        }
    });

    // Clean up the interval when the component is destroyed
    onDestroy(() => {
        if (pollInterval) {
            clearInterval(pollInterval);
        }
    });
</script>

<div class="w-screen h-screen bg-[#1a1a1a] text-white font-sans p-8 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-white/10 [&::-webkit-scrollbar-track]:rounded [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb:hover]:bg-white/30">
    <div class="max-w-4xl mx-auto">
        <h1 class="text-4xl font-bold mb-8">{resources.ui.lobby.title}</h1>

        <CreateLobbyForm 
            bind:newLobbyName
            onCreateLobby={createLobbyHandler}
        />

        <LobbyList 
            {lobbies}
            {deleteConfirmId}
            onDeleteConfirm={confirmDelete}
            onDeleteCancel={cancelDelete}
            onDelete={deleteLobbyHandler}
            onJoin={joinLobbyHandler}
            onStart={startGame}
        />
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