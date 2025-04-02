<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/authStore';
	import { lobbyId, lobbies } from '$lib/stores/lobbyStore';
	import { resources } from '$lib/resources';
	import * as Sentry from '@sentry/sveltekit';
	import LobbyList from '$lib/components/lobby/LobbyList.svelte';
	import CreateLobbyForm from '$lib/components/lobby/CreateLobbyForm.svelte';
	import {
		getLobbies,
		createLobby,
		joinLobby,
		startGame,
		deleteLobby
	} from '$lib/services/lobbyService';

	let newLobbyName = '';
	let error: string | null = null;
	let deleteConfirmId: string | null = null;
	let pollInterval: NodeJS.Timeout | undefined = undefined;
	let isLoading = true;
	let initialAuthCheckDone = false;

	async function fetchLobbies(force = false) {
		if ($authStore.loading) {
			console.log('Auth loading, delaying fetch...');
			return;
		}
		if (!$authStore.user && !force) {
			console.log('User not logged in, skipping fetch.');
			lobbies.set([]);
			isLoading = false;
			return;
		}

		try {
			const fetchedLobbies = await getLobbies();
			lobbies.set(fetchedLobbies);
			if (error === resources.errors.common.fetchFailed) {
				error = null;
			}
		} catch (e: unknown) {
			const newError = e instanceof Error ? e.message : resources.errors.common.fetchFailed;
			if (error !== newError) {
				Sentry.captureException(e, {
					extra: {
						errorMessage: resources.errors.common.fetchFailed,
						context: 'fetchLobbies in /lobby page'
					}
				});
				console.error('Fetch Lobbies Error:', e);
				error = newError;
			}
		} finally {
			if (!initialAuthCheckDone) {
				isLoading = false;
				initialAuthCheckDone = true;
			}
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

		isLoading = true;
		error = null;
		try {
			console.log('Creating lobby with user:', $authStore.user.id);
			const newLobby = await createLobby($authStore.user.id, newLobbyName);
			console.log('Created lobby:', newLobby);
			lobbyId.set(newLobby.id);
			await goto(`/lobby/${newLobby.id}`);
		} catch (e: unknown) {
			console.error('Error creating lobby:', e);
			Sentry.captureException(e, {
				extra: {
					errorMessage: resources.errors.common.createFailed,
					userId: $authStore.user.id,
					lobbyName: newLobbyName
				}
			});
			error = e instanceof Error ? e.message : resources.errors.common.createFailed;
		} finally {
			isLoading = false;
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

		isLoading = true;
		error = null;
		try {
			await joinLobby(id, $authStore.user.id);
			lobbyId.set(id);
			await goto(`/lobby/${id}`);
		} catch (e: unknown) {
			Sentry.captureException(e, {
				extra: {
					errorMessage: resources.errors.common.joinFailed
				}
			});
			console.error(e);
			error = e instanceof Error ? e.message : resources.errors.common.joinFailed;
		} finally {
			isLoading = false;
		}
	}

	async function startGameHandler(id: string) {
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

		isLoading = true;
		error = null;
		try {
			await startGame(id, $authStore.user.id, { minutes: 10, increment: 0 });
			lobbyId.set(id);
			await goto(`/game/${id}`);
		} catch (e: unknown) {
			Sentry.captureException(e, {
				extra: {
					errorMessage: resources.errors.common.startFailed
				}
			});
			console.error(e);
			error = e instanceof Error ? e.message : resources.errors.common.startFailed;
		} finally {
			isLoading = false;
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

		isLoading = true;
		error = null;
		const idToDelete = deleteConfirmId;
		deleteConfirmId = null;

		try {
			await deleteLobby(idToDelete, $authStore.user.id);
			await fetchLobbies();
		} catch (e: unknown) {
			Sentry.captureException(e, {
				extra: {
					errorMessage: resources.errors.common.deleteFailed
				}
			});
			console.error(e);
			error = e instanceof Error ? e.message : resources.errors.common.deleteFailed;
		} finally {
			isLoading = false;
		}
	}

	function confirmDelete(lobbyId: string) {
		deleteConfirmId = lobbyId;
	}

	function cancelDelete() {
		deleteConfirmId = null;
	}

	onMount(() => {
		console.log('Lobby page mounted');
		if (pollInterval) clearInterval(pollInterval);
		console.log('Setting up poll interval');
		pollInterval = setInterval(() => fetchLobbies(), 5000);
	});

	onDestroy(() => {
		console.log('Clearing poll interval');
		if (pollInterval) {
			clearInterval(pollInterval);
			pollInterval = undefined;
		}
	});

	$: {
		if (!$authStore.loading) {
			console.log('Auth state change detected. User:', $authStore.user?.id);
			fetchLobbies(true);
		} else {
			console.log('Auth state loading...');
		}
	}
</script>

<div
	class="h-screen w-screen bg-[#1a1a1a] p-8 font-sans text-white [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb:hover]:bg-white/30 [&::-webkit-scrollbar-track]:rounded [&::-webkit-scrollbar-track]:bg-white/10"
>
	<div class="mx-auto max-w-4xl">
		<h1 class="mb-8 text-4xl font-bold">{resources.ui.lobby.title}</h1>

		{#if $authStore.user}
			<CreateLobbyForm bind:newLobbyName onCreateLobby={createLobbyHandler} disabled={isLoading} />
		{:else if !$authStore.loading}
			<p class="mb-6 text-center text-gray-400">Please log in to create or join lobbies.</p>
		{/if}

		{#if isLoading && $lobbies.length === 0}
			<p class="text-center text-gray-400">Loading lobbies...</p>
		{:else if !$authStore.user && !$authStore.loading}
			<p class="text-center text-gray-400">Log in to see available lobbies.</p>
		{:else if $lobbies.length === 0 && !isLoading}
			<p class="text-center text-gray-400">No lobbies available. Create one!</p>
		{:else}
			<LobbyList
				lobbies={$lobbies}
				{deleteConfirmId}
				onDeleteConfirm={confirmDelete}
				onDeleteCancel={cancelDelete}
				onDelete={deleteLobbyHandler}
				onJoin={joinLobbyHandler}
				onStart={startGameHandler}
			/>
		{/if}
	</div>

	<!-- Error Message -->
	{#if error}
		<div
			class="fixed right-4 bottom-4 flex items-center gap-4 rounded-lg bg-red-500/90 px-6 py-3 text-white shadow-lg"
		>
			<span>{error}</span>
			<button on:click={() => (error = null)} class="text-white hover:text-white/80">
				{resources.errors.common.closeButton}
			</button>
		</div>
	{/if}
</div>

<style>
	/* Add scrollbar styles if needed */
	div.overflow-y-auto::-webkit-scrollbar {
		width: 8px;
	}
	div.overflow-y-auto::-webkit-scrollbar-track {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 4px;
	}
	div.overflow-y-auto::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.2);
		border-radius: 4px;
	}
	div.overflow-y-auto::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.3);
	}
</style>
