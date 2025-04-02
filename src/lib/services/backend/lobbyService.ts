import { supabaseAdmin as supabase } from '$lib/server/supabaseAdmin';
import type { Lobby } from '$lib/types/chess';
import * as Sentry from '@sentry/sveltekit';
import { resources } from '$lib/resources';
import { ChessColor } from '$lib/types/chess';

export class BackendLobbyService {
	static async getLobbies(): Promise<Lobby[]> {
		try {
			const { data, error } = await supabase
				.from('lobbies')
				.select('*')
				.order('created', { ascending: false });

			if (error) {
				console.error('Supabase error fetching lobbies:', error);
				throw error;
			}
			return data || [];
		} catch (error) {
			console.error('Error in getLobbies:', error);
			Sentry.captureException(error, {
				extra: {
					errorMessage: resources.errors.common.fetchFailed,
					context: 'BackendLobbyService.getLobbies'
				}
			});
			throw new Error(resources.errors.common.fetchFailed);
		}
	}

	static async getLobby(id: string): Promise<Lobby> {
		try {
			const { data, error } = await supabase.from('lobbies').select('*').eq('id', id).single();

			if (error) throw error;
			if (!data) throw new Error(resources.errors.server.validation.lobbyNotFound);
			return data;
		} catch (error) {
			Sentry.captureException(error, {
				extra: {
					errorMessage: resources.errors.common.fetchFailed
				}
			});
			throw new Error(resources.errors.common.fetchFailed);
		}
	}

	static async createLobby(lobbyData: Omit<Lobby, 'id' | 'created_at' | 'slots'>): Promise<Lobby> {
		try {
			// Add default slots structure
			const dataWithSlots = {
				...lobbyData,
				slots: {
					slot1: {
						player: lobbyData.host_id,
						color: ChessColor.White
					},
					slot2: lobbyData.player2_id ? {
						player: lobbyData.player2_id,
						color: ChessColor.Black
					} : undefined
				}
			};

			const { data, error } = await supabase.from('lobbies').insert([dataWithSlots]).select().single();

			if (error) {
				console.error('Supabase error creating lobby:', error);
				throw error;
			}
			return data as Lobby;
		} catch (error) {
			console.error('Error in createLobby:', error);
			Sentry.captureException(error, {
				extra: {
					errorMessage: resources.errors.common.createFailed,
					context: 'BackendLobbyService.createLobby',
					lobbyData: lobbyData
				}
			});
			throw new Error(resources.errors.common.createFailed);
		}
	}

	static async updateLobby(id: string, updates: Partial<Lobby>): Promise<Lobby> {
		try {
			const { data, error } = await supabase
				.from('lobbies')
				.update(updates)
				.eq('id', id)
				.select()
				.single();

			if (error) throw error;
			if (!data) throw new Error(resources.errors.server.validation.lobbyNotFound);
			return data;
		} catch (error) {
			Sentry.captureException(error, {
				extra: {
					errorMessage: resources.errors.common.updateFailed
				}
			});
			throw new Error(resources.errors.common.updateFailed);
		}
	}

	static async deleteLobby(id: string): Promise<void> {
		try {
			const { error } = await supabase.from('lobbies').delete().eq('id', id);

			if (error) throw error;
		} catch (error) {
			Sentry.captureException(error, {
				extra: {
					errorMessage: resources.errors.common.deleteFailed
				}
			});
			throw new Error(resources.errors.common.deleteFailed);
		}
	}

	static async joinLobby(id: string, userId: string): Promise<Lobby> {
		try {
			const lobby = await this.getLobby(id);

			if (lobby.status !== 'waiting') {
				throw new Error(resources.errors.server.validation.lobbyNotAvailable);
			}

			if (lobby.host_id === userId) {
				throw new Error(resources.errors.server.validation.cannotJoinOwnLobby);
			}

			// Update slots for the joining player
			const updatedSlots = {
				slot1: lobby.slots?.slot1 || {
					player: lobby.host_id,
					color: ChessColor.White
				},
				slot2: {
					player: userId,
					color: ChessColor.Black
				}
			};

			const { data, error } = await supabase
				.from('lobbies')
				.update({
					player2_id: userId,
					status: 'waiting',
					slots: updatedSlots
				})
				.eq('id', id)
				.select()
				.single();

			if (error) throw error;
			return data;
		} catch (error) {
			Sentry.captureException(error, {
				extra: {
					errorMessage: resources.errors.common.joinFailed
				}
			});
			throw new Error(resources.errors.common.joinFailed);
		}
	}

	static async leaveLobby(id: string, userId: string): Promise<Lobby> {
		try {
			const lobby = await this.getLobby(id);

			if (lobby.host_id === userId) {
				// If host leaves, delete the lobby
				await this.deleteLobby(id);
				return lobby;
			}

			if (lobby.player2_id !== userId) {
				throw new Error(resources.errors.server.validation.notInLobby);
			}
			
			// Update slots when player leaves
			const updatedSlots = {
				slot1: lobby.slots?.slot1 || {
					player: lobby.host_id,
					color: ChessColor.White
				},
				slot2: undefined
			};

			const { data, error } = await supabase
				.from('lobbies')
				.update({
					player2_id: null,
					status: 'waiting',
					slots: updatedSlots
				})
				.eq('id', id)
				.select()
				.single();

			if (error) throw error;
			return data;
		} catch (error) {
			Sentry.captureException(error, {
				extra: {
					errorMessage: resources.errors.common.leaveFailed
				}
			});
			throw new Error(resources.errors.common.leaveFailed);
		}
	}

	static async startGame(
		id: string,
		userId: string,
		timeControl: { minutes: number; increment: number }
	): Promise<Lobby> {
		try {
			console.log(`[Backend] Starting game for lobby ${id} with userId ${userId}`, { timeControl });
			
			// Get the current lobby state
			let lobby;
			try {
				lobby = await this.getLobby(id);
				console.log(`[Backend] Retrieved lobby:`, lobby);
			} catch (error) {
				console.error(`[Backend] Failed to get lobby ${id}:`, error);
				throw new Error(`${resources.errors.server.validation.lobbyNotFound}: ${(error as Error).message}`);
			}

			// Check host permissions
			if (lobby.host_id !== userId) {
				console.error(`[Backend] User ${userId} is not the host of lobby ${id}`);
				throw new Error(resources.errors.server.validation.notHost);
			}

			// Check lobby status
			if (lobby.status !== 'waiting') {
				console.error(`[Backend] Lobby ${id} is not in waiting status, current status: ${lobby.status}`);
				throw new Error(resources.errors.server.validation.lobbyNotAvailable);
			}

			// Check player count
			if (!lobby.player2_id) {
				console.error(`[Backend] Lobby ${id} does not have a second player`);
				throw new Error(resources.errors.server.validation.lobbyNotFull);
			}

			// Attempt to update the lobby in the database
			try {
				const { data, error } = await supabase
					.from('lobbies')
					.update({
						status: 'playing',
						time_control: timeControl
					})
					.eq('id', id)
					.select()
					.single();

				if (error) {
					console.error(`[Backend] Supabase error updating lobby ${id}:`, error);
					throw error;
				}
				
				if (!data) {
					console.error(`[Backend] No data returned when updating lobby ${id}`);
					throw new Error('No data returned from database update');
				}
				
				console.log(`[Backend] Successfully started game for lobby ${id}`, data);
				return data;
			} catch (dbError) {
				console.error(`[Backend] Database error when starting game for lobby ${id}:`, dbError);
				throw new Error(`Database error: ${(dbError as Error).message}`);
			}
		} catch (error) {
			console.error(`[Backend] Failed to start game:`, error);
			Sentry.captureException(error, {
				extra: {
					errorMessage: resources.errors.common.startFailed,
					lobbyId: id,
					userId,
					timeControl
				}
			});
			// Return the original error message to help with debugging
			if (error instanceof Error) {
				throw new Error(`${resources.errors.common.startFailed}: ${error.message}`);
			} else {
				throw new Error(resources.errors.common.startFailed);
			}
		}
	}

	static async setPlayerColor(
		id: string,
		userId: string,
		targetPlayer: string,
		color: ChessColor
	): Promise<Lobby> {
		try {
			const lobby = await this.getLobby(id);

			// Validation: Only host can set colors
			if (lobby.host_id !== userId) {
				throw new Error(resources.errors.server.validation.onlyHostCanSetColors);
			}
			// Validation: Can only set colors while waiting
			if (lobby.status !== 'waiting') {
				throw new Error(resources.errors.server.validation.lobbyNotAvailable); // Or a more specific error
			}
			// Validation: Target player must be in the lobby
			if (lobby.host_id !== targetPlayer && lobby.player2_id !== targetPlayer) {
				throw new Error(resources.errors.server.validation.targetPlayerNotFound);
			}
			// Validation: Cannot set color to Random directly (handled by randomizeColors)
			if (color === ChessColor.Random) {
				throw new Error('Cannot set color to Random directly. Use randomize.');
			}

			// Determine the other color
			const otherColor = color === ChessColor.White ? ChessColor.Black : ChessColor.White;

			// Update slots based on which player is the target
			const updatedSlots = {
				slot1: {
					player: lobby.host_id,
					color: lobby.host_id === targetPlayer ? color : otherColor
				},
				slot2: lobby.player2_id
					? {
							// Only update slot2 if player2 exists
							player: lobby.player2_id,
							color: lobby.player2_id === targetPlayer ? color : otherColor
						}
					: undefined
			};

			// Perform the update
			const { data, error } = await supabase
				.from('lobbies')
				.update({ slots: updatedSlots })
				.eq('id', id)
				.select()
				.single();

			if (error) {
				console.error('Supabase error setting player color:', error);
				throw error;
			}
			if (!data) {
				// Should not happen if getLobby succeeded, but good practice
				throw new Error(resources.errors.server.validation.lobbyNotFound);
			}
			return data;
		} catch (error) {
			console.error('Error in setPlayerColor:', error);
			Sentry.captureException(error, {
				extra: {
					errorMessage: resources.errors.common.updateFailed,
					context: 'BackendLobbyService.setPlayerColor',
					lobbyId: id,
					userId,
					targetPlayer,
					color
				}
			});
			// Rethrow original error if it has a message, otherwise generic
			throw new Error((error as Error).message || resources.errors.common.updateFailed);
		}
	}

	static async randomizeColors(id: string, userId: string): Promise<Lobby> {
		try {
			const lobby = await this.getLobby(id);

			// Validation: Only host can randomize
			if (lobby.host_id !== userId) {
				throw new Error(resources.errors.server.validation.onlyHostCanRandomize);
			}
			// Validation: Can only randomize while waiting
			if (lobby.status !== 'waiting') {
				throw new Error(resources.errors.server.validation.lobbyNotAvailable);
			}
			// Validation: Need second player to randomize
			if (!lobby.player2_id) {
				throw new Error(resources.errors.server.validation.needSecondPlayerForRandom);
			}

			// Randomize colors
			const shouldSlot1BeWhite = Math.random() < 0.5;
			const updatedSlots = {
				slot1: {
					player: lobby.host_id, // Player ID doesn't change
					color: shouldSlot1BeWhite ? ChessColor.White : ChessColor.Black
				},
				slot2: {
					player: lobby.player2_id, // Player ID doesn't change
					color: shouldSlot1BeWhite ? ChessColor.Black : ChessColor.White
				}
			};

			// Perform the update
			const { data, error } = await supabase
				.from('lobbies')
				.update({ slots: updatedSlots })
				.eq('id', id)
				.select()
				.single();

			if (error) {
				console.error('Supabase error randomizing colors:', error);
				throw error;
			}
			if (!data) {
				throw new Error(resources.errors.server.validation.lobbyNotFound);
			}
			return data;
		} catch (error) {
			console.error('Error in randomizeColors:', error);
			Sentry.captureException(error, {
				extra: {
					errorMessage: resources.errors.common.updateFailed,
					context: 'BackendLobbyService.randomizeColors',
					lobbyId: id,
					userId
				}
			});
			throw new Error((error as Error).message || resources.errors.common.updateFailed);
		}
	}
}
