import { supabase } from './supabase'
import { playerStore } from '../stores/playerStore'

export class AuthService {
    static async signUp(email: string, password: string, username: string) {
        try {
            // Sign up the user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username
                    }
                }
            })

            if (authError) throw authError

            // Create the user's profile
            if (authData.user) {
                await playerStore.createProfile(username)
            }

            return { success: true, user: authData.user }
        } catch (error) {
            console.error('Sign up error:', error)
            return { success: false, error }
        }
    }

    static async signIn(email: string, password: string) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            })

            if (error) throw error

            // Load the user's profile
            if (data.user) {
                await playerStore.loadProfile(data.user.id)
            }

            return { success: true, user: data.user }
        } catch (error) {
            console.error('Sign in error:', error)
            return { success: false, error }
        }
    }

    static async signOut() {
        try {
            const { error } = await supabase.auth.signOut()
            if (error) throw error
            playerStore.clearProfile()
            return { success: true }
        } catch (error) {
            console.error('Sign out error:', error)
            return { success: false, error }
        }
    }

    static async getCurrentUser() {
        try {
            const { data: { user }, error } = await supabase.auth.getUser()
            if (error) throw error
            return { success: true, user }
        } catch (error) {
            console.error('Get current user error:', error)
            return { success: false, error }
        }
    }

    static async resetPassword(email: string) {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email)
            if (error) throw error
            return { success: true }
        } catch (error) {
            console.error('Reset password error:', error)
            return { success: false, error }
        }
    }
} 