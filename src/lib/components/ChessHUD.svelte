<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { T } from "@threlte/core";
	import { gameState } from "$lib/stores/gameStore";
	import { lobbyId } from "$lib/stores/lobbyStore";
	import { playerName } from "$lib/stores/playerStore";
	import { ChessColor } from "$lib/types/chess";

	let whiteTime = 600;
	let blackTime = 600;
	let whiteCaptured = 0;
	let blackCaptured = 0;
	let whitePlayer = "";
	let blackPlayer = "";
	let lobbyInterval: number;
	let currentPlayerColor: ChessColor = ChessColor.White;
	let timeInterval: number;

	gameState.subscribe((state) => {
		whiteCaptured = state.capturedPieces.white.length;
		blackCaptured = state.capturedPieces.black.length;
		currentPlayerColor = state.activePlayer;
		if (state.timeRemaining) {
			whiteTime = state.timeRemaining.white;
			blackTime = state.timeRemaining.black;
		}
	});

	async function getPlayerInfo() {
		const currentLobbyId = $lobbyId;
		if (!currentLobbyId) return;

		try {
			const response = await fetch(`/api/lobbies/${currentLobbyId}`);
			if (!response.ok) return;

			const lobby = await response.json();
			whitePlayer = lobby.players.white || "White";
			blackPlayer = lobby.players.black || "Black";
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
		if (!$lobbyId || !currentPlayerColor) return;

		try {
			const response = await fetch(`/api/game/${$lobbyId}/time`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					playerName: $playerName,
					color: currentPlayerColor
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
</style> 