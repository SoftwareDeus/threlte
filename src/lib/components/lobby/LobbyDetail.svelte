<script lang="ts">
    import { goto } from '$app/navigation';
    import { resources } from '$lib/resources';
    import { ChessColor } from '$lib/types/chess';
    import PlayerSlot from './PlayerSlot.svelte';
    import TimeControlSettings from './TimeControlSettings.svelte';

    interface Lobby {
        id: string;
        name: string;
        host_id: string;
        player2_id?: string;
        status: 'waiting' | 'playing';
        created: string;
        time_control?: {
            minutes: number;
            increment: number;
        };
    }

    export let lobby: Lobby;
    export let isHost: boolean;
    export let minutes: number;
    export let increment: number;
    export let onMinutesChange: (value: number) => void;
    export let onIncrementChange: (value: number) => void;
    export let onColorChange: (slot: 1 | 2, color: ChessColor) => void;
    export let onStart: () => void;
    export let onDelete: () => void;
    export let onRandomize: () => void;

    function isFull(): boolean {
        return !!lobby.player2_id;
    }
</script>

<div class="max-w-4xl mx-auto">
    <div class="flex justify-between items-center mb-8">
        <h1 class="text-4xl font-bold">{lobby.name || resources.ui.labels.loading}</h1>
        <button
            on:click={() => goto('/lobby')}
            class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
            {resources.ui.labels.backToLobbies}
        </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div class="space-y-6">
            <h2 class="text-2xl font-semibold">{resources.ui.lobby.players.title}</h2>
            
            <PlayerSlot
                slotNumber={1}
                player={lobby.host_id}
                color={ChessColor.White}
                onColorChange={(color) => onColorChange(1, color)}
                isHost={true}
            />

            <PlayerSlot
                slotNumber={2}
                player={lobby.player2_id}
                color={ChessColor.Black}
                onColorChange={(color) => onColorChange(2, color)}
                isHost={false}
            />
        </div>

        <div class="space-y-6">
            <TimeControlSettings
                isHost={isHost}
                {minutes}
                {increment}
                onMinutesChange={onMinutesChange}
                onIncrementChange={onIncrementChange}
                currentTimeControl={lobby.time_control}
            />

            <div class="flex gap-4">
                {#if isHost}
                    <button
                        on:click={onStart}
                        class="flex-1 px-6 py-3 bg-[#4CAF50] text-white rounded-lg hover:bg-[#45a049] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!isFull()}
                    >
                        Start Game
                    </button>
                    <button
                        on:click={onDelete}
                        class="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                        Delete Lobby
                    </button>
                {:else}
                    <button
                        on:click={onRandomize}
                        class="flex-1 px-6 py-3 bg-[#2196F3] text-white rounded-lg hover:bg-[#1976D2] transition-colors"
                    >
                        Randomize Colors
                    </button>
                {/if}
            </div>
        </div>
    </div>
</div> 