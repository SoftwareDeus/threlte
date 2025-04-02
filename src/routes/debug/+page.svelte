<script lang="ts">
	import { onMount } from 'svelte';
	import * as lobbyService from '$lib/services/lobbyService';
	import type { Lobby } from '$lib/types/chess';
	import { ChessColor } from '$lib/types/chess';
	import { v4 as uuidv4 } from 'uuid';

	interface DebugResults {
		[key: string]: Lobby | Lobby[] | string | null;
	}

	interface DebugErrors {
		[key: string]: unknown;
	}

	let results: DebugResults = {};
	let errors: DebugErrors = {};
	let loading = true;

	// --- PASTE ACTUAL USER ID HERE ---
	const testUserId1 = '680e96e3-af76-4414-b1da-dd6c70f3863b'; // Replace with a real UID from Supabase Auth Users
	// --- ------------------------- ---

	// Keep generating a UUID for the second user for now
	const testUserId2 = uuidv4();
	const testLobbyName = 'Debug Lobby Test';

	onMount(async () => {
		// Ensure testUserId1 is not the placeholder
		loading = true;
		results = {};
		errors = {};
		let createdLobby: Lobby | null = null;

		try {
			// 1. Test createLobby
			try {
				console.log('Testing createLobby...');
				createdLobby = await lobbyService.createLobby(testUserId1, testLobbyName);
				results.createLobby = createdLobby;
				console.log('createLobby Success:', createdLobby);
			} catch (e) {
				console.error('createLobby Error:', e);
				errors.createLobby = e;
			}

			// --- Tests requiring a created lobby ID ---
			if (createdLobby) {
				const lobbyId = createdLobby.id;

				// 2. Test getLobby
				try {
					console.log(`Testing getLobby (${lobbyId})...`);
					const lobby = await lobbyService.getLobby(lobbyId);
					results.getLobby = lobby;
					console.log('getLobby Success:', lobby);
				} catch (e) {
					console.error('getLobby Error:', e);
					errors.getLobby = e;
				}

				// 3. Test joinLobby
				try {
					console.log(`Testing joinLobby (${lobbyId}, ${testUserId2})...`);
					const joinedLobby = await lobbyService.joinLobby(lobbyId, testUserId2);
					results.joinLobby = joinedLobby;
					console.log('joinLobby Success:', joinedLobby);
				} catch (e) {
					console.error('joinLobby Error:', e);
					errors.joinLobby = e;
				}

				// 4. Test setPlayerColor (Host sets color for player 2)
				try {
					console.log(
						`Testing setPlayerColor (${lobbyId}, Host: ${testUserId1}, Target: ${testUserId2}, Color: White)...`
					);
					const colorLobby = await lobbyService.setPlayerColor(
						lobbyId,
						testUserId1,
						testUserId2,
						ChessColor.White
					);
					results.setPlayerColor = colorLobby;
					console.log('setPlayerColor Success:', colorLobby);
				} catch (e) {
					console.error('setPlayerColor Error:', e);
					errors.setPlayerColor = e;
				}

				// 5. Test randomizeLobby (Host randomizes)
				try {
					console.log(`Testing randomizeLobby (${lobbyId}, Host: ${testUserId1})...`);
					const randomLobby = await lobbyService.randomizeLobby(lobbyId, testUserId1);
					results.randomizeLobby = randomLobby;
					console.log('randomizeLobby Success:', randomLobby);
				} catch (e) {
					console.error('randomizeLobby Error:', e);
					errors.randomizeLobby = e;
				}

				// 6. Test updateTimeSettings (Host updates)
				try {
					const timeControl = { minutes: 10, increment: 5 };
					console.log(
						`Testing updateTimeSettings (${lobbyId}, Host: ${testUserId1}, Time: ${JSON.stringify(timeControl)})...`
					);
					const timeLobby = await lobbyService.updateTimeSettings(
						lobbyId,
						testUserId1,
						timeControl
					);
					results.updateTimeSettings = timeLobby;
					console.log('updateTimeSettings Success:', timeLobby);
				} catch (e) {
					console.error('updateTimeSettings Error:', e);
					errors.updateTimeSettings = e;
				}

				// 7. Test startGame (Host starts)
				try {
					const timeControl = { minutes: 5, increment: 3 }; // Use different time for start
					console.log(
						`Testing startGame (${lobbyId}, Host: ${testUserId1}, Time: ${JSON.stringify(timeControl)})...`
					);
					const startedLobby = await lobbyService.startGame(lobbyId, testUserId1, timeControl);
					results.startGame = startedLobby;
					console.log('startGame Success:', startedLobby);
				} catch (e) {
					console.error('startGame Error:', e);
					errors.startGame = e;
				}

				// 8. Test leaveLobby (Player 2 leaves)
				try {
					console.log(`Testing leaveLobby (${lobbyId}, Player: ${testUserId2})...`);
					const leftLobby = await lobbyService.leaveLobby(lobbyId, testUserId2);
					results.leaveLobby = leftLobby;
					console.log('leaveLobby Success:', leftLobby);
				} catch (e) {
					console.error('leaveLobby Error:', e);
					errors.leaveLobby = e;
				}

				// 9. Test deleteLobby (Host deletes)
				try {
					console.log(`Testing deleteLobby (${lobbyId}, Host: ${testUserId1})...`);
					await lobbyService.deleteLobby(lobbyId, testUserId1);
					results.deleteLobby = 'Success';
					console.log('deleteLobby Success');
				} catch (e) {
					console.error('deleteLobby Error:', e);
					errors.deleteLobby = e;
				}
			}

			// 10. Test getLobbies (after potential deletion)
			try {
				console.log('Testing getLobbies...');
				const lobbies = await lobbyService.getLobbies();
				results.getLobbies = lobbies;
				console.log('getLobbies Success:', lobbies);
			} catch (e) {
				console.error('getLobbies Error:', e);
				errors.getLobbies = e;
			}
		} finally {
			loading = false;
		}
	});

	function formatOutput(data: unknown): string {
		if (data instanceof Error) {
			return data.message;
		}
		try {
			return JSON.stringify(data, null, 2);
		} catch {
			return String(data);
		}
	}
</script>

<h1>Lobby Service Debug Page</h1>

{#if loading}
	<p>Running tests...</p>
{:else}
	<h2>Test Results:</h2>
	{#each Object.entries(results) as [key, value]}
		<div>
			<h3>{key}</h3>
			<pre>{formatOutput(value)}</pre>
		</div>
	{/each}

	{#if Object.keys(errors).length > 0}
		<h2>Errors:</h2>
		{#each Object.entries(errors) as [key, value]}
			<div>
				<h3>{key}</h3>
				<pre style="color: red;">{formatOutput(value)}</pre>
			</div>
		{/each}
	{/if}
{/if}

<style>
	pre {
		background-color: #f4f4f4;
		border: 1px solid #ddd;
		padding: 10px;
		border-radius: 4px;
		white-space: pre-wrap; /* Handle wrapping */
		word-wrap: break-word; /* Handle long words */
	}
	div {
		margin-bottom: 15px;
	}
</style>
