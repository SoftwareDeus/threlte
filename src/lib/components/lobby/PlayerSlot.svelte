<script lang="ts">
    import { resources } from '$lib/resources';
    import { ChessColor } from '$lib/types/chess';
    import { playerName } from '$lib/stores/playerStore';

    export let slotNumber: 1 | 2;
    export let player: string | undefined;
    export let color: ChessColor | undefined;
    export let isHost: boolean;
    export let onColorChange: (color: ChessColor) => void;
</script>

<div class="p-4 rounded-lg slot-bg" class:white-slot={color === ChessColor.White} class:black-slot={color === ChessColor.Black}>
    <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
            <span class="text-lg">{resources.ui.lobby.players[`slot${slotNumber}`]}:</span>
            <span class="text-{resources.config.colors.ui.text.secondary}">
                {player || resources.ui.lobby.players.waitingForPlayer}
            </span>
            {#if player === $playerName}
                <span class="text-{resources.config.colors.ui.success}">({resources.ui.labels.you})</span>
            {/if}
        </div>
        {#if isHost && player}
            <div class="flex gap-4">
                <input
                    type="radio"
                    id="slot{slotNumber}-white"
                    name="slot{slotNumber}-color"
                    value={ChessColor.White}
                    checked={color === ChessColor.White}
                    on:change={() => onColorChange(ChessColor.White)}
                    class="form-radio h-4 w-4 text-{resources.config.colors.ui.success} border-gray-600 focus:ring-{resources.config.colors.ui.success}"
                />
                <label for="slot{slotNumber}-white" class="text-white">{resources.ui.lobby.players.color.white}</label>

                <input
                    type="radio"
                    id="slot{slotNumber}-black"
                    name="slot{slotNumber}-color"
                    value={ChessColor.Black}
                    checked={color === ChessColor.Black}
                    on:change={() => onColorChange(ChessColor.Black)}
                    class="form-radio h-4 w-4 text-{resources.config.colors.ui.success} border-gray-600 focus:ring-{resources.config.colors.ui.success}"
                />
                <label for="slot{slotNumber}-black" class="text-white">{resources.ui.lobby.players.color.black}</label>

                <input
                    type="radio"
                    id="slot{slotNumber}-random"
                    name="slot{slotNumber}-color"
                    value={ChessColor.Random}
                    checked={color === ChessColor.Random}
                    on:change={() => onColorChange(ChessColor.Random)}
                    class="form-radio h-4 w-4 text-{resources.config.colors.ui.success} border-gray-600 focus:ring-{resources.config.colors.ui.success}"
                />
                <label for="slot{slotNumber}-random" class="text-white">{resources.ui.lobby.players.color.random}</label>
            </div>
        {/if}
    </div>
</div>

<style>
    .slot-bg {
        background-color: rgba(0, 0, 0, 0.2);
    }

    .white-slot {
        background-color: rgba(255, 255, 255, 0.1);
    }

    .black-slot {
        background-color: rgba(0, 0, 0, 0.2);
    }
</style> 