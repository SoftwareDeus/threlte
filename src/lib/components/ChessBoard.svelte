﻿<script lang="ts">
	import { T } from '@threlte/core';
	import { onMount } from 'svelte';
	import type { ChessPiece } from '$lib/types/chess';
	import ChessPieceComponent from './ChessPiece.svelte';
	import Tile from './Tile.svelte';
	import { gameState } from '$lib/stores/gameStore';
	import { selectPiece, moveTo } from '$lib/scripts/chessHelpers';
	import { ChessColor } from '$lib/types/chess';
	import { lobbyId } from '$lib/stores/lobbyStore';
	import { playerName } from '$lib/stores/playerStore';
	import { resources } from '$lib/resources';
	import * as Sentry from '@sentry/sveltekit';
	import { getLobby } from '$lib/services/lobbyService';

	let selectedPiece: ChessPiece | null = null;
	let validMoves: [number, number][] = [];
	let threatFields: [number, number][] = [];
	let tileSize: number = resources.config.board.tileSize;
	let width: number = resources.config.board.width;
	let depth: number = resources.config.board.depth;

	let pieces: ChessPiece[] = [];
	let activePlayer: ChessColor = ChessColor.White;
	let playerColor: ChessColor | null = null;
	let piecesWithMoves: Set<string> = new Set();

	// Convert chess notation to numeric coordinates
	function chessToNumeric(position: string): [number, number] {
		const [file, rank] = position.split('');
		const x = file.charCodeAt(0) - 'a'.charCodeAt(0);
		const y = resources.config.board.width - parseInt(rank);
		return [x, y];
	}

	// Convert numeric coordinates to chess notation
	function numericToChess(x: number, y: number): string {
		const file = String.fromCharCode('a'.charCodeAt(0) + x);
		const rank = resources.config.board.width - y;
		return `${file}${rank}`;
	}

	// Find a piece at a given position
	function getPieceAtPosition(x: number, y: number): ChessPiece | null {
		const position = numericToChess(x, y);
		return pieces.find((p) => p.position === position) || null;
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

		pieces.forEach((piece) => {
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
		pieces = state.pieces;
		activePlayer = state.activePlayer;
		updatePiecesWithMoves();
	});

	// Get player's color from lobby
	async function getPlayerColor() {
		const currentLobbyId = $lobbyId;
		if (!currentLobbyId) return;

		try {
			const lobby = await getLobby(currentLobbyId);
			playerColor =
				lobby.slots.slot1?.player === $playerName && lobby.slots.slot1?.color
					? lobby.slots.slot1.color === 'white'
						? ChessColor.White
						: ChessColor.Black
					: lobby.slots.slot2?.player === $playerName && lobby.slots.slot2?.color
						? lobby.slots.slot2.color === 'white'
							? ChessColor.White
							: ChessColor.Black
						: null;

			updatePiecesWithMoves();
		} catch (error) {
			Sentry.captureException(error, {
				extra: {
					errorMessage: resources.errors.common.fetchFailed
				}
			});
			console.error('Failed to fetch player color:', error);
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
			await moveTo(selectedPiece, targetX, targetY, pieces, gameState);

			// Reset selection after move
			selectedPiece = null;
			validMoves = [];
			threatFields = [];
		} catch (error) {
			Sentry.captureException(error, {
				extra: {
					errorMessage: resources.errors.common.updateFailed
				}
			});
			console.error('Move failed:', error);
			// Reset selection on error
			selectedPiece = null;
			validMoves = [];
			threatFields = [];
		}
	}

	function handleTileClick(x: number, y: number, _event: MouseEvent) {
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
	{#each Array(width) as _unused, x}
		{#each Array(depth) as _unused2, y}
			<Tile
				{x}
				{y}
				{tileSize}
				id={`tile-${x}-${y}`}
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
				resources.config.board.pieceHeight,
				y * tileSize - (depth * tileSize) / 2 + tileSize / 2
			]}
			isSelected={selectedPiece?.position === piece.position}
			onclickDelegate={() => handleSelect(piece)}
		/>
	{/each}
</T.Group>
