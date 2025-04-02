<script lang="ts">
	import { onMount } from 'svelte';
	import * as lobbyService from '$lib/services/lobbyService';
	import * as gameService from '$lib/services/gameService';
	import type { Lobby, GameState, Move, ChessPiece } from '$lib/types/chess';
	import { ChessColor } from '$lib/types/chess';
	import { v4 as uuidv4 } from 'uuid';

	interface DebugResults {
		[key: string]: Lobby | Lobby[] | GameState | string | null;
	}

	interface DebugErrors {
		[key: string]: unknown;
	}

	let results: DebugResults = {};
	let errors: DebugErrors = {};
	let loading = true;
	let activeLobbyId: string | null = null;

	// --- PASTE ACTUAL USER ID HERE ---
	const testUserId1 = '680e96e3-af76-4414-b1da-dd6c70f3863b'; // Replace with a real UID from Supabase Auth Users
	// --- ------------------------- ---

	// Keep generating a UUID for the second user for now
	const testUserId2 = '2d97929e-d366-4d07-983a-3ecf88fe0b8e';
	const testLobbyName = 'Debug Lobby Test';

	// Add detailed logging for debugging the lobby operations
	async function testOperation(name: string, operation: () => Promise<any>) {
		console.log(`[DEBUG] Starting ${name} operation...`);
		try {
			const result = await operation();
			console.log(`[DEBUG] ${name} succeeded:`, result);
			results[name] = result;
			return result;
		} catch (e) {
			console.error(`[DEBUG] ${name} failed:`, e);
			
			// Enhanced error details for debugging
			let errorDetails;
			if (e instanceof Error) { 
				errorDetails = { 
					message: e.message, 
					stack: e.stack, 
					name: e.name,
					// Additional details that may be available through custom properties
					cause: e.cause,
					// Include the string representation of the error
					toString: e.toString()
				};
			} else if (typeof e === 'object' && e !== null) {
				// For non-Error objects, capture all properties
				errorDetails = { ...e, stringified: JSON.stringify(e) };
			} else {
				errorDetails = e;
			}
			
			// Log to console in a formatted way
			console.group(`[DEBUG] Detailed error for ${name}:`);
			console.error('Error details:', errorDetails);
			console.groupEnd();
			
			errors[name] = errorDetails;
			return null;
		}
	}

	onMount(async () => {
		// Ensure testUserId1 is not the placeholder
		loading = true;
		results = {};
		errors = {};

		// Clear any stale in-memory data
		try {
			await fetch('/api/debug/clear-memory', { method: 'POST' });
			console.log('[DEBUG] Cleared in-memory data');
		} catch (error) {
			console.warn('[DEBUG] Failed to clear in-memory data:', error);
		}

		let createdLobby: Lobby | null = null;
		// Flag to track if we should run game tests
		let runGameTests = true;

		// 1. Test createLobby
		createdLobby = await testOperation('createLobby', () => 
			lobbyService.createLobby(testUserId1, testLobbyName)
		);

		// --- Tests requiring a created lobby ID ---
		if (createdLobby) {
			const lobbyId = createdLobby.id;
			activeLobbyId = lobbyId;

			// 2. Test getLobby
			await testOperation('getLobby', () => 
				lobbyService.getLobby(lobbyId)
			);

			// 3. Test joinLobby
			await testOperation('joinLobby', () => 
				lobbyService.joinLobby(lobbyId, testUserId2)
			);

			// 4. Test setPlayerColor (Host sets color for player 2)
			await testOperation('setPlayerColor', () => 
				lobbyService.setPlayerColor(
					lobbyId,
					testUserId1,
					testUserId2,
					ChessColor.White
				)
			);

			// 5. Test randomizeLobby (Host randomizes)
			await testOperation('randomizeLobby', () => 
				lobbyService.randomizeLobby(lobbyId, testUserId1)
			);

			// 6. Test updateTimeSettings (Host updates)
			const timeControl = { minutes: 10, increment: 5 };
			await testOperation('updateTimeSettings', () => 
				lobbyService.updateTimeSettings(
					lobbyId,
					testUserId1,
					timeControl
				)
			);

			// Check in-memory lobbies
			await testOperation('checkMemoryLobbies', async () => {
				const response = await fetch(`/api/debug/memory-lobbies`);
				if (!response.ok) {
					throw new Error(`Failed to get memory lobbies: ${response.statusText}`);
				}
				return response.json();
			});

			// 7. Test startGame (Host starts)
			const gameTimeControl = { minutes: 5, increment: 3 }; // Use different time for start
			const startedLobby = await testOperation('startGame', () => 
				lobbyService.startGame(lobbyId, testUserId1, gameTimeControl)
			);

			// After starting the game, make sure in-memory stores are updated
			if (startedLobby) {
				// Check the in-memory state to ensure it's properly initialized
				const verifyResult = await testOperation('verifyGameState', async () => {
					// This ensures the memory stores are properly synced
					const response = await fetch(`/api/debug/memory-lobbies`);
					if (!response.ok) {
						throw new Error(`Failed to get memory lobbies: ${response.statusText}`);
					}
					
					// Small delay to ensure everything is initialized
					await new Promise(resolve => setTimeout(resolve, 500));
					
					// Make a direct call to get the game state to force initialization
					const gameStateResponse = await fetch(`/api/game/${lobbyId}`);
					if (!gameStateResponse.ok) {
						throw new Error(`Failed to initialize game state: ${gameStateResponse.statusText}`);
					}
					
					const gameState = await gameStateResponse.json();
					
					// Validate that the game state is properly initialized
					if (!gameState.pieces || gameState.pieces.length === 0) {
						throw new Error(`Game state has no pieces. State initialization failed.`);
					}
					
					console.log(`[DEBUG] Verified game state with ${gameState.pieces.length} pieces`);
					
					return { 
						memoryState: await response.json(),
						gameState: gameState
					};
				});
				
				// Flag to track if we should run game tests
				runGameTests = !!(verifyResult && verifyResult.gameState && verifyResult.gameState.pieces);
				
				if (!runGameTests) {
					console.error('[DEBUG] Game state verification failed - skipping game tests');
					errors.gameStateVerification = new Error('Game state verification failed');
				}
			}

			// ---- GAME SERVICE TESTS BEGIN HERE ----
			if (startedLobby.status === 'playing' && runGameTests) {
				// 7.1 Test getGameState
				const gameState = await testOperation('getGameState', () => 
					gameService.getGameState(lobbyId)
				);

				if (gameState) {
					// Determine which color the test user is playing as
					let userColor = ChessColor.White; // Default
					if (startedLobby.slots?.slot1?.player === testUserId1) {
						userColor = startedLobby.slots.slot1.color;
						console.log(`[DEBUG] User ${testUserId1} is playing as ${userColor}`);
					} else if (startedLobby.slots?.slot2?.player === testUserId1) {
						userColor = startedLobby.slots.slot2.color;
						console.log(`[DEBUG] User ${testUserId1} is playing as ${userColor}`);
					} else {
						console.error(`[DEBUG] Could not determine user color, defaulting to White`);
					}
					
					// 7.2 Test makeMove - only attempt if it's the player's turn
					if (gameState.activePlayer === userColor) {
						if (gameState.pieces.length > 0) {
							// Get a pawn of the user's color for the first move
							const pawnToMove = gameState.pieces.find(
								(p: ChessPiece) => p.color === userColor && p.position.includes(userColor === ChessColor.White ? '2' : '7')
							);

							if (pawnToMove) {
								// Log the piece to help with debugging
								console.log('[DEBUG] Found pawn to move:', pawnToMove);
								
								// Create the move with the correct piece ID and target position
								const move: Move = {
									pieceId: pawnToMove.id, // This is the piece ID
									targetPosition: pawnToMove.position.replace(
										userColor === ChessColor.White ? '2' : '7', 
										userColor === ChessColor.White ? '4' : '5'
									) // Move pawn forward 2 squares
								};
								
								console.log('[DEBUG] Making move:', move);
								
								// Add a small delay before making the move to ensure state is ready
								await new Promise(resolve => setTimeout(resolve, 500));
								
								try {
									// First try directly calling the API to avoid client/server mismatch
									const response = await fetch(`/api/game/${lobbyId}`, {
										method: 'POST',
										headers: {
											'Content-Type': 'application/json'
										},
										body: JSON.stringify({ 
											playerName: testUserId1, 
											move: move
										})
									});
									
									if (!response.ok) {
										const errorData = await response.json();
										console.error('[DEBUG] Direct API call failed:', errorData);
										throw new Error(`API call failed: ${errorData.error || response.statusText}`);
									}
									
									results.makeMove = await response.json();
									console.log('[DEBUG] Direct makeMove succeeded:', results.makeMove);
								} catch (directError) {
									console.error('[DEBUG] Direct API call error:', directError);
									// Fall back to using the service
									await testOperation('makeMove', () => 
										gameService.makeMove(lobbyId, testUserId1, move)
									);
								}
							} else {
								console.error('[DEBUG] No suitable pawn found for move testing');
								errors.makeMove = new Error('No suitable pawn found for move testing');
							}
						}
					} else {
						console.warn(`[DEBUG] Skipping makeMove test - not user's turn. Active player: ${gameState.activePlayer}, User color: ${userColor}`);
						results.makeMove = "Skipped - not player's turn";
					}

					// 7.3 Test updateTime - use direct API call with the correct color
					try {
						// Add a small delay to ensure state is ready
						await new Promise(resolve => setTimeout(resolve, 500));
						
						console.log(`[DEBUG] Updating time for player: ${testUserId1} with color ${userColor}`);
						const timeResponse = await fetch(`/api/game/${lobbyId}/time`, {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json' 
							},
							body: JSON.stringify({
								playerName: testUserId1,
								color: userColor // Use the determined user color
							})
						});
						
						if (!timeResponse.ok) {
							const errorData = await timeResponse.json();
							console.error('[DEBUG] Direct updateTime API call failed:', errorData);
							throw new Error(`API call failed: ${errorData.error || timeResponse.statusText}`);
						}
						
						results.updateTime = await timeResponse.json();
						console.log('[DEBUG] Direct updateTime succeeded:', results.updateTime);
					} catch (directTimeError) {
						console.error('[DEBUG] Direct updateTime API call error:', directTimeError);
						// Fall back to using the service
						await testOperation('updateTime', () => 
							gameService.updateTime(
								lobbyId,
								testUserId1,
								userColor // Use the determined user color
							)
						);
					}

					// 7.4 Test endGame
					try {
						// Add a small delay to ensure state is ready
						await new Promise(resolve => setTimeout(resolve, 500));
						
						console.log(`[DEBUG] Ending game for lobby ${lobbyId} with player ${testUserId1} declaring ${userColor} as winner`);
						const endGameResponse = await fetch(`/api/lobbies/${lobbyId}/end`, {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json'
							},
							body: JSON.stringify({
								playerName: testUserId1,
								winner: userColor // Use the determined user color as winner
							})
						});
						
						if (!endGameResponse.ok) {
							const errorData = await endGameResponse.json();
							console.error('[DEBUG] Direct endGame API call failed:', errorData);
							throw new Error(`API call failed: ${errorData.error || endGameResponse.statusText}`);
						}
						
						results.endGame = await endGameResponse.json();
						console.log('[DEBUG] Direct endGame succeeded:', results.endGame);
					} catch (directEndGameError) {
						console.error('[DEBUG] Direct endGame API call error:', directEndGameError);
						// Fall back to using the service
						await testOperation('endGame', () => 
							gameService.endGame(lobbyId, testUserId1, userColor)
						);
					}
				}
			}
			// ---- GAME SERVICE TESTS END HERE ----

			// 8. Test leaveLobby (Player 2 leaves)
			await testOperation('leaveLobby', () => 
				lobbyService.leaveLobby(lobbyId, testUserId2)
			);

			// 9. Test deleteLobby (Host deletes)
			await testOperation('deleteLobby', () => 
				lobbyService.deleteLobby(lobbyId, testUserId1)
			);
		}

		// 10. Test getLobbies (after potential deletion)
		await testOperation('getLobbies', () => 
			lobbyService.getLobbies()
		);

		loading = false;
	});

	function formatOutput(data: unknown): string {
		if (data instanceof Error) {
			return `Error: ${data.message}\nStack: ${data.stack || 'No stack trace available'}`;
		}
		
		try {
			if (typeof data === 'object' && data !== null) {
				// For objects, return a pretty-printed JSON with extra information
				return JSON.stringify(data, (key, value) => {
					// Handle special cases like undefined
					if (value === undefined) return '(undefined)';
					if (value === null) return '(null)';
					return value;
				}, 2);
			}
			return String(data);
		} catch (err) {
			return `Error formatting output: ${String(err)}\nOriginal value: ${String(data)}`;
		}
	}
</script>

<div class="debug-container">
	<h1>Service Debug Page</h1>

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
</div>

<style>
	.debug-container {
		height: 100vh;
		overflow-y: auto;
		padding: 20px;
		box-sizing: border-box;
	}
	
	pre {
		background-color: #f4f4f4;
		border: 1px solid #ddd;
		padding: 10px;
		border-radius: 4px;
		white-space: pre-wrap; /* Handle wrapping */
		word-wrap: break-word; /* Handle long words */
		max-height: 400px;
		overflow-y: auto;
		scrollbar-width: thin;
	}
	
	div {
		margin-bottom: 15px;
	}
	
	/* Custom scrollbar styles */
	.debug-container::-webkit-scrollbar,
	pre::-webkit-scrollbar {
		width: 8px;
		height: 8px;
	}
	
	.debug-container::-webkit-scrollbar-track,
	pre::-webkit-scrollbar-track {
		background: rgba(0, 0, 0, 0.1);
		border-radius: 4px;
	}
	
	.debug-container::-webkit-scrollbar-thumb,
	pre::-webkit-scrollbar-thumb {
		background: rgba(0, 0, 0, 0.3);
		border-radius: 4px;
	}
	
	.debug-container::-webkit-scrollbar-thumb:hover,
	pre::-webkit-scrollbar-thumb:hover {
		background: rgba(0, 0, 0, 0.5);
	}
</style>
