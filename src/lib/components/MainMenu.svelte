<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/authStore';
	import { resources } from '$lib/resources';
	import PlayerProfile from './PlayerProfile.svelte';
	import { supabase } from '$lib/services/supabase';

	let showProfile = false;
	let error: string | null = null;
	let connectionStatus = 'Connecting...';
	let testStatus = '';

	$: isAuthenticated = !!$authStore.user;
	$: isLoading = $authStore.loading;

	onMount(async () => {
		// Wait for initial auth check to complete
		if (isLoading) {
			return;
		}

		// Only redirect if we're not already on the auth page
		if (!isAuthenticated && window.location.pathname !== '/auth') {
			await goto('/auth');
			return;
		}

		// Check Supabase connection
		try {
			const { error: supabaseError } = await supabase
				.from('player_profiles')
				.select('count')
				.limit(1);
			if (supabaseError) throw supabaseError;
			connectionStatus = 'Connected';
		} catch {
			connectionStatus = 'Connection Error';
			error = 'Failed to connect to server';
		}
	});

	async function handleStartGame() {
		if (!$authStore.user) {
			error = 'Please log in to start a game';
			return;
		}
		await goto('/game');
	}

	async function handleGoToLobby() {
		if (!$authStore.user) {
			error = 'Please log in to join the lobby';
			return;
		}
		await goto('/lobby');
	}

	function toggleProfile() {
		showProfile = !showProfile;
	}

	async function handleSignOut() {
		const result = await authStore.signOut();
		if (result.error) {
			error = result.error;
		} else {
			await goto('/auth');
		}
	}
</script>

<div class="flex min-h-screen flex-col bg-[#1a1a1a]">
	{#if isLoading}
		<div class="flex flex-1 items-center justify-center">
			<div class="h-12 w-12 animate-spin rounded-full border-b-2 border-white"></div>
		</div>
	{:else if !isAuthenticated}
		<div class="flex flex-1 items-center justify-center">
			<div class="text-white">Redirecting to login...</div>
		</div>
	{:else}
		<div
			class="flex h-screen w-screen flex-col items-center justify-center bg-[#1a1a1a] font-sans text-white"
		>
			<h1 class="mb-8 text-5xl text-white">{resources.ui.mainMenu.title}</h1>

			<div class="flex flex-col gap-4">
				<button
					on:click={handleStartGame}
					class="min-w-[200px] cursor-pointer rounded bg-[#4CAF50] px-8 py-4 text-xl text-white transition-all hover:bg-[#45a049]"
				>
					{resources.ui.buttons.localGame}
				</button>
				<button
					on:click={handleGoToLobby}
					class="min-w-[200px] cursor-pointer rounded bg-[#4CAF50] px-8 py-4 text-xl text-white transition-all hover:bg-[#45a049]"
				>
					{resources.ui.buttons.multiplayer}
				</button>
				<button
					on:click={toggleProfile}
					class="min-w-[200px] cursor-pointer rounded bg-[#2196F3] px-8 py-4 text-xl text-white transition-all hover:bg-[#1976D2]"
				>
					{showProfile ? 'Hide Profile' : 'Show Profile'}
				</button>
				<button
					on:click={handleSignOut}
					class="min-w-[200px] cursor-pointer rounded bg-[#f44336] px-8 py-4 text-xl text-white transition-all hover:bg-[#d32f2f]"
				>
					Sign Out
				</button>
			</div>

			{#if error}
				<div class="mt-4 rounded bg-[#ff4444]/10 px-4 py-2 text-[#ff4444]">
					{error}
				</div>
			{/if}

			{#if connectionStatus}
				<div
					class="mt-4 px-4 py-2 {connectionStatus.includes('Connected')
						? 'bg-[#4CAF50]/10 text-[#4CAF50]'
						: 'bg-[#ff4444]/10 text-[#ff4444]'} rounded"
				>
					{connectionStatus}
				</div>
			{/if}

			{#if testStatus}
				<div
					class="mt-4 px-4 py-2 {testStatus.includes('successfully')
						? 'bg-[#4CAF50]/10 text-[#4CAF50]'
						: 'bg-[#ff4444]/10 text-[#ff4444]'} rounded"
				>
					{testStatus}
				</div>
			{/if}

			{#if showProfile}
				<div class="mt-8 w-full max-w-md">
					<PlayerProfile />
				</div>
			{/if}
		</div>
	{/if}
</div>
