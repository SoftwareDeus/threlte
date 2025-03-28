import { supabase } from './supabase'
import { playerStore } from '../stores/playerStore'
import { PlayerService } from './playerService'

export class AuthService {
    static async signUp(email: string, password: string, username: string): Promise<{ success: boolean; error?: string }> {
        try {
            console.log('Starting signup process for username:', username);
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username
                    }
                }
            });

            if (error) {
                console.error('Signup error:', error);
                throw error;
            }

            if (data.user) {
                console.log('User created successfully, creating profile for ID:', data.user.id);
                // Create profile with the user's ID
                const profile = await PlayerService.createProfile(data.user.id, username);
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
            
            // First try to sign in with email
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

            if (existingProfile) {
                console.log('Found existing profile by auth_user_id:', existingProfile);
            } else {
                // If no profile found by auth_user_id, check user metadata for username
                const username = data.user.user_metadata?.username;
                if (username) {
                    console.log('Checking for profile with username from metadata:', username);
                    const { data: profileByUsername, error: usernameError } = await supabase
                        .from('player_profiles')
                        .select('*')
                        .eq('username', username)
                        .maybeSingle();

                    if (profileByUsername) {
                        console.log('Found existing profile by username, updating auth_user_id:', profileByUsername);
                        // Update the profile to use the current auth user ID
                        const { data: updatedProfile, error: updateError } = await supabase
                            .from('player_profiles')
                            .update({ auth_user_id: data.user.id })
                            .eq('id', profileByUsername.id)
                            .select()
                            .single();

                        if (updateError) {
                            console.error('Error updating profile auth_user_id:', updateError);
                        } else {
                            console.log('Profile updated successfully:', updatedProfile);
                        }
                    } else {
                        // No existing profile found, create a new one
                        console.log('No existing profile found, creating new one');
                        const newProfile = await PlayerService.createProfile(data.user.id, username);
                        if (newProfile) {
                            console.log('Created new profile:', newProfile);
                        }
                    }
                } else {
                    // No username in metadata, create new profile with email prefix
                    console.log('No username in metadata, creating new profile with email prefix');
                    const newProfile = await PlayerService.createProfile(data.user.id, email.split('@')[0]);
                    if (newProfile) {
                        console.log('Created new profile:', newProfile);
                    }
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
} 