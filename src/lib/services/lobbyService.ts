import type { Lobby } from '$lib/types/chess';
import { resources } from '$lib/resources';

export async function getLobbies(): Promise<Lobby[]> {
	const response = await fetch('/api/lobbies');
	if (!response.ok) {
		throw new Error(resources.errors.common.fetchFailed);
	}
	return response.json();
}

export async function createLobby(userId: string, name: string): Promise<Lobby> {
	const response = await fetch('/api/lobbies', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			host_id: userId,
			name,
			status: 'waiting'
		})
	});

	if (!response.ok) {
		throw new Error(resources.errors.common.createFailed);
	}
	return response.json();
}

export async function getLobby(id: string): Promise<Lobby> {
	const response = await fetch(`/api/lobbies/${id}`);
	if (!response.ok) {
		throw new Error(resources.errors.common.fetchFailed);
	}
	return response.json();
}

export async function deleteLobby(id: string, userId: string): Promise<void> {
	const response = await fetch(`/api/lobbies/${id}`, {
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ userId })
	});

	if (!response.ok) {
		throw new Error(resources.errors.common.deleteFailed);
	}
}

export async function joinLobby(id: string, userId: string): Promise<Lobby> {
	const response = await fetch(`/api/lobbies/${id}/join`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ userId })
	});

	if (!response.ok) {
		throw new Error(resources.errors.common.joinFailed);
	}
	return response.json();
}

export async function leaveLobby(id: string, userId: string): Promise<Lobby> {
	const response = await fetch(`/api/lobbies/${id}/leave`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ userId })
	});

	if (!response.ok) {
		throw new Error(resources.errors.common.leaveFailed);
	}
	return response.json();
}

export async function startGame(
	id: string,
	userId: string,
	timeControl: { minutes: number; increment: number }
): Promise<Lobby> {
	const response = await fetch(`/api/lobbies/${id}/start`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ userId, timeControl })
	});

	if (!response.ok) {
		throw new Error(resources.errors.common.startFailed);
	}
	return response.json();
}

export async function updateTimeSettings(
	id: string,
	userId: string,
	timeControl: { minutes: number; increment: number }
): Promise<Lobby> {
	const response = await fetch(`/api/lobbies/${id}/time-settings`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ userId, timeControl })
	});

	if (!response.ok) {
		throw new Error(resources.errors.common.updateFailed);
	}
	return response.json();
}

export async function randomizeLobby(id: string, playerName: string): Promise<Lobby> {
	const response = await fetch(`/api/lobbies/${id}/randomize`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ playerName })
	});
	if (!response.ok) {
		throw new Error(resources.errors.common.updateFailed);
	}
	return response.json();
}

export async function setPlayerColor(
	id: string,
	playerName: string,
	targetPlayer: string,
	color: string
): Promise<Lobby> {
	const response = await fetch(`/api/lobbies/${id}/set-color`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ playerName, targetPlayer, color })
	});
	if (!response.ok) {
		throw new Error(resources.errors.common.updateFailed);
	}
	return response.json();
}
