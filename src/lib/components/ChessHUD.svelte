<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { T } from "@threlte/core";
	import { gameState } from "$lib/stores/gameStore";
	import { lobbyId } from "$lib/stores/lobbyStore";
	import { playerName } from "$lib/stores/playerStore";
	import { ChessColor } from "$lib/types/chess";
	import { goto } from "$app/navigation";
	import { resources } from '$lib/resources';

	let whiteTime = resources.constants.time.defaultMinutes * 60;
	let blackTime = resources.constants.time.defaultMinutes * 60;
	let whiteCaptured = 0;
	let blackCaptured = 0;
	let whitePlayer = "";
	let blackPlayer = "";
	let lobbyInterval: number;
	let currentPlayerColor: ChessColor = ChessColor.White;
	let timeInterval: number;
	let playerColor: ChessColor | null = null;
	let isWhiteTurn: boolean = true;
	let isGameOver: boolean = false;
	let winner: string = "";

	gameState.subscribe((state) => {
		whiteCaptured = state.capturedPieces.white.length;
		blackCaptured = state.capturedPieces.black.length;
		currentPlayerColor = state.activePlayer;
		if (state.timeRemaining) {
			whiteTime = state.timeRemaining.white;
			blackTime = state.timeRemaining.black;
		}
		isWhiteTurn = state.activePlayer === ChessColor.White;
		if (state.gameOver) {
			isGameOver = true;
			winner = state.winner === ChessColor.White ? whitePlayer : blackPlayer;
		}
	});

	async function getPlayerInfo() {
		const currentLobbyId = $lobbyId;
		if (!currentLobbyId) return;

		try {
			const response = await fetch(`/api/lobbies/${currentLobbyId}`);
			if (!response.ok) return;

			const lobby = await response.json();
			whitePlayer = lobby.slots.slot1?.color === 'white' ? lobby.slots.slot1.player :
						 lobby.slots.slot2?.color === 'white' ? lobby.slots.slot2.player : resources.chess.pieces.white.king;
			blackPlayer = lobby.slots.slot1?.color === 'black' ? lobby.slots.slot1.player :
						 lobby.slots.slot2?.color === 'black' ? lobby.slots.slot2.player : resources.chess.pieces.black.king;
			
			// Set the player's color based on their slot
			playerColor = lobby.slots.slot1?.player === $playerName && lobby.slots.slot1?.color ? 
						 (lobby.slots.slot1.color === 'white' ? ChessColor.White : ChessColor.Black) :
						 lobby.slots.slot2?.player === $playerName && lobby.slots.slot2?.color ?
						 (lobby.slots.slot2.color === 'white' ? ChessColor.White : ChessColor.Black) :
						 null;
		} catch (error) {
			console.error(resources.common.errors.fetchFailed, error);
		}
	}

	onMount(() => {
		getPlayerInfo();
		lobbyInterval = setInterval(getPlayerInfo, 1000);
		timeInterval = setInterval(updateTime, 1000);
	});

	onDestroy(() => {
		if (lobbyInterval) {
			clearInterval(lobbyInterval);
		}
		if (timeInterval) {
			clearInterval(timeInterval);
		}
	});

	async function updateTime() {
		if (!$lobbyId || !playerColor) return;

		try {
			const response = await fetch(`/api/game/${$lobbyId}/time`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					playerName: $playerName,
					color: playerColor
				})
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || resources.common.errors.updateFailed);
			}

			const state = await response.json();
			if (state.timeRemaining) {
				whiteTime = state.timeRemaining.white;
				blackTime = state.timeRemaining.black;
			}
		} catch (error) {
			console.error(resources.common.errors.updateFailed, error);
		}
	}

	function formatTime(seconds: number): string {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
	}

	$: whiteTimeDisplay = formatTime(whiteTime);
	$: blackTimeDisplay = formatTime(blackTime);
	$: isWhitePlayer = whitePlayer === $playerName;
	$: isBlackPlayer = blackPlayer === $playerName;
	$: isWhiteTurn = currentPlayerColor === ChessColor.White;
	$: isBlackTurn = currentPlayerColor === ChessColor.Black;

	async function handleBackToLobby() {
		if (!$lobbyId) return;
		
		try {
			const response = await fetch(`/api/lobbies/${$lobbyId}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					playerName: $playerName
				})
			});

			if (!response.ok) {
				throw new Error(resources.common.errors.deleteFailed);
			}

			goto('/lobby');
		} catch (error) {
			console.error(resources.common.errors.deleteFailed, error);
		}
	}
</script>

<div class="fixed top-5 left-5 right-5 flex justify-center z-50">
	<div class="flex justify-between items-center w-full max-w-[800px] bg-black/70 p-2.5 px-5 rounded-lg text-white">
		<div class="flex flex-col gap-1.5 p-1.5 px-2.5 rounded flex-1 text-left {isWhiteTurn ? 'bg-[#4CAF50]/20' : ''}">
			<span class="text-lg font-bold flex items-center gap-1.5">
				{whitePlayer}
				{#if isWhitePlayer}
					<span class="text-sm text-[#4CAF50] font-normal">({resources.common.labels.you})</span>
				{/if}
			</span>
			<span class="text-2xl font-mono">{whiteTimeDisplay}</span>
			<span class="text-sm text-gray-300">{resources.chess.game.captured}: {whiteCaptured}</span>
		</div>
		<div class="flex flex-col items-center gap-2.5 px-5">
			<div class="text-center">
				{#if isGameOver}
					<div class="text-lg font-bold text-[#4CAF50]">{resources.chess.game.gameOver} {winner} {resources.chess.game.wins}</div>
				{/if}
			</div>
			<button class="px-2.5 py-1.5 bg-white/10 border-none rounded text-white cursor-pointer transition-colors hover:bg-white/20" on:click={handleBackToLobby}>{resources.common.labels.backToLobbies}</button>
		</div>
		<div class="flex flex-col gap-1.5 p-1.5 px-2.5 rounded flex-1 text-left {isBlackTurn ? 'bg-[#4CAF50]/20' : ''}">
			<span class="text-lg font-bold flex items-center gap-1.5">
				{#if isBlackPlayer}
					<span class="text-sm text-[#4CAF50] font-normal">({resources.common.labels.you})</span>
				{/if}
				{blackPlayer}
			</span>
			<span class="text-2xl font-mono">{blackTimeDisplay}</span>
			<span class="text-sm text-gray-300">{resources.chess.game.captured}: {blackCaptured}</span>
		</div>
	</div>
</div> 