import { writable } from 'svelte/store';
import { ChessColor } from '../types/chess';
import type { PlayerProfile } from '../services/supabase';
import { PlayerService } from '../services/playerService';
import { supabase } from '../services/supabase';

export const playerName = writable<string>('');
export const playerColor = writable<ChessColor | null>(null);
export const whitePlayerName = writable<string>('');
export const blackPlayerName = writable<string>('');

interface PlayerStore {
	profile: PlayerProfile | null;
	loading: boolean;
	error: string | null;
}

function createPlayerStore() {
	const { subscribe, set, update } = writable<PlayerStore>({
		profile: null,
		loading: false,
		error: null
	});

	return {
		subscribe,
		createProfile: async (username: string, avatar_url?: string) => {
			update((state) => ({ ...state, loading: true, error: null }));
			try {
				const {
					data: { user },
					error: userError
				} = await supabase.auth.getUser();
				if (userError || !user) {
					throw new Error('User not authenticated');
				}
				const profile = await PlayerService.createProfile(user.id, username, avatar_url || '');
				if (!profile) throw new Error('Failed to create profile');
				set({ profile, loading: false, error: null });
			} catch (error: unknown) {
				set({
					profile: null,
					loading: false,
					error: error instanceof Error ? error.message : 'An unknown error occurred'
				});
			}
		},
		loadProfile: async (userId: string) => {
			console.log('Loading profile for user ID:', userId);
			update((state) => ({ ...state, loading: true, error: null }));
			try {
				// First check if the user exists
				const {
					data: { user },
					error: userError
				} = await supabase.auth.getUser();
				if (userError || !user) {
					console.error('Error getting user:', userError);
					set({
						profile: null,
						loading: false,
						error: 'User not authenticated'
					});
					return;
				}

				console.log('User authenticated, loading profile...');
				const { data, error } = await supabase
					.from('player_profiles')
					.select('*')
					.eq('auth_user_id', userId)
					.maybeSingle();

				if (error) {
					console.error('Error loading profile:', error);
					set({
						profile: null,
						loading: false,
						error: 'Failed to load profile'
					});
				} else if (!data) {
					console.log('No profile found for user ID:', userId);
					set({
						profile: null,
						loading: false,
						error: 'No profile found'
					});
				} else {
					console.log('Profile loaded successfully:', data);
					set({ profile: data, loading: false, error: null });
				}
			} catch (error) {
				console.error('Error in loadProfile:', error);
				set({
					profile: null,
					loading: false,
					error: 'Failed to load profile'
				});
			}
		},
		updateProfile: async (userId: string, updates: Partial<PlayerProfile>) => {
			update((state) => ({ ...state, loading: true, error: null }));
			try {
				const profile = await PlayerService.updateProfile(userId, updates);
				if (!profile) throw new Error('Failed to update profile');
				set({ profile, loading: false, error: null });
			} catch (error: unknown) {
				set({
					profile: null,
					loading: false,
					error: error instanceof Error ? error.message : 'An unknown error occurred'
				});
			}
		},
		updateGameStats: async (userId: string, won: boolean) => {
			update((state) => ({ ...state, loading: true, error: null }));
			try {
				const profile = await PlayerService.updateGameStats(userId, won);
				if (!profile) throw new Error('Failed to update stats');
				set({ profile, loading: false, error: null });
			} catch (error: unknown) {
				set({
					profile: null,
					loading: false,
					error: error instanceof Error ? error.message : 'An unknown error occurred'
				});
			}
		},
		updateRating: async (userId: string, newRating: number) => {
			update((state) => ({ ...state, loading: true, error: null }));
			try {
				const profile = await PlayerService.updateRating(userId, newRating);
				if (!profile) throw new Error('Failed to update rating');
				set({ profile, loading: false, error: null });
			} catch (error: unknown) {
				set({
					profile: null,
					loading: false,
					error: error instanceof Error ? error.message : 'An unknown error occurred'
				});
			}
		},
		clearProfile: () => {
			set({ profile: null, loading: false, error: null });
		}
	};
}

export const playerStore = createPlayerStore();
