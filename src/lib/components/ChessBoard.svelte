<script lang="ts">
	import { T } from "@threlte/core";
	import { onMount } from "svelte";
	import type { ChessPiece } from "$lib/types/chess";
	import ChessPieceComponent from "./ChessPiece.svelte";
	import Tile from "./Tile.svelte";
	import { gameState } from "$lib/stores/gameStore";
	import { selectPiece, moveTo } from "$lib/scripts/chessHelpers";
	import { ChessColor } from "$lib/types/chess";
	import { lobbyId } from "$lib/stores/lobbyStore";
	import { playerName } from "$lib/stores/playerStore";

	let selectedPiece: ChessPiece | null = null;
	let validMoves: [number, number][] = [];
	let threatFields: [number, number][] = [];
	let tileSize: number = 1;
	let width: number = 8;
	let depth: number = 8;

	let pieces: ChessPiece[] = [];
	let activePlayer: ChessColor = ChessColor.White;
	let playerColor: ChessColor | null = null;
	let piecesWithMoves: Set<string> = new Set();

	// Convert chess notation to numeric coordinates
	function chessToNumeric(position: string): [number, number] {
		const [file, rank] = position.split('');
		const x = file.charCodeAt(0) - 'a'.charCodeAt(0);
		const y = 8 - parseInt(rank);
		return [x, y];
	}

	// Convert numeric coordinates to chess notation
	function numericToChess(x: number, y: number): string {
		const file = String.fromCharCode('a'.charCodeAt(0) + x);
		const rank = 8 - y;
		return `${file}${rank}`;
	}

	// Find a piece at a given position
	function getPieceAtPosition(x: number, y: number): ChessPiece | null {
		const position = numericToChess(x, y);
		return pieces.find(p => p.position === position) || null;
	}

	// Check if a piece has any valid moves
	function hasValidMoves(piece: ChessPiece): boolean {
		const { moves } = selectPiece(piece, activePlayer, pieces);
		return moves.length > 0;
	}

	// Update pieces with possible moves
	function updatePiecesWithMoves() {
		piecesWithMoves.clear();
		if (!playerColor || activePlayer !== playerColor) return;

		pieces.forEach(piece => {
			if (piece.color === playerColor && hasValidMoves(piece)) {
				piecesWithMoves.add(piece.position);
			}
		});
	}

	// Check if a tile has a piece with valid moves
	function hasPieceWithValidMove(x: number, y: number): boolean {
		const piece = getPieceAtPosition(x, y);
		return piece ? piecesWithMoves.has(piece.position) : false;
	}

	// Subscribe to game state
	gameState.subscribe((state) => {
		pieces = state.board;
		activePlayer = state.activePlayer;
		updatePiecesWithMoves();
	});

	// Get player's color from lobby
	async function getPlayerColor() {
		const currentLobbyId = $lobbyId;
		if (!currentLobbyId) return;

		try {
			const response = await fetch(`/api/lobbies/${currentLobbyId}`);
			if (!response.ok) return;

			const lobby = await response.json();
			playerColor = lobby.slots.slot1?.player === $playerName && lobby.slots.slot1?.color ? 
						 (lobby.slots.slot1.color === 'white' ? ChessColor.White : ChessColor.Black) :
						 lobby.slots.slot2?.player === $playerName && lobby.slots.slot2?.color ?
						 (lobby.slots.slot2.color === 'white' ? ChessColor.White : ChessColor.Black) :
						 null;
			
			// Update pieces with moves when we get the player's color
			updatePiecesWithMoves();
		} catch (error) {
			console.error("Failed to fetch player color:", error);
		}
	}

	// Select a piece
	function handleSelect(piece: ChessPiece) {
		// Only allow selecting pieces of the player's color
		if (!playerColor || piece.color !== playerColor) {
			return;
		}

		const { selected, moves } = selectPiece(piece, activePlayer, pieces);
		selectedPiece = selected;
		validMoves = moves;

		// Calculate threatened fields (opponent pieces that could be captured)
		threatFields = moves.filter(([x, y]) => {
			const targetPiece = pieces.find(
				(p) => p.position === numericToChess(x, y) && p.color !== piece.color
			);
			return !!targetPiece;
		});
	}

	// Move a piece
	async function handleMove(targetX: number, targetY: number) {
		if (!selectedPiece) return;

		try {
			const result = await moveTo(
				selectedPiece,
				targetX,
				targetY,
				pieces,
				gameState,
				activePlayer
			);

			// Reset selection after move
			selectedPiece = null;
			validMoves = [];
			threatFields = [];
		} catch (error) {
			console.error('Move failed:', error);
			// Reset selection on error
			selectedPiece = null;
			validMoves = [];
			threatFields = [];
		}
	}

	function handleTileClick(x: number, y: number, event: MouseEvent) {
		// If we have a selected piece, try to move to this position
		if (selectedPiece) {
			handleMove(x, y);
			return;
		}

		// Otherwise, try to select a piece at this position
		const piece = getPieceAtPosition(x, y);
		if (piece) {
			handleSelect(piece);
		}
	}

	// Get player's color when component mounts
	onMount(() => {
		getPlayerColor();
	});
</script>

<T.Group>
	{#each Array(width) as _, x}
		{#each Array(depth) as _, y}
			<Tile
				x={x}
				y={y}
				tileSize={tileSize}
				isValidMove={validMoves.some(([mx, my]) => mx === x && my === y)}
				isUnderAttackField={threatFields.some(([mx, my]) => mx === x && my === y)}
				hasPieceWithValidMove={hasPieceWithValidMove(x, y)}
				onTileClick={handleTileClick}
			/>
		{/each}
	{/each}

	{#each pieces as piece}
		{@const [x, y] = chessToNumeric(piece.position)}
		<ChessPieceComponent
			type={piece.type}
			color={piece.color}
			position={[
				x * tileSize - (width * tileSize) / 2 + tileSize / 2,
				0.5,
				y * tileSize - (depth * tileSize) / 2 + tileSize / 2
			]}
			isSelected={selectedPiece?.position === piece.position}
			onclickDelegate={() => handleSelect(piece)}
		/>
	{/each}
</T.Group>
