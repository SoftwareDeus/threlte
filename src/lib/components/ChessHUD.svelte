<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { T } from "@threlte/core";
	import { gameState } from "$lib/stores/gameStore";
	import { lobbyId } from "$lib/stores/lobbyStore";
	import { ChessColor } from "$lib/types/chess";

	let whiteTime = 600;
	let blackTime = 600;
	let whiteCaptured = 0;
	let blackCaptured = 0;
	let whitePlayer = "";
	let blackPlayer = "";
	let lobbyInterval: number;

	gameState.subscribe((state) => {
		whiteCaptured = state.capturedPieces.white.length;
		blackCaptured = state.capturedPieces.black.length;
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
	});

	onDestroy(() => {
		if (lobbyInterval) {
			clearInterval(lobbyInterval);
		}
	});

	function formatTime(seconds: number): string {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
	}

	$: whiteTimeDisplay = formatTime(whiteTime);
	$: blackTimeDisplay = formatTime(blackTime);
</script>

<div class="hud">
	<div class="player-info">
		<div class="player white">
			<span class="name">{whitePlayer}</span>
			<span class="time">{whiteTimeDisplay}</span>
			<span class="captured">Captured: {whiteCaptured}</span>
		</div>
		<div class="player black">
			<span class="name">{blackPlayer}</span>
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
	}

	.player.white {
		text-align: left;
	}

	.player.black {
		text-align: right;
	}

	.name {
		font-size: 1.2em;
		font-weight: bold;
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