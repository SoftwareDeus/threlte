<script lang="ts">
	import { T } from "@threlte/core";
	import type { ChessPieceData } from "../types";
	import ChessPiece from "../components/ChessPiece.svelte";
	import Tile from "../components/Tile.svelte";
	import { gameState } from "../scripts/gameState";
	import { selectPiece, moveTo } from "../scripts/chessHelpers";
	import { ChessColor } from "../types";

	let selectedPiece: ChessPieceData | null = null;
	let validMoves: [number, number][] = [];
	let threatFields: [number, number][] = []; // Neues Array zur Verfolgung bedrohter Felder
	let tileSize: number = 1; // Größe jedes Feldes
	let width: number = 8; // Brettbreite
	let depth: number = 8; // Bretttiefe

	let pieces: ChessPieceData[] = []; // Aktive Schachfiguren
	let activePlayer: ChessColor = ChessColor.White; // Aktiver Spieler

	// Spielstatus abonnieren
	gameState.subscribe((state) => {
		pieces = state.pieces;
		activePlayer = state.activePlayer;
	});

	// Spielfigur auswählen
	function handleSelect(piece: ChessPieceData) {
		const { selected, moves } = selectPiece(piece, activePlayer, pieces);
		selectedPiece = selected;
		validMoves = moves;

		// Berechnung der bedrohten Felder (gegnerische Figuren, auf die gezogen werden könnte):
		threatFields = moves.filter(([x, y]) => {
			const targetPiece = pieces.find(
				(p) => p.position[0] === x && p.position[1] === y && p.color !== piece.color
			);
			return !!targetPiece; // Nur Gegnerfiguren
		});
	}
  const _ = T; //eslint-disable-line
	// Spielfigur bewegen
	function handleMove(targetX: number, targetY: number) {
		const { resetSelection } = moveTo(
			selectedPiece,
			targetX,
			targetY,
			pieces,
			gameState,
			activePlayer
		);

		// Auswahl zurücksetzen, wenn der Zug abgeschlossen ist
		if (resetSelection) {
			selectedPiece = null;
			validMoves = [];
			threatFields = []; // Zurücksetzen der bedrohten Felder
		}
	}
</script>

<T.Group>
	<!-- Brett-Rendering -->
	{#each Array(width).keys() as row}
		{#each Array(depth).keys() as col}
			<Tile
				x={col}
				y={row}
				tileSize={tileSize}
				isValidMove={validMoves.some(([x, y]) => x === col && y === row)}
				isUnderAttackField={threatFields.some(([x, y]) => x === col && y === row)}
			onTileClick={(x, y) => handleMove(x, y)}
			/>
		{/each}
	{/each}

	<!-- Figuren-Rendering -->
	{#each pieces as piece (piece.id)}
		<ChessPiece
			onclickDelegate={(event: MouseEvent) => {
				event.stopPropagation();
				handleSelect(piece);
			}}
			type={piece.type}
			position={[
				piece.position[0] * tileSize - (width * tileSize) / 2 + tileSize / 2,
				piece.position[2] + 0.5,
				piece.position[1] * tileSize - (depth * tileSize) / 2 + tileSize / 2,
			]}
			color={piece.color}
			isSelected={selectedPiece?.id === piece.id}
			isUnderAttack={threatFields.some(([x, y]) => {
				return x === piece.position[0] && y === piece.position[1];
			})}
		/>
	{/each}
</T.Group>
