import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type PlayerProfile = {
    id: string
    auth_user_id: string
    username: string
    display_name?: string
    avatar_url?: string
    created_at: string
    last_seen: string
    rating: number
    games_played: number
    games_won: number
    games_lost: number
    win_rate: number
}

export type Database = {
    public: {
        Tables: {
            player_profiles: {
                Row: PlayerProfile
                Insert: Omit<PlayerProfile, 'id' | 'created_at' | 'last_seen' | 'rating' | 'games_played' | 'games_won' | 'games_lost' | 'win_rate'>
                Update: Partial<Omit<PlayerProfile, 'id'>>
            }
        }
    }
} 