<script lang="ts">
    import { resources } from '$lib/resources';

    export let isHost: boolean;
    export let minutes: number;
    export let increment: number;
    export let onMinutesChange: (value: number) => void;
    export let onIncrementChange: (value: number) => void;
    export let currentTimeControl: { minutes: number; increment: number } | undefined;
</script>

<div class="bg-white/10 rounded-lg p-6">
    <h2 class="text-2xl font-bold mb-4">{resources.ui.lobby.timeControl.title}</h2>
    <div class="space-y-4">
        {#if isHost}
            <div class="flex items-center gap-4">
                <label for="minutes-input" class="text-lg">{resources.ui.lobby.timeControl.minutesLabel}</label>
                <input
                    id="minutes-input"
                    type="number"
                    min="1"
                    max="60"
                    bind:value={minutes}
                    on:input={(e) => onMinutesChange(Number(e.currentTarget.value))}
                    class="w-20 px-2 py-1 bg-white/10 border border-white/20 rounded text-white"
                />
            </div>
            <div class="flex items-center gap-4">
                <label for="increment-input" class="text-lg">{resources.ui.lobby.timeControl.incrementLabel}</label>
                <input
                    id="increment-input"
                    type="number"
                    min="0"
                    max="60"
                    bind:value={increment}
                    on:input={(e) => onIncrementChange(Number(e.currentTarget.value))}
                    class="w-20 px-2 py-1 bg-white/10 border border-white/20 rounded text-white"
                />
            </div>
        {:else}
            <div class="flex items-center gap-4">
                <label for="minutes-display" class="text-lg">{resources.ui.lobby.timeControl.minutesLabel}</label>
                <span id="minutes-display" class="text-white">{currentTimeControl?.minutes || 10}</span>
            </div>
            <div class="flex items-center gap-4">
                <label for="increment-display" class="text-lg">{resources.ui.lobby.timeControl.incrementLabel}</label>
                <span id="increment-display" class="text-white">{currentTimeControl?.increment || 0}</span>
            </div>
        {/if}
    </div>
</div> 