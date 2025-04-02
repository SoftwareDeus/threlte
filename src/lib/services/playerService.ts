import { supabase, type PlayerProfile } from './supabase';

export class PlayerService {
	static async testConnection(): Promise<boolean> {
		try {
			const { error } = await supabase.from('player_profiles').select('count').limit(1);
			if (error) throw error;
			return true;
		} catch (error) {
			console.error('Supabase connection test failed:', error);
			return false;
		}
	}

	static async createTestProfile(): Promise<boolean> {
		try {
			const { error } = await supabase
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
				.select();

			if (error) throw error;
			return true;
		} catch (error) {
			console.error('Test profile creation failed:', error);
			return false;
		}
	}

	static async createProfile(
		authUserId: string,
		username: string,
		displayName: string,
		avatar_url?: string
	): Promise<PlayerProfile | null> {
		console.log('Creating profile for user:', authUserId, 'with username:', username);

		const existingProfile = await this.getProfile(authUserId);
		if (existingProfile) {
			console.log('Profile already exists, updating instead');
			return this.updateProfile(authUserId, {
				username,
				display_name: displayName,
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
					auth_user_id: authUserId,
					username,
					display_name: displayName,
					avatar_url,
					rating: 1000,
					games_played: 0,
					games_won: 0,
					games_lost: 0,
					win_rate: 0,
					last_seen: new Date().toISOString()
				}
			])
			.select()
			.single();

		if (error) {
			console.error('Error creating profile:', error);
			return null;
		}

		return data;
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

	static async updateProfile(
		userId: string,
		updates: Partial<PlayerProfile>
	): Promise<PlayerProfile | null> {
		const {
			data: { user },
			error: userError
		} = await supabase.auth.getUser();
		if (userError || !user) {
			console.error('Error getting user:', userError);
			return null;
		}

		const currentProfile = await this.getProfile(userId);
		if (!currentProfile) {
			console.error('Profile not found');
			return null;
		}

		if (currentProfile.auth_user_id !== user.id) {
			console.error("Cannot update another user's profile");
			return null;
		}

		if ('display_name' in updates && !updates.display_name) {
			delete updates.display_name;
		}

		const { data, error } = await supabase
			.from('player_profiles')
			.update(updates)
			.eq('auth_user_id', userId)
			.select()
			.single();

		if (error) {
			console.error('Error updating profile:', error);
			return null;
		}

		return data;
	}

	static async updateGameStats(userId: string, won: boolean): Promise<PlayerProfile | null> {
		const profile = await this.getProfile(userId);
		if (!profile) return null;

		const updates = {
			games_played: profile.games_played + 1,
			games_won: profile.games_won + (won ? 1 : 0),
			games_lost: profile.games_lost + (won ? 0 : 1),
			win_rate: ((profile.games_won + (won ? 1 : 0)) / (profile.games_played + 1)) * 100,
			last_seen: new Date().toISOString()
		};

		return this.updateProfile(userId, updates);
	}

	static async updateRating(userId: string, newRating: number): Promise<PlayerProfile | null> {
		return this.updateProfile(userId, {
			rating: newRating,
			last_seen: new Date().toISOString()
		});
	}
}
