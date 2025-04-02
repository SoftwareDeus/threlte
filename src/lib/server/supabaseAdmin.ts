import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private'; // Import private env variables

const supabaseUrl = env.VITE_SUPABASE_URL; // Can reuse public URL
const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
	throw new Error('Missing environment variable: VITE_SUPABASE_URL');
}
if (!supabaseServiceRoleKey) {
	throw new Error('Missing environment variable: SUPABASE_SERVICE_ROLE_KEY');
}

// Create the admin client using the service role key
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
	auth: {
		// Important: Prevent client from persisting auth state server-side
		persistSession: false,
		// Supabase client expects this, but service role doesn't use auto-refresh
		autoRefreshToken: false
	}
});
