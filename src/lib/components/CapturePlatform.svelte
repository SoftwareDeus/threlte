<script lang="ts">
	import { T } from '@threlte/core';
	import { interactivity } from '@threlte/extras';
	import { ChessColor } from '$lib/types/chess';
	import type { ChessPiece } from '$lib/types/chess';

	export let color: 'white' | 'black';
	export let capturedPieces: ChessPiece[] = [];

	// Define constants for positions
	const whitePlatformPosition: [number, number, number] = [-5, 0, 0];
	const blackPlatformPosition: [number, number, number] = [5, 0, 0];

	// Reactive statement for the position based on the color prop
	$: platformPosition = color === 'white' ? whitePlatformPosition : blackPlatformPosition;

	interactivity();
</script>

<T.Group position={platformPosition}>
	<T.Mesh position={[0, -0.1, 0]}>
		<T.BoxGeometry args={[2, 0.2, 4]} />
		<T.MeshStandardMaterial color={color === 'white' ? '#f0f0f0' : '#333333'} />
	</T.Mesh>

	{#each capturedPieces as piece, i}
		<T.Group position={[0, 0.2 + i * 0.5, 0]}>
			<T.Mesh>
				<T.SphereGeometry args={[0.2]} />
				<T.MeshStandardMaterial color={piece.color === ChessColor.White ? '#ffffff' : '#000000'} />
			</T.Mesh>
		</T.Group>
	{/each}
</T.Group>
