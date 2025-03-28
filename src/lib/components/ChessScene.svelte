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
	import { makeMove } from '$lib/services/gameService';

	export let lobbyId: string | null = null;

	interactivity();

	async function sendMoveToServer(move: any) {
		if (!lobbyId) return;

		try {
			const updatedState = await makeMove(lobbyId, $playerName, move);
			
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
	<CapturePlatform color={ChessColor.Black} />
	<CapturePlatform color={ChessColor.White} />
</T.Scene>
  