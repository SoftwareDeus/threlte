<script lang="ts">
	import { T } from "@threlte/core";
	import { gameState } from "$lib/stores/gameStore";
	import ChessPieceComponent from "./ChessPiece.svelte";

	export let color: 'white' | 'black';
	let platformWidth = 8;
	let platformDepth = 2;
	let platformHeight = 0.1;

	$: capturedPieces = $gameState.capturedPieces[color];

	$: platformX = 0;
	$: platformY = 0.05;
	$: platformZ = color === 'white' ? -6 : 6;

	function handlePieceClick() {
		return;
	}
</script>

<T.Group position={[platformX, platformY, platformZ]}>
	<T.Mesh>
		<T.BoxGeometry args={[platformWidth, platformHeight, platformDepth]} />
		<T.MeshStandardMaterial color="#4a4a4a" />
	</T.Mesh>

	{#each capturedPieces as piece, i}
		<ChessPieceComponent
			type={piece.type}
			color={piece.color}
			position={[
				(i - (capturedPieces.length - 1) / 2) * 1.2,
				0.1,
				0
			]}
			onclickDelegate={handlePieceClick}
		/>
	{/each}
</T.Group> 