import type { Lobby } from '$lib/types/chess';
import { resources } from '$lib/resources';
import { ChessColor } from '$lib/types/chess';

// Helper function to handle API errors
async function handleApiResponse<T>(response: Response, errorMessage: string): Promise<T> {
	if (!response.ok) {
		// Try to extract detailed error message from response
		try {
			const errorData = await response.json();
			console.error('API Error Details:', {
				status: response.status,
				statusText: response.statusText,
				url: response.url,
				error: errorData
			});
			
			// Throw with more detailed message if available
			if (errorData.error) {
				throw new Error(`${errorMessage}: ${errorData.error}`);
			}
		} catch (parseError) {
			console.error('Error parsing error response:', parseError);
		}
		
		// Fall back to generic error
		throw new Error(`${errorMessage} (Status: ${response.status} - ${response.statusText})`);
	}
	
	return response.json();
}

export async function getLobbies(): Promise<Lobby[]> {
	try {
		const response = await fetch('/api/lobbies');
		return handleApiResponse<Lobby[]>(response, resources.errors.common.fetchFailed);
	} catch (error) {
		console.error('getLobbies error:', error);
		throw error;
	}
}

export async function createLobby(userId: string, name: string): Promise<Lobby> {
	try {
		console.log('Creating lobby with data:', { userId, name });
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
		
		return handleApiResponse<Lobby>(response, resources.errors.common.createFailed);
	} catch (error) {
		console.error('createLobby error:', error);
		throw error;
	}
}

export async function getLobby(id: string): Promise<Lobby> {
	try {
		const response = await fetch(`/api/lobbies/${id}`);
		return handleApiResponse<Lobby>(response, resources.errors.common.fetchFailed);
	} catch (error) {
		console.error('getLobby error:', error);
		throw error;
	}
}

export async function deleteLobby(id: string, userId: string): Promise<void> {
	try {
		const response = await fetch(`/api/lobbies/${id}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ userId })
		});
		
		if (!response.ok) {
			return handleApiResponse(response, resources.errors.common.deleteFailed);
		}
	} catch (error) {
		console.error('deleteLobby error:', error);
		throw error;
	}
}

export async function joinLobby(id: string, userId: string): Promise<Lobby> {
	try {
		console.log('Joining lobby with data:', { id, userId });
		const response = await fetch(`/api/lobbies/${id}/join`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ userId })
		});
		
		return handleApiResponse<Lobby>(response, resources.errors.common.joinFailed);
	} catch (error) {
		console.error('joinLobby error:', error);
		throw error;
	}
}

export async function leaveLobby(id: string, userId: string): Promise<Lobby> {
	try {
		const response = await fetch(`/api/lobbies/${id}/leave`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ userId })
		});
		
		return handleApiResponse<Lobby>(response, resources.errors.common.leaveFailed);
	} catch (error) {
		console.error('leaveLobby error:', error);
		throw error;
	}
}

export async function startGame(
	id: string,
	userId: string,
	timeControl: { minutes: number; increment: number }
): Promise<Lobby> {
	try {
		console.log('Starting game with data:', { id, userId, timeControl });
		const response = await fetch(`/api/lobbies/${id}/start`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ userId, timeControl })
		});
		
		return handleApiResponse<Lobby>(response, resources.errors.common.startFailed);
	} catch (error) {
		console.error('startGame error:', error);
		throw error;
	}
}

export async function updateTimeSettings(
	id: string,
	userId: string,
	timeControl: { minutes: number; increment: number }
): Promise<Lobby> {
	try {
		console.log('Updating time settings with data:', { id, userId, timeControl });
		const response = await fetch(`/api/lobbies/${id}/time-settings`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ playerName: userId, timeControl })
		});
		
		return handleApiResponse<Lobby>(response, resources.errors.common.updateFailed);
	} catch (error) {
		console.error('updateTimeSettings error:', error);
		throw error;
	}
}

export async function randomizeLobby(id: string, userId: string): Promise<Lobby> {
	try {
		console.log('Randomizing lobby with data:', { id, userId });
		const response = await fetch(`/api/lobbies/${id}/randomize`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ userId })
		});
		
		return handleApiResponse<Lobby>(response, resources.errors.common.updateFailed);
	} catch (error) {
		console.error('randomizeLobby error:', error);
		throw error;
	}
}

export async function setPlayerColor(
	id: string,
	userId: string,
	targetPlayer: string,
	color: ChessColor
): Promise<Lobby> {
	try {
		console.log('Setting player color with data:', { id, userId, targetPlayer, color });
		const response = await fetch(`/api/lobbies/${id}/set-color`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ userId, targetPlayer, color })
		});
		
		return handleApiResponse<Lobby>(response, resources.errors.common.updateFailed);
	} catch (error) {
		console.error('setPlayerColor error:', error);
		throw error;
	}
}
