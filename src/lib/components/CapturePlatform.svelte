<script lang="ts">
	import { T } from "@threlte/core";
	import { gameState } from "$lib/stores/gameStore";
	import ChessPieceComponent from "./ChessPiece.svelte";
	import { resources } from "$lib/resources";
	import { ChessColor } from "$lib/types/chess";

	export let color: ChessColor;

	$: capturedPieces = $gameState.capturedPieces[color];

	$: platformX = 0;
	$: platformY = 0.05;
	$: platformZ = color === ChessColor.White ? resources.constants.capturePlatform.whiteZ : resources.constants.capturePlatform.blackZ;

	function handlePieceClick() {
		return;
	}
</script>

<T.Group position={[platformX, platformY, platformZ]}>
	<T.Mesh>
		<T.BoxGeometry args={[
			resources.constants.capturePlatform.width,
			resources.constants.capturePlatform.height,
			resources.constants.capturePlatform.depth
		]} />
		<T.MeshStandardMaterial color="#4a4a4a" />
	</T.Mesh>

	{#each capturedPieces as piece, i}
		<ChessPieceComponent
			type={piece.type}
			color={piece.color}
			position={[
				(i - (capturedPieces.length - 1) / 2) * resources.constants.capturePlatform.pieceSpacing,
				resources.constants.capturePlatform.pieceHeight,
				0
			]}
			onclickDelegate={handlePieceClick}
		/>
	{/each}
</T.Group> 