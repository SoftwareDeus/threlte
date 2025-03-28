<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { goto } from '$app/navigation';
    import { Canvas } from '@threlte/core';
    import ChessScene from '$lib/components/ChessScene.svelte';
    import ChessHUD from '$lib/components/ChessHUD.svelte';
    import { playerName } from '$lib/stores/playerStore';
    import { gameState } from '$lib/stores/gameStore';
    import { lobbyId } from '$lib/stores/lobbyStore';
    import { resources } from '$lib/resources';
    import * as Sentry from '@sentry/sveltekit';
    import { ChessColor } from '$lib/types/chess';

    let error: string | null = null;
    let redirectTimeout: ReturnType<typeof setTimeout>;
    let pollInterval: ReturnType<typeof setInterval>;
    let isGameOver = false;
    let winner: ChessColor | undefined;

    gameState.subscribe((state) => {
        isGameOver = state.gameOver ?? false;
        winner = state.winner;
    });

    async function fetchGameState() {
        if (!$lobbyId) return;

        try {
            const response = await fetch(`/api/game/${$lobbyId}`);
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || resources.errors.common.fetchFailed);
            }
            const data = await response.json();
            gameState.set(data);
        } catch (e) {
            Sentry.captureException(e, {
                extra: {
                    errorMessage: resources.errors.common.fetchFailed
                }
            });
            console.error(resources.errors.common.fetchFailed, e);
            error = resources.errors.common.fetchFailed;
        }
    }

    async function handleGameOver() {
        const currentLobbyId = $lobbyId;
        if (!currentLobbyId) return;

        try {
            const response = await fetch(`/api/lobbies/${currentLobbyId}/end`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    winner: winner,
                    playerName: $playerName
                })
            });

            if (!response.ok) {
                throw new Error(resources.errors.common.updateFailed);
            }
        } catch (error) {
            Sentry.captureException(error, {
                extra: {
                    errorMessage: resources.errors.common.updateFailed
                }
            });
            console.error('Failed to end game:', error);
        }
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
                redirectTimeout = setTimeout(() => goto('/'), 2000);
                return;
            }

            if (!$lobbyId) {
                Sentry.captureMessage('Missing lobby ID', {
                    level: 'error',
                    extra: {
                        errorMessage: resources.errors.common.fetchFailed
                    }
                });
                error = resources.errors.common.fetchFailed;
                redirectTimeout = setTimeout(() => goto('/lobby'), 2000);
                return;
            }

            // Initial fetch
            await fetchGameState();

            // Set up polling every second
            pollInterval = setInterval(fetchGameState, 1000);

            if (isGameOver) {
                await handleGameOver();
            }
        } catch (error) {
            Sentry.captureException(error, {
                extra: {
                    errorMessage: resources.errors.common.fetchFailed
                }
            });
            error = resources.errors.common.fetchFailed;
        }
    });

    onDestroy(() => {
        if (pollInterval) {
            clearInterval(pollInterval);
        }
        if (redirectTimeout) {
            clearTimeout(redirectTimeout);
        }
    });
</script>

<div class="w-screen h-screen bg-[#1a1a1a] text-white font-sans">
    <Canvas>
        <ChessScene />
    </Canvas>
    <ChessHUD />

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