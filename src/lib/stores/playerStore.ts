import { writable } from 'svelte/store';
import { ChessColor } from '../types/chess';
import type { PlayerProfile } from '../services/supabase';
import { PlayerService } from '../services/playerService';

export const playerName = writable<string>('');
export const playerColor = writable<ChessColor | null>(null);
export const whitePlayerName = writable<string>('');
export const blackPlayerName = writable<string>('');

interface PlayerStore {
    profile: PlayerProfile | null
    loading: boolean
    error: string | null
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
            update(state => ({ ...state, loading: true, error: null }));
            try {
                const profile = await PlayerService.createProfile(username, avatar_url);
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
            update(state => ({ ...state, loading: true, error: null }));
            try {
                const profile = await PlayerService.getProfile(userId);
                if (!profile) throw new Error('Profile not found');
                set({ profile, loading: false, error: null });
            } catch (error: unknown) {
                set({ 
                    profile: null, 
                    loading: false, 
                    error: error instanceof Error ? error.message : 'An unknown error occurred' 
                });
            }
        },
        updateProfile: async (userId: string, updates: Partial<PlayerProfile>) => {
            update(state => ({ ...state, loading: true, error: null }));
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
            update(state => ({ ...state, loading: true, error: null }));
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
            update(state => ({ ...state, loading: true, error: null }));
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