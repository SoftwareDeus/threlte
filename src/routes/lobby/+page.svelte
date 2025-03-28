<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { goto } from '$app/navigation';
    import { playerName } from '$lib/stores/playerStore';
    import { lobbyId } from '$lib/stores/lobbyStore';
    import { resources } from '$lib/resources';
    import { ChessColor } from '$lib/types/chess';
    import * as Sentry from '@sentry/sveltekit';
    import LobbyList from '$lib/components/lobby/LobbyList.svelte';
    import CreateLobbyForm from '$lib/components/lobby/CreateLobbyForm.svelte';

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
    let pollInterval: NodeJS.Timeout;

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
</script>

<div class="w-screen h-screen bg-[#1a1a1a] text-white font-sans p-8 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-white/10 [&::-webkit-scrollbar-track]:rounded [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb:hover]:bg-white/30">
    <div class="max-w-4xl mx-auto">
        <h1 class="text-4xl font-bold mb-8">{resources.ui.lobby.title}</h1>

        <CreateLobbyForm
            bind:newLobbyName
            onCreateLobby={createLobby}
        />

        <LobbyList
            {lobbies}
            {deleteConfirmId}
            onDeleteConfirm={confirmDelete}
            onDeleteCancel={cancelDelete}
            onDelete={deleteLobby}
            onJoin={joinLobby}
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