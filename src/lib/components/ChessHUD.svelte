<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { T } from "@threlte/core";
	import { gameState } from "$lib/stores/gameStore";
	import { lobbyId } from "$lib/stores/lobbyStore";
	import { playerName } from "$lib/stores/playerStore";
	import { ChessColor } from "$lib/types/chess";
	import { goto } from "$app/navigation";

	let whiteTime = 600;
	let blackTime = 600;
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
						 lobby.slots.slot2?.color === 'white' ? lobby.slots.slot2.player : "White";
			blackPlayer = lobby.slots.slot1?.color === 'black' ? lobby.slots.slot1.player :
						 lobby.slots.slot2?.color === 'black' ? lobby.slots.slot2.player : "Black";
			
			// Set the player's color based on their slot
			playerColor = lobby.slots.slot1?.player === $playerName && lobby.slots.slot1?.color ? 
						 (lobby.slots.slot1.color === 'white' ? ChessColor.White : ChessColor.Black) :
						 lobby.slots.slot2?.player === $playerName && lobby.slots.slot2?.color ?
						 (lobby.slots.slot2.color === 'white' ? ChessColor.White : ChessColor.Black) :
						 null;
		} catch (error) {
			console.error("Failed to fetch player info:", error);
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
				throw new Error(data.error || 'Failed to update time');
			}

			const state = await response.json();
			if (state.timeRemaining) {
				whiteTime = state.timeRemaining.white;
				blackTime = state.timeRemaining.black;
			}
		} catch (error) {
			console.error('Failed to update time:', error);
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
				throw new Error('Failed to delete lobby');
			}

			goto('/lobby');
		} catch (error) {
			console.error('Failed to delete lobby:', error);
		}
	}
</script>

<div class="hud">
	<div class="player-info">
		<div class="player white {isWhiteTurn ? 'active' : ''}">
			<span class="name">
				{whitePlayer}
				{#if isWhitePlayer}
					<span class="you">(you)</span>
				{/if}
			</span>
			<span class="time">{whiteTimeDisplay}</span>
			<span class="captured">Captured: {whiteCaptured}</span>
		</div>
		<div class="center-section">
			<div class="game-status">
				{#if isGameOver}
					<div class="winner">Game Over! {winner} wins!</div>
				{/if}
			</div>
			<button class="back-button" on:click={handleBackToLobby}>Back to Lobby</button>
		</div>
		<div class="player black {isBlackTurn ? 'active' : ''}">
			<span class="name">
				{#if isBlackPlayer}
					<span class="you">(you)</span>
				{/if}
				{blackPlayer}
			</span>
			<span class="time">{blackTimeDisplay}</span>
			<span class="captured">Captured: {blackCaptured}</span>
		</div>
	</div>
</div>

<style>
	.hud {
		position: fixed;
		top: 20px;
		left: 20px;
		right: 20px;
		display: flex;
		justify-content: center;
		z-index: 1000;
	}

	.player-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		max-width: 800px;
		background: rgba(0, 0, 0, 0.7);
		padding: 10px 20px;
		border-radius: 8px;
		color: white;
	}

	.player {
		display: flex;
		flex-direction: column;
		gap: 5px;
		padding: 5px 10px;
		border-radius: 4px;
		flex: 1;
	}

	.center-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		padding: 0 20px;
	}

	.player.active {
		background: rgba(76, 175, 80, 0.2);
	}

	.player.white {
		text-align: left;
	}

	.player.black {
		text-align: left;
	}

	.name {
		font-size: 1.2em;
		font-weight: bold;
		display: flex;
		align-items: center;
		gap: 5px;
	}

	.you {
		font-size: 0.8em;
		color: #4CAF50;
		font-weight: normal;
	}

	.time {
		font-size: 1.5em;
		font-family: monospace;
	}

	.captured {
		font-size: 0.9em;
		opacity: 0.8;
	}

	.game-status {
		text-align: center;
	}

	.winner {
		color: #ffd700;
		font-weight: bold;
	}

	.back-button {
		background: #4a4a4a;
		color: white;
		border: none;
		padding: 8px 16px;
		border-radius: 5px;
		cursor: pointer;
		font-size: 14px;
		transition: background-color 0.2s;
	}

	.back-button:hover {
		background: #666666;
	}
</style> 