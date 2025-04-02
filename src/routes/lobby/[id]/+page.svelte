<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/authStore';
	import { lobbyId } from '$lib/stores/lobbyStore';
	import { resources } from '$lib/resources';
	import { ChessColor } from '$lib/types/chess';
	import type { Lobby } from '$lib/types/chess';
	import * as Sentry from '@sentry/sveltekit';
	import LobbyDetail from '$lib/components/lobby/LobbyDetail.svelte';
	import {
		getLobby,
		updateTimeSettings as updateLobbyTimeSettings,
		startGame,
		randomizeLobby,
		setPlayerColor as setLobbyPlayerColor,
		deleteLobby as deleteLobbyService
	} from '$lib/services/lobbyService';

	let lobby: Lobby | null = null;
	let error = '';
	let minutes = 10;
	let increment = 0;
	let updateTimeout: ReturnType<typeof setTimeout> | null = null;
	let isHostValue = false;
	let pollingInterval: ReturnType<typeof setInterval> | null = null;

	$: isHostValue = lobby?.host_id === $authStore.user?.id;

	function isHost(): boolean {
		return isHostValue;
	}

	function isValidTimeControl() {
		const mins = Number(minutes);
		const inc = Number(increment);
		return !isNaN(mins) && !isNaN(inc) && mins >= 1 && mins <= 60 && inc >= 0 && inc <= 60;
	}

	function handleTimeControlUpdate() {
		if (isHost() && lobby && isValidTimeControl() && lobby.status === 'waiting') {
			if (updateTimeout) clearTimeout(updateTimeout);
			updateTimeout = setTimeout(updateTimeSettings, 500);
		}
	}

	$: if (typeof window !== 'undefined') {
		void (minutes && increment);
		handleTimeControlUpdate();
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
				error = resources.errors.common.authRequired;
				setTimeout(() => goto('/auth'), 2000);
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
				setTimeout(() => goto('/lobby'), 2000);
				return;
			}

			await fetchLobby();
			
			// Set up polling for lobby updates every 3 seconds
			pollingInterval = setInterval(fetchLobby, 3000);
		} catch (e: unknown) {
			Sentry.captureException(e, {
				extra: {
					errorMessage: resources.errors.common.fetchFailed
				}
			});
			error = resources.errors.common.fetchFailed;
		}
	});
	
	onDestroy(() => {
		// Clean up polling interval when component is destroyed
		if (pollingInterval) {
			clearInterval(pollingInterval);
		}
		
		if (updateTimeout) {
			clearTimeout(updateTimeout);
		}
	});

	async function updateTimeSettings() {
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

		if (!$lobbyId) {
			Sentry.captureMessage('Missing lobby ID', {
				level: 'error',
				extra: {
					errorMessage: resources.errors.common.genericError
				}
			});
			error = resources.errors.common.genericError;
			setTimeout(() => goto('/lobby'), 2000);
			return;
		}

		if (!isValidTimeControl()) {
			Sentry.captureMessage('Invalid time control settings', {
				level: 'error',
				extra: {
					errorMessage: resources.errors.common.genericError
				}
			});
			error = resources.errors.common.genericError;
			return;
		}

		try {
			await updateLobbyTimeSettings($lobbyId, $authStore.user.id, { minutes, increment });
			lobby = await fetchLobby();
			error = '';
		} catch (e: unknown) {
			const errorMessage = e instanceof Error ? e.message : 'Failed to update time settings';
			error = errorMessage;
			console.error('Failed to update time settings:', e);
			Sentry.captureException(e);
		} finally {
			updateTimeout = null;
		}
	}

	async function fetchLobby(): Promise<Lobby> {
		if (!$lobbyId) {
			throw new Error('No lobby ID provided');
		}

		try {
			const fetchedLobby = await getLobby($lobbyId);
			lobby = fetchedLobby;
			error = '';
			
			// Automatically redirect to game if lobby status has changed to 'playing'
			if (fetchedLobby.status === 'playing') {
				console.log('Lobby status is playing, redirecting to game');
				await goto(`/game/${fetchedLobby.id}`);
			}
			
			return fetchedLobby;
		} catch (e: unknown) {
			if (e instanceof Error && e.message === resources.errors.server.validation.lobbyNotFound) {
				error = resources.errors.server.validation.lobbyNotFound;
				setTimeout(() => goto('/lobby'), 2000);
			} else {
				const errorMessage = e instanceof Error ? e.message : 'Failed to fetch lobby';
				error = errorMessage;
				console.error('Failed to fetch lobby:', e);
				Sentry.captureException(e);
			}
			throw e;
		}
	}

	async function startGameHandler() {
		if (!$authStore.user?.id || !lobby) return;

		if (!isValidTimeControl()) {
			error = resources.errors.server.validation.invalidTimeControl;
			return;
		}

		try {
			const updatedLobby = await startGame(lobby.id, $authStore.user.id, { minutes, increment });
			lobby = updatedLobby;
			await goto(`/game/${lobby.id}`);
		} catch (e: unknown) {
			Sentry.captureException(e, {
				extra: {
					errorMessage: resources.errors.common.startFailed,
					lobbyId: lobby.id
				}
			});
			console.error('Start Game Error:', e);
			error = e instanceof Error ? e.message : resources.errors.common.startFailed;
		}
	}

	async function randomizePlayers() {
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

		if (!$lobbyId) {
			Sentry.captureMessage('Missing lobby ID', {
				level: 'error',
				extra: {
					errorMessage: resources.errors.common.genericError
				}
			});
			error = resources.errors.common.genericError;
			setTimeout(() => goto('/lobby'), 2000);
			return;
		}

		if (!lobby) {
			Sentry.captureMessage('Lobby not found', {
				level: 'error',
				extra: {
					errorMessage: resources.errors.common.genericError
				}
			});
			error = resources.errors.common.genericError;
			return;
		}

		try {
			lobby = await randomizeLobby(lobby.id, $authStore.user.id);
		} catch (e) {
			Sentry.captureException(e, {
				extra: {
					errorMessage: resources.errors.common.updateFailed
				}
			});
			console.error(e);
			error = resources.errors.common.updateFailed;
		}
	}

	async function setPlayerColor(targetPlayer: string, color: ChessColor) {
		if (!$authStore.user?.id || !lobby) return;

		try {
			await setLobbyPlayerColor(lobby.id, $authStore.user.id, targetPlayer, color);
			lobby = await fetchLobby();
		} catch (e) {
			Sentry.captureException(e, {
				extra: {
					errorMessage: resources.errors.common.updateFailed
				}
			});
			console.error(e);
			error = resources.errors.common.updateFailed;
		}
	}

	async function deleteLobby() {
		if (!$authStore.user?.id || !lobby) return;

		try {
			await deleteLobbyService(lobby.id, $authStore.user.id);
			goto('/lobby');
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

	function handleColorChange(slot: 1 | 2, color: ChessColor) {
		if (!lobby) return;
		const targetPlayer = slot === 1 ? lobby.host_id : lobby.player2_id;
		if (targetPlayer) {
			setPlayerColor(targetPlayer, color);
		}
	}
</script>

<div class="h-screen w-screen bg-[#1a1a1a] p-8 font-sans text-white">
	{#if lobby}
		<LobbyDetail
			{lobby}
			isHost={isHostValue}
			{minutes}
			{increment}
			onMinutesChange={(value) => (minutes = value)}
			onIncrementChange={(value) => (increment = value)}
			onColorChange={handleColorChange}
			onStartGame={startGameHandler}
			onDelete={deleteLobby}
			onRandomize={randomizePlayers}
		/>
	{:else}
		<div class="flex h-full items-center justify-center">
			<div class="text-xl">Loading...</div>
		</div>
	{/if}

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
