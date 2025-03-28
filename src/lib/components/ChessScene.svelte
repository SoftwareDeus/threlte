<script lang="ts">
	import { T } from '@threlte/core' 
	import { Color } from 'three'
	import { interactivity } from '@threlte/extras'
	import SceneCamera from './SceneCamera.svelte'
	import ChessBoard from '$lib/components/ChessBoard.svelte';
	import CapturePlatform from './CapturePlatform.svelte';
	import { gameState } from '$lib/stores/gameStore';
	import { playerName } from '$lib/stores/playerStore';
	import type { GameState } from '$lib/types/chess';
	import { ChessColor } from '$lib/types/chess';
	import { resources } from '$lib/resources';
	import * as Sentry from '@sentry/sveltekit';

	export let lobbyId: string | null = null;

	interactivity();

	// Function to send move to server
	async function sendMoveToServer(move: any) {
		if (!lobbyId) return;

		try {
			const response = await fetch(`/api/game/${lobbyId}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					playerName: $playerName,
					move
				})
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || resources.errors.common.updateFailed);
			}

			// Get the updated game state from the server
			const updatedState = await response.json();
			
			// Only update if the move was successful
			if (updatedState.lastMove?.pieceId === move.pieceId) {
				gameState.set(updatedState);
			}
		} catch (e) {
			Sentry.captureException(e, {
				extra: {
					errorMessage: resources.errors.common.updateFailed
				}
			});
			console.error('Error sending move to server:', e);
		}
	}

	// Subscribe to game state changes and send moves to server
	gameState.subscribe((state: GameState & { lastMove?: any }) => {
		if (lobbyId && state.lastMove) {
			sendMoveToServer(state.lastMove);
		}
	});
</script>

<T.Scene>
	<SceneCamera />
	<T.AmbientLight intensity={0.5} />
	<T.DirectionalLight position={[10, 10, 5]} intensity={1} />
	<ChessBoard />
	<CapturePlatform side="left" color={ChessColor.Black} />
	<CapturePlatform side="right" color={ChessColor.White} />
</T.Scene>
  