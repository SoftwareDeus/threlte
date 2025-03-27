<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { Canvas } from '@threlte/core';
	import ChessScene from '$lib/components/ChessScene.svelte';
	import ChessHUD from '$lib/components/ChessHUD.svelte';
	import { playerName } from '$lib/stores/playerStore';
	import { gameState } from '$lib/stores/gameStore';
	import { initialState } from '$lib/stores/gameStore';
	import { lobbyId } from '$lib/stores/lobbyStore';

	let error: string | null = null;
	let pollInterval: number;

	async function fetchGameState() {
		if (!$lobbyId) return;

		try {
			const response = await fetch(`/api/game/${$lobbyId}`);
			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to fetch game state');
			}
			const serverState = await response.json();
			gameState.set(serverState);
		} catch (e) {
			console.error('Failed to fetch game state:', e);
			error = e instanceof Error ? e.message : 'Failed to fetch game state';
		}
	}

	onMount(async () => {
		if (!$playerName) {
			error = 'Please enter your name in the main menu';
			setTimeout(() => goto('/'), 2000);
			return;
		}

		if (!$lobbyId) {
			error = 'No lobby selected';
			setTimeout(() => goto('/lobby'), 2000);
			return;
		}

		// Initial fetch
		await fetchGameState();

		// Set up polling every second
		pollInterval = setInterval(fetchGameState, 1000);
	});

	onDestroy(() => {
		if (pollInterval) {
			clearInterval(pollInterval);
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
				×
			</button>
		</div>
	{/if}
</div> 