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
			const { data, error } = await supabase.from('lobbies').insert([lobbyData]).select().single();

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

			const { data, error } = await supabase
				.from('lobbies')
				.update({
					player2_id: userId,
					status: 'waiting'
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

			const { data, error } = await supabase
				.from('lobbies')
				.update({
					player2_id: null,
					status: 'waiting'
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
			const lobby = await this.getLobby(id);

			if (lobby.host_id !== userId) {
				throw new Error(resources.errors.server.validation.notHost);
			}

			if (lobby.status !== 'waiting') {
				throw new Error(resources.errors.server.validation.lobbyNotAvailable);
			}

			if (!lobby.player2_id) {
				throw new Error(resources.errors.server.validation.lobbyNotFull);
			}

			const { data, error } = await supabase
				.from('lobbies')
				.update({
					status: 'playing',
					time_control: timeControl,
					started_at: new Date().toISOString()
				})
				.eq('id', id)
				.select()
				.single();

			if (error) throw error;
			return data;
		} catch (error) {
			Sentry.captureException(error, {
				extra: {
					errorMessage: resources.errors.common.startFailed
				}
			});
			throw new Error(resources.errors.common.startFailed);
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
