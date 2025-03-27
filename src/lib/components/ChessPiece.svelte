<script lang="ts">
	import { T } from "@threlte/core";
	import { interactivity } from "@threlte/extras";
	import { ChessPieceType, ChessColor } from "../types";

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
	scale={isUnderAttack ? [1.3, 1.3, 1.3] : isSelected ? [1.2, 1.2, 1.2] : [1, 1, 1]}
	onclick={onclickDelegate}
>
{#if type === "pawn"}
	<T.Mesh>
		<T.CylinderGeometry args={[0.2, 0.2, 1, 32]} />
		<T.MeshStandardMaterial 
			color={isUnderAttack ? "red" : isSelected ? "#FFD700" : hasPossibleMove ? "#ADD8E6" : color} 
		/>
	</T.Mesh>
{:else if type === "rook"}
	<T.Mesh>
		<T.BoxGeometry args={[0.5, 1, 0.5]} />
		<T.MeshStandardMaterial 
			color={isUnderAttack ? "red" : isSelected ? "#FFD700" : hasPossibleMove ? "#ADD8E6" : color} 
		/>
	</T.Mesh>
{:else if type === "knight"}
	<T.Mesh>
		<T.ConeGeometry args={[0.4, 1, 8]} />
		<T.MeshStandardMaterial 
			color={isUnderAttack ? "red" : isSelected ? "#FFD700" : hasPossibleMove ? "#ADD8E6" : color} 
		/>
	</T.Mesh>
{:else if type === "bishop"}
	<T.Mesh>
		<T.SphereGeometry args={[0.5, 32, 32]} />
		<T.MeshStandardMaterial 
			color={isUnderAttack ? "red" : isSelected ? "#FFD700" : hasPossibleMove ? "#ADD8E6" : color} 
		/>
	</T.Mesh>
{:else if type === "queen"}
	<T.Mesh>
		<T.CylinderGeometry args={[0.3, 0.5, 1.5, 32]} />
		<T.MeshStandardMaterial 
			color={isUnderAttack ? "red" : isSelected ? "#FFD700" : hasPossibleMove ? "#ADD8E6" : color} 
		/>
	</T.Mesh>
{:else if type === "king"}
	<T.Mesh>
		<T.CylinderGeometry args={[0.35, 0.55, 1.8, 32]} />
		<T.MeshStandardMaterial 
			color={isUnderAttack ? "red" : isSelected ? "#FFD700" : hasPossibleMove ? "#ADD8E6" : color} 
		/>
	</T.Mesh>
{/if}
</T.Group>