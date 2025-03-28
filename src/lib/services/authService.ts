import { supabase } from './supabase'
import { playerStore } from '../stores/playerStore'
import { PlayerService } from './playerService'

export class AuthService {
    static async signUp(email: string, password: string, displayName: string): Promise<{ success: boolean; error?: string }> {
        try {
            console.log('Starting signup process for email:', email);
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        display_name: displayName
                    }
                }
            });

            if (error) {
                console.error('Signup error:', error);
                throw error;
            }

            if (data.user) {
                console.log('User created successfully, creating profile for ID:', data.user.id);
                // Create profile with the user's ID and display name
                const profile = await PlayerService.createProfile(data.user.id, email.split('@')[0], displayName);
                if (!profile) {
                    console.error('Failed to create profile during signup');
                    throw new Error('Failed to create profile');
                }
                console.log('Profile created successfully:', profile);
            }

            return { success: true };
        } catch (error) {
            console.error('Sign up error:', error);
            return { 
                success: false, 
                error: error instanceof Error ? error.message : 'Failed to sign up' 
            };
        }
    }

    static async signIn(email: string, password: string) {
        try {
            console.log('Starting sign in process');
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                console.error('Sign in error:', error);
                throw error;
            }

            if (!data.user) {
                console.error('No user data returned from sign in');
                throw new Error('No user data returned from sign in');
            }

            console.log('User signed in successfully, ID:', data.user.id);
            
            // First check if there's a profile with this auth_user_id
            const { data: existingProfile, error: profileError } = await supabase
                .from('player_profiles')
                .select('*')
                .eq('auth_user_id', data.user.id)
                .maybeSingle();

            if (!existingProfile) {
                // Create new profile with email prefix and display name from metadata
                console.log('No profile found, creating new profile with email prefix');
                const displayName = data.user.user_metadata?.display_name || email.split('@')[0];
                const newProfile = await PlayerService.createProfile(data.user.id, email.split('@')[0], displayName);
                if (newProfile) {
                    console.log('Created new profile:', newProfile);
                }
            }

            // Load the final profile state
            const profile = await PlayerService.getProfile(data.user.id);
            if (profile) {
                console.log('Final profile state:', profile);
            }

            return { success: true, user: data.user };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error };
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

    static async deleteAccount(): Promise<{ success: boolean; error?: string }> {
        try {
            console.log('Starting account deletion process');
            
            // Get the current session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) {
                throw new Error('Not authenticated');
            }

            // Call the server endpoint to delete the account
            const response = await fetch('/api/delete-account', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to delete account');
            }

            // Sign out after successful deletion
            const { error: signOutError } = await supabase.auth.signOut();
            if (signOutError) {
                console.error('Error signing out:', signOutError);
                throw new Error('Failed to sign out');
            }

            return { success: true };
        } catch (error) {
            console.error('Delete account error:', error);
            return { 
                success: false, 
                error: error instanceof Error ? error.message : 'Failed to delete account' 
            };
        }
    }
} 