<script lang="ts">
	import { T } from "@threlte/core";
	import { interactivity } from "@threlte/extras";
	import { resources } from "$lib/resources";

	export let x: number; // Spaltenindex
	export let y: number; // Reihenindex
	export let tileSize: number; // Größe der Kachel
	export let isValidMove: boolean = false; // Gültige Zielposition?
	export let isUnderAttackField: boolean = false; // Neues Feld unter Angriff
	export let hasPieceWithValidMove: boolean = false;
	export let onTileClick: (x: number, y: number, event: MouseEvent) => void;
	const _ = T; //eslint-disable-line
	interactivity();
</script>

<T.Mesh
	onclick={(event: MouseEvent) => onTileClick(x, y, event)}
	position={[
		x * tileSize - (8 * tileSize) / 2 + tileSize / 2,
		0,
		y * tileSize - (8 * tileSize) / 2 + tileSize / 2,
	]}
	rotation={[-Math.PI / 2, 0, 0]}
	receiveShadow
>
	<T.PlaneGeometry args={[tileSize, tileSize]} />
	<T.MeshStandardMaterial
		color={
			isValidMove ? resources.colors.board.validMove : 
			isUnderAttackField ? resources.colors.board.underAttack : 
			hasPieceWithValidMove ? resources.colors.board.possibleMove :
			(x + y) % 2 === 0 ? resources.colors.board.white : resources.colors.board.black
		}
	/>
</T.Mesh>