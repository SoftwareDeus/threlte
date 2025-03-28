import { supabase } from './supabase';
import { resources } from '$lib/resources';
import type { Lobby } from '$lib/types/chess';

export async function getLobbies(): Promise<Lobby[]> {
    const { data, error } = await supabase
        .from('lobbies')
        .select('*')
        .order('created', { ascending: false });

    if (error) {
        throw new Error(resources.errors.common.fetchFailed);
    }

    return data || [];
}

export async function createLobby(userId: string, name: string): Promise<Lobby> {
    console.log('Creating lobby with:', { userId, name });
    
    const { data, error } = await supabase
        .from('lobbies')
        .insert([
            {
                name,
                host_id: userId,
                status: 'waiting'
            }
        ])
        .select()
        .single();

    if (error) {
        console.error('Supabase error:', error);
        throw new Error(resources.errors.common.createFailed);
    }

    console.log('Created lobby:', data);
    return data;
}

export async function getLobby(id: string): Promise<Lobby> {
    const { data, error } = await supabase
        .from('lobbies')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (error) {
        console.error('Supabase error:', error);
        throw new Error(resources.errors.common.fetchFailed);
    }

    if (!data) {
        throw new Error(resources.errors.server.validation.lobbyNotFound);
    }

    return data;
}

export async function deleteLobby(id: string, userId: string): Promise<void> {
    const { error } = await supabase
        .from('lobbies')
        .delete()
        .eq('id', id)
        .eq('host_id', userId);

    if (error) {
        throw new Error(resources.errors.common.deleteFailed);
    }
}

export async function startLobby(id: string, userId: string, timeControl: { minutes: number; increment: number }): Promise<Lobby> {
    const { data, error } = await supabase
        .from('lobbies')
        .update({
            status: 'playing',
            time_control: timeControl
        })
        .eq('id', id)
        .eq('host_id', userId)
        .select()
        .single();

    if (error) {
        throw new Error(resources.errors.common.startFailed);
    }

    return data;
}

export async function randomizeLobby(id: string, playerName: string): Promise<Lobby> {
    const response = await fetch(`/api/lobbies/${id}/randomize`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ playerName })
    });
    if (!response.ok) {
        throw new Error(resources.errors.common.updateFailed);
    }
    return response.json();
}

export async function setPlayerColor(id: string, playerName: string, targetPlayer: string, color: string): Promise<Lobby> {
    const response = await fetch(`/api/lobbies/${id}/set-color`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ playerName, targetPlayer, color })
    });
    if (!response.ok) {
        throw new Error(resources.errors.common.updateFailed);
    }
    return response.json();
}

export async function updateTimeSettings(id: string, playerName: string, timeControl: { minutes: number; increment: number }): Promise<Lobby> {
    const response = await fetch(`/api/lobbies/${id}/time-settings`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ playerName, timeControl })
    });
    if (!response.ok) {
        throw new Error(resources.errors.common.updateFailed);
    }
    return response.json();
}

export async function joinLobby(id: string, userId: string): Promise<Lobby> {
    const { data, error } = await supabase
        .from('lobbies')
        .update({
            player2_id: userId,
            status: 'waiting'
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        throw new Error(resources.errors.common.joinFailed);
    }

    return data;
} 