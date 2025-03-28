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
    import { getGameState, endGame } from '$lib/services/gameService';

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
        try {
            const currentLobbyId = $lobbyId;
            if (!currentLobbyId) {
                throw new Error(resources.errors.common.genericError);
            }

            const state = await getGameState(currentLobbyId);
            gameState.set(state);

            if (state.gameOver) {
                await handleGameOver();
            }
        } catch (e) {
            Sentry.captureException(e, {
                extra: {
                    errorMessage: resources.errors.common.fetchFailed
                }
            });
            console.error('Error fetching game state:', e);
            error = resources.errors.common.fetchFailed;
        }
    }

    async function handleGameOver() {
        const currentLobbyId = $lobbyId;
        if (!currentLobbyId) return;

        try {
            await endGame(currentLobbyId, $playerName, winner || '');
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
                        errorMessage: resources.errors.common.genericError
                    }
                });
                error = resources.errors.common.genericError;
                redirectTimeout = setTimeout(() => goto('/lobby'), 2000);
                return;
            }

            await fetchGameState();
            pollInterval = setInterval(fetchGameState, 1000);
        } catch (error) {
            Sentry.captureException(error, {
                extra: {
                    errorMessage: resources.errors.common.fetchFailed
                }
            });
            console.error('Error in onMount:', error);
            error = resources.errors.common.fetchFailed;
        }
    });

    onDestroy(() => {
        if (redirectTimeout) clearTimeout(redirectTimeout);
        if (pollInterval) clearInterval(pollInterval);
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
                on:click={() => error = ''}
                class="text-white hover:text-white/80"
            >
                {resources.errors.common.closeButton}
            </button>
        </div>
    {/if}
</div> 