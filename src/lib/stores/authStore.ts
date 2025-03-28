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
        signUp: async (email: string, password: string, displayName: string) => {
            update(state => ({ ...state, loading: true, error: null }))
            const result = await AuthService.signUp(email, password, displayName)
            if (!result.success) {
                update(state => ({
                    ...state,
                    loading: false,
                    error: result.error instanceof Error ? result.error.message : 'An unknown error occurred'
                }))
                return { success: false, error: result.error }
            }
            return { success: true }
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
                return { success: false }
            }
            return { success: true }
        },
        signOut: async () => {
            update(state => ({ ...state, loading: true, error: null }))
            try {
                const result = await supabase.auth.signOut()
                if (result.error) throw result.error
                playerStore.clearProfile()
                set({ user: null, loading: false, error: null })
                return { error: null }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Failed to sign out'
                set({ user: null, loading: false, error: errorMessage })
                return { error: errorMessage }
            }
        },
        deleteAccount: async () => {
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