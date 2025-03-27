<script lang="ts">
	import { T } from "@threlte/core";
	import { interactivity } from "@threlte/extras";
	import { ChessPieceType, ChessColor } from "../types";
	import { resources } from "$lib/resources";

	export let isUnderAttack: boolean = false; // Neuer Zustand für Angriffe
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
		[resources.constants.board.pieceScale.underAttack, resources.constants.board.pieceScale.underAttack, resources.constants.board.pieceScale.underAttack] : 
		isSelected ? 
		[resources.constants.board.pieceScale.selected, resources.constants.board.pieceScale.selected, resources.constants.board.pieceScale.selected] : 
		[resources.constants.board.pieceScale.normal, resources.constants.board.pieceScale.normal, resources.constants.board.pieceScale.normal]}
	onclick={onclickDelegate}
>
{#if type === "pawn"}
	<T.Mesh>
		<T.CylinderGeometry args={[
			resources.constants.pieces.pawn.radius,
			resources.constants.pieces.pawn.radius,
			resources.constants.pieces.pawn.height,
			resources.constants.pieces.pawn.segments
		]} />
		<T.MeshStandardMaterial 
			color={isUnderAttack ? resources.colors.pieces.underAttack : isSelected ? resources.colors.pieces.selected : hasPossibleMove ? resources.colors.pieces.possibleMove : color} 
		/>
	</T.Mesh>
{:else if type === "rook"}
	<T.Mesh>
		<T.BoxGeometry args={[
			resources.constants.pieces.rook.width,
			resources.constants.pieces.rook.height,
			resources.constants.pieces.rook.depth
		]} />
		<T.MeshStandardMaterial 
			color={isUnderAttack ? resources.colors.pieces.underAttack : isSelected ? resources.colors.pieces.selected : hasPossibleMove ? resources.colors.pieces.possibleMove : color} 
		/>
	</T.Mesh>
{:else if type === "knight"}
	<T.Mesh>
		<T.ConeGeometry args={[
			resources.constants.pieces.knight.radius,
			resources.constants.pieces.knight.height,
			resources.constants.pieces.knight.segments
		]} />
		<T.MeshStandardMaterial 
			color={isUnderAttack ? resources.colors.pieces.underAttack : isSelected ? resources.colors.pieces.selected : hasPossibleMove ? resources.colors.pieces.possibleMove : color} 
		/>
	</T.Mesh>
{:else if type === "bishop"}
	<T.Mesh>
		<T.SphereGeometry args={[
			resources.constants.pieces.bishop.radius,
			resources.constants.pieces.bishop.segments,
			resources.constants.pieces.bishop.segments
		]} />
		<T.MeshStandardMaterial 
			color={isUnderAttack ? resources.colors.pieces.underAttack : isSelected ? resources.colors.pieces.selected : hasPossibleMove ? resources.colors.pieces.possibleMove : color} 
		/>
	</T.Mesh>
{:else if type === "queen"}
	<T.Mesh>
		<T.CylinderGeometry args={[
			resources.constants.pieces.queen.topRadius,
			resources.constants.pieces.queen.bottomRadius,
			resources.constants.pieces.queen.height,
			resources.constants.pieces.queen.segments
		]} />
		<T.MeshStandardMaterial 
			color={isUnderAttack ? resources.colors.pieces.underAttack : isSelected ? resources.colors.pieces.selected : hasPossibleMove ? resources.colors.pieces.possibleMove : color} 
		/>
	</T.Mesh>
{:else if type === "king"}
	<T.Mesh>
		<T.CylinderGeometry args={[
			resources.constants.pieces.king.topRadius,
			resources.constants.pieces.king.bottomRadius,
			resources.constants.pieces.king.height,
			resources.constants.pieces.king.segments
		]} />
		<T.MeshStandardMaterial 
			color={isUnderAttack ? resources.colors.pieces.underAttack : isSelected ? resources.colors.pieces.selected : hasPossibleMove ? resources.colors.pieces.possibleMove : color} 
		/>
	</T.Mesh>
{/if}
</T.Group>