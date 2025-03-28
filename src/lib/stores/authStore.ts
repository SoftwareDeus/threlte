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

interface AuthResult {
    success: boolean
    error?: string
}

function createAuthStore() {
    const { subscribe, set, update } = writable<AuthState>({
        user: null,
        loading: true,
        error: null
    })

    // Initialize auth state and set up session refresh
    async function initializeAuth() {
        try {
            // Get initial session
            const { data: { session }, error } = await supabase.auth.getSession()
            if (error) throw error

            // Set initial state
            set({
                user: session?.user ?? null,
                loading: false,
                error: null
            })

            // Set up session refresh
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                console.log('Auth state changed:', event)
                
                if (event === 'SIGNED_IN') {
                    set({
                        user: session?.user ?? null,
                        loading: false,
                        error: null
                    })
                } else if (event === 'SIGNED_OUT') {
                    set({
                        user: null,
                        loading: false,
                        error: null
                    })
                    playerStore.clearProfile()
                } else if (event === 'TOKEN_REFRESHED') {
                    set({
                        user: session?.user ?? null,
                        loading: false,
                        error: null
                    })
                }
            })

            // Clean up subscription on store destruction
            return () => {
                subscription.unsubscribe()
            }
        } catch (error) {
            console.error('Error initializing auth:', error)
            set({
                user: null,
                loading: false,
                error: error instanceof Error ? error.message : 'Failed to initialize auth'
            })
        }
    }

    // Start initialization
    initializeAuth()

    return {
        subscribe,
        signUp: async (email: string, password: string, displayName: string): Promise<AuthResult> => {
            update(state => ({ ...state, loading: true, error: null }))
            const result = await AuthService.signUp(email, password, displayName)
            if (!result.success) {
                update(state => ({
                    ...state,
                    loading: false,
                    error: result.error || 'Failed to sign up'
                }))
                return { success: false, error: result.error }
            }
            return { success: true }
        },
        signIn: async (email: string, password: string): Promise<AuthResult> => {
            update(state => ({ ...state, loading: true, error: null }))
            const result = await AuthService.signIn(email, password)
            if (!result.success) {
                update(state => ({
                    ...state,
                    loading: false,
                    error: result.error || 'Failed to sign in'
                }))
                return { success: false, error: result.error }
            }
            return { success: true }
        },
        signOut: async (): Promise<AuthResult> => {
            update(state => ({ ...state, loading: true, error: null }))
            const result = await AuthService.signOut()
            if (!result.success) {
                update(state => ({
                    ...state,
                    loading: false,
                    error: result.error || 'Failed to sign out'
                }))
                return { success: false, error: result.error }
            }
            return { success: true }
        },
        isAuthenticated: () => {
            let user: User | null = null;
            subscribe(state => {
                user = state.user;
            })();
            return !!user;
        },
        isLoading: () => {
            let loading = true;
            subscribe(state => {
                loading = state.loading;
            })();
            return loading;
        },
        deleteAccount: async (): Promise<AuthResult> => {
            update(state => ({ ...state, loading: true, error: null }))
            const result = await AuthService.deleteAccount()
            if (!result.success) {
                update(state => ({
                    ...state,
                    loading: false,
                    error: result.error || 'Failed to delete account'
                }))
                return { success: false, error: result.error }
            }
            set({ user: null, loading: false, error: null })
            return { success: true }
        },
        resetPassword: async (email: string): Promise<boolean> => {
            update(state => ({ ...state, loading: true, error: null }))
            const result = await AuthService.resetPassword(email)
            if (!result.success) {
                update(state => ({
                    ...state,
                    loading: false,
                    error: result.error instanceof Error ? result.error.message : 'Failed to reset password'
                }))
                return false
            }
            return true
        }
    }
}

export const authStore = createAuthStore() 