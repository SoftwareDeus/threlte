<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { goto } from '$app/navigation';
    import { playerName } from '$lib/stores/playerStore';
    import { lobbyId } from '$lib/stores/lobbyStore';
    import { resources } from '$lib/resources';
    import { ChessColor } from '$lib/types/chess';
    import * as Sentry from '@sentry/sveltekit';

    interface Lobby {
        id: string;
        name: string;
        host: string;
        status: 'waiting' | 'playing';
        created: Date;
        slots: {
            slot1?: {
                player?: string;
                color: ChessColor;
            };
            slot2?: {
                player?: string;
                color: ChessColor;
            };
        };
        timeControl?: {
            minutes: number;
            increment: number;
        };
    }

    export let lobbies: Lobby[] = [];
    export let onDeleteConfirm: (id: string) => void;
    export let onDeleteCancel: () => void;
    export let onDelete: () => void;
    export let onJoin: (id: string) => void;
    export let onStart: (id: string) => void;
    export let deleteConfirmId: string | null = null;

    function isHost(lobby: Lobby): boolean {
        return lobby.host === $playerName;
    }

    function isJoined(lobby: Lobby): boolean {
        return lobby.slots?.slot1?.player === $playerName || lobby.slots?.slot2?.player === $playerName;
    }
</script>

<div class="space-y-4 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
    {#each lobbies as lobby, index (lobby.id)}
        {#if deleteConfirmId === lobby.id}
            <div class="bg-white/10 rounded-lg p-4 h-[100px] flex items-center">
                <div class="w-full flex justify-between items-center">
                    <div class="w-16 text-center text-white/50">
                        {index + 1}
                    </div>
                    <div class="flex-1 text-center">
                        <h3 class="text-xl font-bold mb-2">{resources.ui.labels.confirmDelete}</h3>
                        <p class="text-white/70">{resources.ui.labels.confirmDeleteMessage}</p>
                    </div>
                    <div class="w-48 flex justify-end gap-2">
                        <button
                            on:click={onDeleteCancel}
                            class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                        >
                            {resources.ui.buttons.cancel}
                        </button>
                        <button
                            on:click={onDelete}
                            class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                        >
                            {resources.ui.buttons.delete}
                        </button>
                    </div>
                </div>
            </div>
        {:else}
            <div class="bg-white/10 rounded-lg p-4 hover:bg-white/20 transition-colors h-[100px] flex items-center">
                <div class="w-full flex justify-between items-center">
                    <div class="w-16 text-center text-white/50">
                        {index + 1}
                    </div>
                    <div class="flex-1">
                        <h3 class="text-xl font-bold">{lobby.name}</h3>
                        <p class="text-white/70">
                            {resources.ui.labels.host}: {lobby.host}
                            {#if isHost(lobby)}
                                <span class="text-[#4CAF50] ml-2">({resources.ui.labels.you})</span>
                            {/if}
                        </p>
                        <div class="text-sm text-white/50 mt-1">
                            {#if lobby.slots.slot1?.player}
                                <span class="mr-2">Slot 1: {lobby.slots.slot1.player} ({lobby.slots.slot1.color})</span>
                            {/if}
                            {#if lobby.slots.slot2?.player}
                                <span>Slot 2: {lobby.slots.slot2.player} ({lobby.slots.slot2.color})</span>
                            {/if}
                        </div>
                    </div>
                    <div class="w-48 flex justify-end gap-2">
                        {#if isHost(lobby)}
                            {#if lobby.slots?.slot1?.player && lobby.slots?.slot2?.player}
                                <button
                                    on:click={() => onStart(lobby.id)}
                                    class="px-4 py-2 bg-[#4CAF50] text-white rounded hover:bg-[#45a049] transition-colors"
                                >
                                    {resources.ui.buttons.start}
                                </button>
                            {/if}
                            <button
                                on:click={() => onDeleteConfirm(lobby.id)}
                                class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                            >
                                {resources.ui.buttons.delete}
                            </button>
                        {:else if isJoined(lobby)}
                            <button
                                on:click={() => onDeleteConfirm(lobby.id)}
                                class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                            >
                                {resources.ui.buttons.leave}
                            </button>
                        {:else if lobby.slots?.slot1?.player && lobby.slots?.slot2?.player}
                            <span class="px-4 py-2 bg-gray-500 text-white rounded">
                                {resources.ui.labels.full}
                            </span>
                            <button
                                on:click={() => onDeleteConfirm(lobby.id)}
                                class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                            >
                                {resources.ui.buttons.delete}
                            </button>
                        {:else}
                            <button
                                on:click={() => onJoin(lobby.id)}
                                class="px-4 py-2 bg-[#4CAF50] text-white rounded hover:bg-[#45a049] transition-colors"
                            >
                                {resources.ui.buttons.join}
                            </button>
                            <button
                                on:click={() => onDeleteConfirm(lobby.id)}
                                class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                            >
                                {resources.ui.buttons.delete}
                            </button>
                        {/if}
                    </div>
                </div>
            </div>
        {/if}
    {/each}
</div>

<style>
    .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
    }

    .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.3);
    }
</style> 