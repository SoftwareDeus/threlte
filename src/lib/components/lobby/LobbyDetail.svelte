<script lang="ts">
    import { goto } from '$app/navigation';
    import { resources } from '$lib/resources';
    import { ChessColor } from '$lib/types/chess';
    import PlayerSlot from './PlayerSlot.svelte';
    import TimeControlSettings from './TimeControlSettings.svelte';

    interface Lobby {
        id: string;
        name: string;
        host: string;
        status: 'waiting' | 'playing';
        created: Date;
        slots: {
            slot1?: { player: string; color?: ChessColor };
            slot2?: { player: string; color?: ChessColor };
        };
        timeControl?: {
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
        return !!lobby.slots.slot1?.player && !!lobby.slots.slot2?.player;
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

    <div class="space-y-8">
        <!-- Players -->
        <div class="bg-white/10 rounded-lg p-6">
            <h2 class="text-2xl font-bold mb-4">{resources.ui.lobby.players.title}</h2>
            <div class="space-y-4">
                <PlayerSlot
                    slotNumber={1}
                    player={lobby.slots.slot1?.player}
                    color={lobby.slots.slot1?.color}
                    isHost={isHost}
                    onColorChange={(color) => onColorChange(1, color)}
                />

                <PlayerSlot
                    slotNumber={2}
                    player={lobby.slots.slot2?.player}
                    color={lobby.slots.slot2?.color}
                    isHost={isHost}
                    onColorChange={(color) => onColorChange(2, color)}
                />

                {#if isHost && isFull()}
                    <div class="flex justify-end mt-4">
                        <button
                            on:click={onRandomize}
                            class="px-4 py-2 bg-[#4CAF50] text-white rounded hover:bg-[#45a049] transition-colors"
                        >
                            {resources.ui.buttons.randomize}
                        </button>
                    </div>
                {/if}
            </div>
        </div>

        <!-- Time Control -->
        <TimeControlSettings
            isHost={isHost}
            minutes={minutes}
            increment={increment}
            onMinutesChange={onMinutesChange}
            onIncrementChange={onIncrementChange}
            currentTimeControl={lobby.timeControl}
        />

        <!-- Action Buttons -->
        <div class="flex justify-end gap-4">
            <button
                on:click={onDelete}
                class="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
                {isHost ? resources.ui.buttons.delete : resources.ui.buttons.leave}
            </button>
            {#if isHost && isFull()}
                <button
                    on:click={onStart}
                    class="px-6 py-2 bg-[#4CAF50] text-white rounded hover:bg-[#45a049] transition-colors"
                >
                    {resources.ui.buttons.start}
                </button>
            {/if}
        </div>
    </div>
</div> 