<script lang="ts">
	import { T } from "@threlte/core";
	import { interactivity } from "@threlte/extras";
	import { ChessPieceType, ChessColor } from "$lib/types/chess";
	import { resources } from "$lib/resources";

	export let isUnderAttack: boolean = false;
	export let type: ChessPieceType = ChessPieceType.Pawn;
	export let position: [number, number, number] = [0, 0, 0];
	export let color: ChessColor = ChessColor.White;
	export let onclickDelegate: (event: MouseEvent) => void;
	export let isSelected: boolean = false;
	export let hasPossibleMove: boolean = false;
	const _ = T; //eslint-disable-line
	interactivity();
</script>

<T.Group
	position={position}
	scale={isUnderAttack ? 
		[resources.config.board.pieceScale.underAttack, resources.config.board.pieceScale.underAttack, resources.config.board.pieceScale.underAttack] : 
		isSelected ? 
		[resources.config.board.pieceScale.selected, resources.config.board.pieceScale.selected, resources.config.board.pieceScale.selected] : 
		[resources.config.board.pieceScale.normal, resources.config.board.pieceScale.normal, resources.config.board.pieceScale.normal]}
	onclick={onclickDelegate}
>
{#if type === "pawn"}
	<T.Mesh>
		<T.CylinderGeometry args={[
			resources.config.pieces.pawn.radius,
			resources.config.pieces.pawn.radius,
			resources.config.pieces.pawn.height,
			resources.config.pieces.pawn.segments
		]} />
		<T.MeshStandardMaterial 
			color={isUnderAttack ? resources.config.colors.pieces.underAttack : isSelected ? resources.config.colors.pieces.selected : hasPossibleMove ? resources.config.colors.pieces.possibleMove : color} 
		/>
	</T.Mesh>
{:else if type === "rook"}
	<T.Mesh>
		<T.BoxGeometry args={[
			resources.config.pieces.rook.width,
			resources.config.pieces.rook.height,
			resources.config.pieces.rook.depth
		]} />
		<T.MeshStandardMaterial 
			color={isUnderAttack ? resources.config.colors.pieces.underAttack : isSelected ? resources.config.colors.pieces.selected : hasPossibleMove ? resources.config.colors.pieces.possibleMove : color} 
		/>
	</T.Mesh>
{:else if type === "knight"}
	<T.Mesh>
		<T.ConeGeometry args={[
			resources.config.pieces.knight.radius,
			resources.config.pieces.knight.height,
			resources.config.pieces.knight.segments
		]} />
		<T.MeshStandardMaterial 
			color={isUnderAttack ? resources.config.colors.pieces.underAttack : isSelected ? resources.config.colors.pieces.selected : hasPossibleMove ? resources.config.colors.pieces.possibleMove : color} 
		/>
	</T.Mesh>
{:else if type === "bishop"}
	<T.Mesh>
		<T.SphereGeometry args={[
			resources.config.pieces.bishop.radius,
			resources.config.pieces.bishop.segments,
			resources.config.pieces.bishop.segments
		]} />
		<T.MeshStandardMaterial 
			color={isUnderAttack ? resources.config.colors.pieces.underAttack : isSelected ? resources.config.colors.pieces.selected : hasPossibleMove ? resources.config.colors.pieces.possibleMove : color} 
		/>
	</T.Mesh>
{:else if type === "queen"}
	<T.Mesh>
		<T.CylinderGeometry args={[
			resources.config.pieces.queen.topRadius,
			resources.config.pieces.queen.bottomRadius,
			resources.config.pieces.queen.height,
			resources.config.pieces.queen.segments
		]} />
		<T.MeshStandardMaterial 
			color={isUnderAttack ? resources.config.colors.pieces.underAttack : isSelected ? resources.config.colors.pieces.selected : hasPossibleMove ? resources.config.colors.pieces.possibleMove : color} 
		/>
	</T.Mesh>
{:else if type === "king"}
	<T.Mesh>
		<T.CylinderGeometry args={[
			resources.config.pieces.king.topRadius,
			resources.config.pieces.king.bottomRadius,
			resources.config.pieces.king.height,
			resources.config.pieces.king.segments
		]} />
		<T.MeshStandardMaterial 
			color={isUnderAttack ? resources.config.colors.pieces.underAttack : isSelected ? resources.config.colors.pieces.selected : hasPossibleMove ? resources.config.colors.pieces.possibleMove : color} 
		/>
	</T.Mesh>
{/if}
</T.Group>