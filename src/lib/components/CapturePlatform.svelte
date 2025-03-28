<script lang="ts">
	import { T } from "@threlte/core";
	import { gameState } from "$lib/stores/gameStore";
	import ChessPieceComponent from "./ChessPiece.svelte";
	import { resources } from "$lib/resources";
	import { ChessColor } from "$lib/types/chess";

	export let color: ChessColor;

	$: capturedPieces = $gameState.capturedPieces[color === ChessColor.White ? 'white' : 'black'];

	$: platformX = 0;
	$: platformY = 0.05;
	$: platformZ = color === ChessColor.White ? resources.config.capturePlatform.whiteZ : resources.config.capturePlatform.blackZ;

	function handlePieceClick() {
		return;
	}
</script>

<T.Group position={[platformX, platformY, platformZ]}>
	<T.Mesh>
		<T.BoxGeometry args={[
			resources.config.capturePlatform.width,
			resources.config.capturePlatform.height,
			resources.config.capturePlatform.depth
		]} />
		<T.MeshStandardMaterial color="#4a4a4a" />
	</T.Mesh>

	{#each capturedPieces as piece, i}
		<ChessPieceComponent
			type={piece.type}
			color={piece.color}
			position={[
				(i - (capturedPieces.length - 1) / 2) * resources.config.capturePlatform.pieceSpacing,
				resources.config.capturePlatform.pieceHeight,
				0
			]}
			onclickDelegate={handlePieceClick}
		/>
	{/each}
</T.Group> 