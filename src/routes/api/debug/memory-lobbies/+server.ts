import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getLobbies, updateLobby } from '$lib/scripts/lobbyStore';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';

// Debug endpoint to view and sync in-memory lobbies with database
export const GET: RequestHandler = async () => {
    try {
        // Get in-memory lobbies
        const memoryLobbies = getLobbies();
        
        // Get database lobbies
        const { data: dbLobbies, error } = await supabaseAdmin
            .from('lobbies')
            .select('*')
            .order('created', { ascending: false });
            
        if (error) {
            console.error('Error fetching lobbies from database:', error);
            return json({ 
                error: 'Failed to fetch lobbies from database',
                details: error 
            }, { status: 500 });
        }
        
        // Attempt to sync any missing lobbies
        if (dbLobbies && dbLobbies.length > 0) {
            let syncedCount = 0;
            
            for (const dbLobby of dbLobbies) {
                const memoryLobby = memoryLobbies.find(ml => ml.id === dbLobby.id);
                
                if (!memoryLobby) {
                    // Lobby exists in DB but not in memory - add it
                    updateLobby(dbLobby.id, dbLobby);
                    syncedCount++;
                }
            }
            
            // Return state information
            return json({
                memoryLobbiesCount: memoryLobbies.length,
                dbLobbiesCount: dbLobbies.length,
                memoryLobbies: memoryLobbies,
                dbLobbies: dbLobbies,
                syncedCount: syncedCount
            });
        }
        
        return json({
            memoryLobbiesCount: memoryLobbies.length,
            dbLobbiesCount: dbLobbies?.length || 0,
            memoryLobbies: memoryLobbies,
            dbLobbies: dbLobbies || []
        });
    } catch (error) {
        console.error('Error in memory-lobbies debug endpoint:', error);
        return json({ 
            error: 'Debug endpoint error',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}; 