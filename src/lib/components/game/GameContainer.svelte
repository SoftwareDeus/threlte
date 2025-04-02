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
	import { authStore } from '$lib/stores/authStore';

	export let gameId: string | undefined = undefined;
	
	let errorMessage = '';
	let redirectTimeout: ReturnType<typeof setTimeout>;
	let pollInterval: ReturnType<typeof setInterval>;
	let winner: ChessColor | undefined;
	let isLoading = true;
	let retryCount = 0;
	const MAX_RETRY_COUNT = 5;

	gameState.subscribe((state) => {
		winner = state.winner;
	});

	async function fetchGameState() {
		try {
			// Use provided gameId if available, otherwise use from store
			const currentGameId = gameId || $lobbyId;
			if (!currentGameId) {
				throw new Error(resources.errors.common.genericError);
			}

			console.log(`Fetching game state for ${currentGameId}`);
			const state = await getGameState(currentGameId);
			console.log(`Received game state with ${state.pieces?.length || 0} pieces`);
			
			// Only update state if we received a valid game state with pieces
			if (state && state.pieces && state.pieces.length > 0) {
				gameState.set(state);
				isLoading = false;
				retryCount = 0; // Reset retry count after successful fetch
				
				if (state.gameOver) {
					await handleGameOver();
				}
			} else {
				// If we got an empty state, increment retry counter
				retryCount++;
				console.warn(`Received empty game state, retry ${retryCount}/${MAX_RETRY_COUNT}`);
				
				if (retryCount >= MAX_RETRY_COUNT) {
					// After max retries, go back to lobby
					errorMessage = resources.errors.common.fetchFailed;
					setTimeout(() => goto('/lobby'), 2000);
				}
			}
		} catch (e) {
			console.error('Error fetching game state:', e);
			retryCount++;
			
			if (retryCount >= MAX_RETRY_COUNT) {
				Sentry.captureException(e, {
					extra: {
						errorMessage: resources.errors.common.fetchFailed
					}
				});
				errorMessage = resources.errors.common.fetchFailed;
			}
		}
	}

	async function handleGameOver() {
		// Use provided gameId if available, otherwise use from store
		const currentGameId = gameId || $lobbyId;
		if (!currentGameId) return;

		try {
			await endGame(currentGameId, $authStore.user?.id || '', winner || '');
		} catch (error) {
			Sentry.captureException(error, {
				extra: {
					errorMessage: resources.errors.common.updateFailed
				}
			});
			console.error('Failed to end game:', error);
			errorMessage = resources.errors.common.updateFailed;
		}
	}

	onMount(async () => {
		try {
			if (!$authStore.user?.id) {
				Sentry.captureMessage('User not authenticated', {
					level: 'error',
					extra: {
						errorMessage: resources.errors.common.authRequired
					}
				});
				errorMessage = resources.errors.common.authRequired;
				redirectTimeout = setTimeout(() => goto('/auth'), 2000);
				return;
			}

			// Set lobbyId from passed gameId if available
			if (gameId) {
				lobbyId.set(gameId);
				console.log(`Set lobbyId to ${gameId} from prop`);
			}
			
			if (!gameId && !$lobbyId) {
				Sentry.captureMessage('Missing game ID', {
					level: 'error',
					extra: {
						errorMessage: resources.errors.common.genericError
					}
				});
				errorMessage = resources.errors.common.genericError;
				redirectTimeout = setTimeout(() => goto('/lobby'), 2000);
				return;
			}

			await fetchGameState();
			// Set up polling with exponential backoff on failure
			pollInterval = setInterval(fetchGameState, 1000);
		} catch (error) {
			Sentry.captureException(error, {
				extra: {
					errorMessage: resources.errors.common.fetchFailed
				}
			});
			console.error('Error in onMount:', error);
			errorMessage = resources.errors.common.fetchFailed;
		}
	});

	onDestroy(() => {
		if (redirectTimeout) clearTimeout(redirectTimeout);
		if (pollInterval) clearInterval(pollInterval);
	});
</script>

<div class="h-screen w-screen bg-[#1a1a1a] font-sans text-white">
	{#if isLoading}
		<div class="flex h-full items-center justify-center">
			<div class="text-xl">Loading chess game...</div>
		</div>
	{:else}
		<Canvas>
			<ChessScene />
		</Canvas>
		<ChessHUD />
	{/if}

	<!-- Error Message -->
	{#if errorMessage}
		<div
			class="fixed right-4 bottom-4 flex items-center gap-4 rounded-lg bg-red-500/90 px-6 py-3 text-white shadow-lg"
		>
			<span>{errorMessage}</span>
			<button on:click={() => (errorMessage = '')} class="text-white hover:text-white/80">
				{resources.errors.common.closeButton}
			</button>
		</div>
	{/if}
</div>
