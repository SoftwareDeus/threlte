import { writable } from 'svelte/store'
import { supabase } from '../services/supabase'
import type { User } from '@supabase/supabase-js'
import { AuthService } from '../services/authService'
import { playerStore } from './playerStore'

interface AuthState {
    user: User | null
    loading: boolean
    error: string | null
}

function createAuthStore() {
    const { subscribe, set, update } = writable<AuthState>({
        user: null,
        loading: true,
        error: null
    })

    // Initialize auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
        set({
            user: session?.user ?? null,
            loading: false,
            error: null
        })
    })

    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
        set({
            user: session?.user ?? null,
            loading: false,
            error: null
        })
    })

    return {
        subscribe,
        signUp: async (email: string, password: string, username: string) => {
            update(state => ({ ...state, loading: true, error: null }))
            const result = await AuthService.signUp(email, password, username)
            if (!result.success) {
                update(state => ({
                    ...state,
                    loading: false,
                    error: result.error instanceof Error ? result.error.message : 'An unknown error occurred'
                }))
                return false
            }
            return true
        },
        signIn: async (email: string, password: string) => {
            update(state => ({ ...state, loading: true, error: null }))
            const result = await AuthService.signIn(email, password)
            if (!result.success) {
                update(state => ({
                    ...state,
                    loading: false,
                    error: result.error instanceof Error ? result.error.message : 'An unknown error occurred'
                }))
                return false
            }
            return true
        },
        signOut: async () => {
            update(state => ({ ...state, loading: true, error: null }));
            try {
                const result = await supabase.auth.signOut();
                if (result.error) throw result.error;
                playerStore.clearProfile();
                set({ user: null, loading: false, error: null });
                return { error: null };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Failed to sign out';
                set({ user: null, loading: false, error: errorMessage });
                return { error: errorMessage };
            }
        },
        resetPassword: async (email: string) => {
            update(state => ({ ...state, loading: true, error: null }))
            const result = await AuthService.resetPassword(email)
            if (!result.success) {
                update(state => ({
                    ...state,
                    loading: false,
                    error: result.error instanceof Error ? result.error.message : 'An unknown error occurred'
                }))
                return false
            }
            return true
        }
    }
}

export const authStore = createAuthStore() 