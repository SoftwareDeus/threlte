<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { goto } from '$app/navigation';
    import { authStore } from '$lib/stores/authStore';
    import { lobbyId, lobbies } from '$lib/stores/lobbyStore';
    import { resources } from '$lib/resources';
    import type { Lobby } from '$lib/types/chess';
    import * as Sentry from '@sentry/sveltekit';
    import LobbyList from '$lib/components/lobby/LobbyList.svelte';
    import CreateLobbyForm from '$lib/components/lobby/CreateLobbyForm.svelte';
    import { getLobbies, createLobby, joinLobby, startLobby, deleteLobby } from '$lib/services/lobbyService';

    let newLobbyName = '';
    let error: string | null = null;
    let deleteConfirmId: string | null = null;
    let pollInterval: NodeJS.Timeout;

    async function fetchLobbies() {
        try {
            if ($authStore.loading) {
                return; // Wait for auth to initialize
            }

            if (!$authStore.user?.id) {
                Sentry.captureMessage('User not authenticated', {
                    level: 'error',
                    extra: {
                        errorMessage: resources.errors.common.authRequired
                    }
                });
                error = resources.errors.common.authRequired;
                setTimeout(() => goto('/auth'), 2000);
                return;
            }
            const fetchedLobbies = await getLobbies();
            lobbies.set(fetchedLobbies);
        } catch (e) {
            Sentry.captureException(e, {
                extra: {
                    errorMessage: resources.errors.common.fetchFailed
                }
            });
            console.error(e);
            error = resources.errors.common.fetchFailed;
        }
    }

    async function createLobbyHandler() {
        if (!$authStore.user?.id) {
            console.error('User not authenticated');
            Sentry.captureMessage('User not authenticated', {
                level: 'error',
                extra: {
                    errorMessage: resources.errors.common.authRequired
                }
            });
            error = resources.errors.common.authRequired;
            setTimeout(() => goto('/auth'), 2000);
            return;
        }

        if (!newLobbyName.trim()) {
            console.error('Missing lobby name');
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
            console.log('Creating lobby with user:', $authStore.user.id);
            const newLobby = await createLobby($authStore.user.id, newLobbyName);
            console.log('Created lobby:', newLobby);
            lobbies.update(currentLobbies => [...currentLobbies, newLobby]);
            lobbyId.set(newLobby.id);
            await goto(`/lobby/${newLobby.id}`);
        } catch (e) {
            console.error('Error creating lobby:', e);
            Sentry.captureException(e, {
                extra: {
                    errorMessage: resources.errors.common.createFailed,
                    userId: $authStore.user.id,
                    lobbyName: newLobbyName
                }
            });
            error = resources.errors.common.createFailed;
        }
    }

    async function joinLobbyHandler(id: string) {
        if (!$authStore.user?.id) {
            Sentry.captureMessage('User not authenticated', {
                level: 'error',
                extra: {
                    errorMessage: resources.errors.common.authRequired
                }
            });
            error = resources.errors.common.authRequired;
            setTimeout(() => goto('/auth'), 2000);
            return;
        }

        try {
            const updatedLobby = await joinLobby(id, $authStore.user.id);
            lobbies.update(currentLobbies => 
                currentLobbies.map(l => l.id === id ? updatedLobby : l)
            );
            lobbyId.set(id);
            await goto(`/lobby/${id}`);
        } catch (e) {
            Sentry.captureException(e, {
                extra: {
                    errorMessage: resources.errors.common.joinFailed
                }
            });
            console.error(e);
            error = resources.errors.common.joinFailed;
        }
    }

    async function startGame(id: string) {
        if (!$authStore.user?.id) {
            Sentry.captureMessage('User not authenticated', {
                level: 'error',
                extra: {
                    errorMessage: resources.errors.common.authRequired
                }
            });
            error = resources.errors.common.authRequired;
            setTimeout(() => goto('/auth'), 2000);
            return;
        }

        try {
            await startLobby(id, $authStore.user.id, { minutes: 10, increment: 0 });
            lobbyId.set(id);
            await goto(`/game/${id}`);
        } catch (e) {
            Sentry.captureException(e, {
                extra: {
                    errorMessage: resources.errors.common.startFailed
                }
            });
            console.error(e);
            error = resources.errors.common.startFailed;
        }
    }

    async function deleteLobbyHandler() {
        if (!$authStore.user?.id || !deleteConfirmId) {
            Sentry.captureMessage('User not authenticated or missing lobby ID', {
                level: 'error',
                extra: {
                    errorMessage: resources.errors.common.authRequired
                }
            });
            error = resources.errors.common.authRequired;
            setTimeout(() => goto('/auth'), 2000);
            return;
        }

        try {
            await deleteLobby(deleteConfirmId, $authStore.user.id);
            deleteConfirmId = null;
            await fetchLobbies();
        } catch (e) {
            Sentry.captureException(e, {
                extra: {
                    errorMessage: resources.errors.common.deleteFailed
                }
            });
            console.error(e);
            error = resources.errors.common.deleteFailed;
        }
    }

    function confirmDelete(lobbyId: string) {
        deleteConfirmId = lobbyId;
    }

    function cancelDelete() {
        deleteConfirmId = null;
    }

    onMount(() => {
        fetchLobbies();
        // Set up polling for lobby updates
        pollInterval = setInterval(fetchLobbies, 5000);
    });

    onDestroy(() => {
        if (pollInterval) {
            clearInterval(pollInterval);
        }
    });

    // Watch for auth state changes
    $: if (!$authStore.loading) {
        fetchLobbies();
    }
</script>

<div class="w-screen h-screen bg-[#1a1a1a] text-white font-sans p-8 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-white/10 [&::-webkit-scrollbar-track]:rounded [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb:hover]:bg-white/30">
    <div class="max-w-4xl mx-auto">
        <h1 class="text-4xl font-bold mb-8">{resources.ui.lobby.title}</h1>

        <CreateLobbyForm 
            bind:newLobbyName
            onCreateLobby={createLobbyHandler}
        />

        <LobbyList 
            lobbies={$lobbies}
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