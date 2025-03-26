<script lang="ts">
  import { T } from "@threlte/core";
	export let x: number; // Spaltenindex
	export let y: number; // Reihenindex
	export let tileSize: number; // Größe der Kachel
	export let isValidMove: boolean = false; // Gültige Zielposition?

	export let onTileClick: (x: number, y: number, event: MouseEvent) => void;

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
			isValidMove
				? "#00ff00" // Grün für gültige Züge
				: (x + y) % 2 === 0
				? "#ffffff" // Weiß
				: "#000000" // Schwarz
		}
	/>
</T.Mesh>