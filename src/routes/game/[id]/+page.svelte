<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import GameContainer from '$lib/components/game/GameContainer.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/authStore';
	import * as Sentry from '@sentry/sveltekit';
	import { resources } from '$lib/resources';

	export let data;
	const gameId = $page.params.id;
	let error = '';

	onMount(async () => {
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

		// Additional game initialization can be added here
	});
</script>

<div class="h-screen w-screen bg-[#1a1a1a] p-0 font-sans text-white">
	<GameContainer {gameId} />

	{#if error}
		<div
			class="fixed right-4 bottom-4 flex items-center gap-4 rounded-lg bg-red-500/90 px-6 py-3 text-white shadow-lg"
		>
			<span>{error}</span>
			<button on:click={() => (error = '')} class="text-white hover:text-white/80">
				{resources.errors.common.closeButton}
			</button>
		</div>
	{/if}
</div> 