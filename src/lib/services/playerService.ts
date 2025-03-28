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

    static async createProfile(username: string, avatar_url?: string): Promise<PlayerProfile | null> {
        const { data, error } = await supabase
            .from('player_profiles')
            .insert([
                {
                    username,
                    avatar_url,
                    rating: 1000, // Default rating
                    games_played: 0,
                    games_won: 0,
                    games_lost: 0,
                    win_rate: 0
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
        const { data, error } = await supabase
            .from('player_profiles')
            .select('*')
            .eq('id', userId)
            .single()

        if (error) {
            console.error('Error fetching profile:', error)
            return null
        }

        return data
    }

    static async updateProfile(userId: string, updates: Partial<PlayerProfile>): Promise<PlayerProfile | null> {
        const { data, error } = await supabase
            .from('player_profiles')
            .update(updates)
            .eq('id', userId)
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