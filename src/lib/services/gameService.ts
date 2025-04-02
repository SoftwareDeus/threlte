import type { GameState, Move } from '$lib/types/chess';
import { resources } from '$lib/resources';
import { ChessColor } from '$lib/types/chess';

export async function getGameState(lobbyId: string): Promise<GameState> {
	const response = await fetch(`/api/game/${lobbyId}`);
	if (!response.ok) {
		throw new Error(resources.errors.common.fetchFailed);
	}
	return response.json();
}

export async function makeMove(
	lobbyId: string,
	playerName: string,
	move: Move
): Promise<GameState> {
	const response = await fetch(`/api/game/${lobbyId}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ playerName, move })
	});
	if (!response.ok) {
		throw new Error(resources.errors.common.updateFailed);
	}
	return response.json();
}

export async function endGame(lobbyId: string, playerName: string, winner: string): Promise<void> {
	const response = await fetch(`/api/lobbies/${lobbyId}/end`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ playerName, winner })
	});
	if (!response.ok) {
		throw new Error(resources.errors.common.updateFailed);
	}
}

export async function updateTime(
	lobbyId: string,
	playerName: string,
	color: ChessColor
): Promise<GameState> {
	const response = await fetch(`/api/game/${lobbyId}/time`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			playerName,
			color
		})
	});
	if (!response.ok) {
		throw new Error(resources.errors.common.updateFailed);
	}
	return response.json();
}
