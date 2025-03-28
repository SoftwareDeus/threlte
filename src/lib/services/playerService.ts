import { supabase, type PlayerProfile } from './supabase'

export class PlayerService {
    static async testConnection(): Promise<boolean> {
        try {
            const { data, error } = await supabase.from('player_profiles').select('count').limit(1)
            if (error) throw error
            return true
        } catch (error) {
            console.error('Supabase connection test failed:', error)
            return false
        }
    }

    static async createTestProfile(): Promise<boolean> {
        try {
            const { data, error } = await supabase
                .from('player_profiles')
                .insert([
                    {
                        username: 'test_user_' + Date.now(),
                        rating: 1000,
                        games_played: 0,
                        games_won: 0,
                        games_lost: 0,
                        win_rate: 0
                    }
                ])
                .select()
            
            if (error) throw error
            return true
        } catch (error) {
            console.error('Test profile creation failed:', error)
            return false
        }
    }

    static async createProfile(userId: string, username: string, avatar_url?: string): Promise<PlayerProfile | null> {
        console.log('Creating profile for user:', userId, 'with username:', username);
        
        // Check if profile already exists
        const existingProfile = await this.getProfile(userId);
        if (existingProfile) {
            console.log('Profile already exists, updating instead');
            // If profile exists, update it instead of creating a new one
            return this.updateProfile(userId, {
                username,
                avatar_url,
                last_seen: new Date().toISOString()
            });
        }

        // Check if username is already taken
        const { data: existingUsername, error: usernameError } = await supabase
            .from('player_profiles')
            .select('id')
            .eq('username', username)
            .maybeSingle();

        if (usernameError) {
            console.error('Error checking username:', usernameError);
            return null;
        }

        if (existingUsername) {
            console.error('Username already taken:', username);
            return null;
        }

        console.log('Inserting new profile');
        const { data, error } = await supabase
            .from('player_profiles')
            .insert([
                {
                    auth_user_id: userId,
                    username,
                    avatar_url,
                    rating: 1000, // Default rating
                    games_played: 0,
                    games_won: 0,
                    games_lost: 0,
                    win_rate: 0,
                    last_seen: new Date().toISOString()
                }
            ])
            .select()
            .single()

        if (error) {
            console.error('Error creating profile:', error)
            return null
        }

        return data
    }

    static async getProfile(userId: string): Promise<PlayerProfile | null> {
        console.log('Getting profile for user ID:', userId);
        
        // Get profile by auth user ID
        const { data: profile, error } = await supabase
            .from('player_profiles')
            .select('*')
            .eq('auth_user_id', userId)
            .maybeSingle();

        if (error) {
            console.error('Error fetching profile:', error);
            return null;
        }

        if (!profile) {
            console.log('No profile found for user ID:', userId);
            return null;
        }

        console.log('Profile found:', profile);
        return profile;
    }

    static async updateProfile(userId: string, updates: Partial<PlayerProfile>): Promise<PlayerProfile | null> {
        // Get the current user's ID
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            console.error('Error getting user:', userError);
            return null;
        }

        // Get the current profile to check auth_user_id
        const currentProfile = await this.getProfile(userId);
        if (!currentProfile) {
            console.error('Profile not found');
            return null;
        }

        // Ensure we're only updating the user's own profile
        if (currentProfile.auth_user_id !== user.id) {
            console.error('Cannot update another user\'s profile');
            return null;
        }

        // If display_name is being updated, ensure it's not empty
        if ('display_name' in updates && !updates.display_name) {
            delete updates.display_name;
        }

        const { data, error } = await supabase
            .from('player_profiles')
            .update(updates)
            .eq('auth_user_id', userId)
            .select()
            .single()

        if (error) {
            console.error('Error updating profile:', error)
            return null
        }

        return data
    }

    static async updateGameStats(userId: string, won: boolean): Promise<PlayerProfile | null> {
        const profile = await this.getProfile(userId)
        if (!profile) return null

        const updates = {
            games_played: profile.games_played + 1,
            games_won: profile.games_won + (won ? 1 : 0),
            games_lost: profile.games_lost + (won ? 0 : 1),
            win_rate: ((profile.games_won + (won ? 1 : 0)) / (profile.games_played + 1)) * 100,
            last_seen: new Date().toISOString()
        }

        return this.updateProfile(userId, updates)
    }

    static async updateRating(userId: string, newRating: number): Promise<PlayerProfile | null> {
        return this.updateProfile(userId, {
            rating: newRating,
            last_seen: new Date().toISOString()
        })
    }
} 