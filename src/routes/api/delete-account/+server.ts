import { json } from '@sveltejs/kit';
import { supabase } from '$lib/services/supabase';
import { createClient } from '@supabase/supabase-js';
import { VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

// Log environment variables
console.log('Environment variables:', {
    url: VITE_SUPABASE_URL,
    key: SUPABASE_SERVICE_ROLE_KEY?.slice(0, 10) + '...' // Only log first 10 chars of key for security
});

// Create admin client with service role key
const adminClient = createClient(
    VITE_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

console.log('Admin client created with URL:', VITE_SUPABASE_URL);

export async function POST({ request }) {
    try {
        // Get the session token from the request headers
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return json({ success: false, error: 'No authorization token provided' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        
        // Get the user's session using the token
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        if (userError || !user) {
            console.error('Error getting user:', userError);
            return json({ success: false, error: 'Invalid token' }, { status: 401 });
        }

        const userId = user.id;
        console.log('Deleting account for user:', userId);

        // Delete the user's profile
        const { error: profileError } = await supabase
            .from('player_profiles')
            .delete()
            .eq('auth_user_id', userId);

        if (profileError) {
            console.error('Error deleting profile:', profileError);
            return json({ success: false, error: 'Failed to delete profile' }, { status: 500 });
        }

        console.log('Profile deleted successfully');

        // Delete the user's auth account using admin client
        const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
        if (deleteError) {
            console.error('Error deleting auth user:', deleteError);
            return json({ success: false, error: 'Failed to delete account' }, { status: 500 });
        }

        console.log('Auth user deleted successfully');
        return json({ success: true });
    } catch (error) {
        console.error('Delete account error:', error);
        return json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Failed to delete account' 
        }, { status: 500 });
    }
} 