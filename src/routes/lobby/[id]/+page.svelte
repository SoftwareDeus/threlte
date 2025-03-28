<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { playerName } from '$lib/stores/playerStore';
    import { lobbyId } from '$lib/stores/lobbyStore';
    import { resources } from '$lib/resources';
    import { ChessColor } from '$lib/types/chess';
    import type { ColorSelection } from '$lib/types/chess';
    import * as Sentry from '@sentry/sveltekit';

    interface Lobby {
        id: string;
        name: string;
        host: string;
        status: 'waiting' | 'playing';
        created: Date;
        slots: {
            slot1?: { player: string; color?: ColorSelection };
            slot2?: { player: string; color?: ColorSelection };
        };
        timeControl?: {
            minutes: number;
            increment: number;
        };
    }

    let lobby: Lobby | null = null;
    let error = '';
    let interval: ReturnType<typeof setInterval>;
    let minutes = 10;
    let increment = 0;
    let updateTimeout: ReturnType<typeof setTimeout>;

    onMount(async () => {
        try {
            if (!$playerName) {
                Sentry.captureMessage('Missing player name', {
                    level: 'error',
                    extra: {
                        errorMessage: resources.errors.common.nameRequired
                    }
                });
                error = resources.errors.common.nameRequired;
                setTimeout(() => goto('/'), 2000);
                return;
            }

            if (!lobbyId) {
                Sentry.captureMessage('Missing lobby ID', {
                    level: 'error',
                    extra: {
                        errorMessage: resources.errors.common.genericError
                    }
                });
                error = resources.errors.common.genericError;
                setTimeout(() => goto('/lobby'), 2000);
                return;
            }

            await fetchLobby();
            interval = setInterval(fetchLobby, 1000);
        } catch (error) {
            Sentry.captureException(error, {
                extra: {
                    errorMessage: resources.errors.common.fetchFailed
                }
            });
            error = resources.errors.common.fetchFailed;
        }
    });

    function isValidTimeControl() {
        const mins = Number(minutes);
        const inc = Number(increment);
        return !isNaN(mins) && !isNaN(inc) && 
               mins >= 1 && mins <= 60 && 
               inc >= 0 && inc <= 60;
    }

    async function updateTimeSettings() {
        if (!$playerName) {
            Sentry.captureMessage('Missing player name', {
                level: 'error',
                extra: {
                    errorMessage: resources.errors.common.nameRequired
                }
            });
            error = resources.errors.common.nameRequired;
            setTimeout(() => goto('/'), 2000);
            return;
        }

        if (!lobbyId) {
            Sentry.captureMessage('Missing lobby ID', {
                level: 'error',
                extra: {
                    errorMessage: resources.errors.common.genericError
                }
            });
            error = resources.errors.common.genericError;
            setTimeout(() => goto('/lobby'), 2000);
            return;
        }

        if (!lobby) {
            Sentry.captureMessage('Lobby not found', {
                level: 'error',
                extra: {
                    errorMessage: resources.errors.common.genericError
                }
            });
            error = resources.errors.common.genericError;
            return;
        }

        const mins = Number(minutes);
        const inc = Number(increment);

        if (isNaN(mins) || isNaN(inc) || mins < 1 || mins > 60 || inc < 0 || inc > 60) {
            error = resources.errors.server.validation.invalidTimeControl;
            return;
        }

        try {
            const response = await fetch(`/api/lobbies/${lobby.id}/time-settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    playerName: $playerName,
                    timeControl: { minutes: mins, increment: inc }
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || resources.errors.common.updateFailed);
            }

            const updatedLobby = await response.json();
            lobby = updatedLobby;
        } catch (e) {
            Sentry.captureException(e, {
                extra: {
                    errorMessage: resources.errors.common.updateFailed
                }
            });
            console.error(e);
            error = e instanceof Error ? e.message : resources.errors.common.updateFailed;
        }
    }

    // Watch for changes in timeControl and update the lobby with debounce
    $: if (isHost() && lobby && isValidTimeControl() && lobby.status === 'waiting') {
        if (updateTimeout) clearTimeout(updateTimeout);
        updateTimeout = setTimeout(updateTimeSettings, 500);
    }

    async function fetchLobby() {
        try {
            const response = await fetch(`/api/lobbies/${$page.params.id}`);
            if (!response.ok) {
                throw new Error(resources.errors.common.fetchFailed);
            }
            const data = await response.json();
            lobby = data;

            // If the game has started, redirect to the game
            if (data.status === 'playing') {
                // Set the lobbyId in the store before redirecting
                lobbyId.set(data.id);
                goto('/game');
            }
        } catch (e) {
            Sentry.captureException(e, {
                extra: {
                    errorMessage: resources.errors.common.fetchFailed
                }
            });
            console.error(e);
            error = resources.errors.common.fetchFailed;
        }
    }

    async function startGame() {
        if (!$playerName) {
            Sentry.captureMessage('Missing player name', {
                level: 'error',
                extra: {
                    errorMessage: resources.errors.common.nameRequired
                }
            });
            error = resources.errors.common.nameRequired;
            setTimeout(() => goto('/'), 2000);
            return;
        }

        if (!lobbyId) {
            Sentry.captureMessage('Missing lobby ID', {
                level: 'error',
                extra: {
                    errorMessage: resources.errors.common.genericError
                }
            });
            error = resources.errors.common.genericError;
            setTimeout(() => goto('/lobby'), 2000);
            return;
        }

        if (!lobby) {
            Sentry.captureMessage('Lobby not found', {
                level: 'error',
                extra: {
                    errorMessage: resources.errors.common.genericError
                }
            });
            error = resources.errors.common.genericError;
            return;
        }

        try {
            // If either player has random selected, randomize colors before starting
            if (lobby.slots.slot1?.color === ChessColor.Random || lobby.slots.slot2?.color === ChessColor.Random) {
                await randomizePlayers();
            }

            const response = await fetch(`/api/lobbies/${lobby.id}/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    playerName: $playerName,
                    timeControl: { minutes, increment }
                })
            });

            if (!response.ok) {
                throw new Error(resources.errors.common.startFailed);
            }

            // Set the lobbyId in the store before redirecting
            lobbyId.set(lobby.id);
            goto('/game');
        } catch (e) {
            Sentry.captureException(e, {
                extra: {
                    errorMessage: resources.errors.common.startFailed
                }
            });
            console.error(e);
            error = resources.errors.common.startFailed;
        }
    }

    async function randomizePlayers() {
        if (!$playerName) {
            Sentry.captureMessage('Missing player name', {
                level: 'error',
                extra: {
                    errorMessage: resources.errors.common.nameRequired
                }
            });
            error = resources.errors.common.nameRequired;
            setTimeout(() => goto('/'), 2000);
            return;
        }

        if (!lobbyId) {
            Sentry.captureMessage('Missing lobby ID', {
                level: 'error',
                extra: {
                    errorMessage: resources.errors.common.genericError
                }
            });
            error = resources.errors.common.genericError;
            setTimeout(() => goto('/lobby'), 2000);
            return;
        }

        if (!lobby) {
            Sentry.captureMessage('Lobby not found', {
                level: 'error',
                extra: {
                    errorMessage: resources.errors.common.genericError
                }
            });
            error = resources.errors.common.genericError;
            return;
        }

        try {
            const response = await fetch(`/api/lobbies/${lobby.id}/randomize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    playerName: $playerName
                })
            });

            if (!response.ok) {
                throw new Error(resources.errors.common.updateFailed);
            }

            const updatedLobby = await response.json();
            lobby = updatedLobby;
        } catch (e) {
            Sentry.captureException(e, {
                extra: {
                    errorMessage: resources.errors.common.updateFailed
                }
            });
            console.error(e);
            error = resources.errors.common.updateFailed;
        }
    }

    function handleRandomClick() {
        if (lobby?.slots.slot1?.player && lobby?.slots.slot2?.player) {
            randomizePlayers();
        }
    }

    async function setPlayerColor(targetPlayer: string, color: ChessColor) {
        if (!$playerName || !lobby) return;

        try {
            const response = await fetch(`/api/lobbies/${lobby.id}/set-color`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    playerName: $playerName,
                    targetPlayer,
                    color
                })
            });

            if (!response.ok) {
                throw new Error(resources.errors.common.updateFailed);
            }

            const updatedLobby = await response.json();
            lobby = updatedLobby;
        } catch (e) {
            Sentry.captureException(e, {
                extra: {
                    errorMessage: resources.errors.common.updateFailed
                }
            });
            console.error(e);
            error = resources.errors.common.updateFailed;
        }
    }

    async function deleteLobby() {
        if (!$playerName || !lobby) return;

        try {
            const response = await fetch(`/api/lobbies/${lobby.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    playerName: $playerName
                })
            });

            if (!response.ok) {
                throw new Error(resources.errors.common.deleteFailed);
            }

            goto('/lobby');
        } catch (e) {
            Sentry.captureException(e, {
                extra: {
                    errorMessage: resources.errors.common.deleteFailed
                }
            });
            console.error(e);
            error = resources.errors.common.deleteFailed;
        }
    }

    function isHost(): boolean {
        return lobby?.host === $playerName;
    }

    function isFull(): boolean {
        return !!lobby?.slots.slot1?.player && !!lobby?.slots.slot2?.player;
    }

    function setColor(player: string, color: ColorSelection | undefined) {
        if (!lobby) return;
        if (lobby.slots.slot1?.player === player) {
            lobby = {
                ...lobby,
                slots: {
                    ...lobby.slots,
                    slot1: { ...lobby.slots.slot1, color }
                }
            };
        } else if (lobby.slots.slot2?.player === player) {
            lobby = {
                ...lobby,
                slots: {
                    ...lobby.slots,
                    slot2: { ...lobby.slots.slot2, color }
                }
            };
        }
    }
</script>

<div class="w-screen h-screen bg-[#1a1a1a] text-white font-sans p-8">
    {#if lobby}
        {@const nonNullLobby = lobby as NonNullable<typeof lobby>}
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
                        <!-- Slot 1 -->
                        <div class="p-4 rounded-lg slot-bg" class:white-slot={nonNullLobby.slots.slot1?.color === ChessColor.White} class:black-slot={nonNullLobby.slots.slot1?.color === ChessColor.Black}>
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-4">
                                    <span class="text-lg">{resources.ui.lobby.players.slot1}:</span>
                                    <span class="text-{resources.config.colors.ui.text.secondary}">
                                        {nonNullLobby.slots.slot1?.player || resources.ui.lobby.players.waitingForPlayer}
                                    </span>
                                    {#if nonNullLobby.slots.slot1?.player === $playerName}
                                        <span class="text-{resources.config.colors.ui.success}">({resources.ui.labels.you})</span>
                                    {/if}
                                </div>
                                {#if isHost() && nonNullLobby.slots.slot1?.player}
                                    <div class="flex gap-4">
                                        <input
                                            type="radio"
                                            id="slot1-white"
                                            name="slot1-color"
                                            value={ChessColor.White}
                                            checked={nonNullLobby.slots.slot1?.color === ChessColor.White}
                                            on:change={() => setColor(nonNullLobby.slots.slot1?.player || '', ChessColor.White)}
                                            class="form-radio h-4 w-4 text-{resources.config.colors.ui.success} border-gray-600 focus:ring-{resources.config.colors.ui.success}"
                                        />
                                        <label for="slot1-white" class="text-white">{resources.ui.lobby.players.color.white}</label>

                                        <input
                                            type="radio"
                                            id="slot1-black"
                                            name="slot1-color"
                                            value={ChessColor.Black}
                                            checked={nonNullLobby.slots.slot1?.color === ChessColor.Black}
                                            on:change={() => setColor(nonNullLobby.slots.slot1?.player || '', ChessColor.Black)}
                                            class="form-radio h-4 w-4 text-{resources.config.colors.ui.success} border-gray-600 focus:ring-{resources.config.colors.ui.success}"
                                        />
                                        <label for="slot1-black" class="text-white">{resources.ui.lobby.players.color.black}</label>

                                        <input
                                            type="radio"
                                            id="slot1-random"
                                            name="slot1-color"
                                            value={ChessColor.Random}
                                            checked={nonNullLobby.slots.slot1?.color === ChessColor.Random}
                                            on:change={() => setColor(nonNullLobby.slots.slot1?.player || '', ChessColor.Random)}
                                            class="form-radio h-4 w-4 text-{resources.config.colors.ui.success} border-gray-600 focus:ring-{resources.config.colors.ui.success}"
                                        />
                                        <label for="slot1-random" class="text-white">{resources.ui.lobby.players.color.random}</label>
                                    </div>
                                {/if}
                            </div>
                        </div>

                        <!-- Slot 2 -->
                        <div class="p-4 rounded-lg slot-bg" class:white-slot={nonNullLobby.slots.slot2?.color === ChessColor.White} class:black-slot={nonNullLobby.slots.slot2?.color === ChessColor.Black}>
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-4">
                                    <span class="text-lg">{resources.ui.lobby.players.slot2}:</span>
                                    <span class="text-{resources.config.colors.ui.text.secondary}">
                                        {nonNullLobby.slots.slot2?.player || resources.ui.lobby.players.waitingForPlayer}
                                    </span>
                                    {#if nonNullLobby.slots.slot2?.player === $playerName}
                                        <span class="text-{resources.config.colors.ui.success}">({resources.ui.labels.you})</span>
                                    {/if}
                                </div>
                                {#if isHost() && nonNullLobby.slots.slot2?.player}
                                    <div class="flex gap-4">
                                        <input
                                            type="radio"
                                            id="slot2-white"
                                            name="slot2-color"
                                            value={ChessColor.White}
                                            checked={nonNullLobby.slots.slot2?.color === ChessColor.White}
                                            on:change={() => setColor(nonNullLobby.slots.slot2?.player || '', ChessColor.White)}
                                            class="form-radio h-4 w-4 text-{resources.config.colors.ui.success} border-gray-600 focus:ring-{resources.config.colors.ui.success}"
                                        />
                                        <label for="slot2-white" class="text-white">{resources.ui.lobby.players.color.white}</label>

                                        <input
                                            type="radio"
                                            id="slot2-black"
                                            name="slot2-color"
                                            value={ChessColor.Black}
                                            checked={nonNullLobby.slots.slot2?.color === ChessColor.Black}
                                            on:change={() => setColor(nonNullLobby.slots.slot2?.player || '', ChessColor.Black)}
                                            class="form-radio h-4 w-4 text-{resources.config.colors.ui.success} border-gray-600 focus:ring-{resources.config.colors.ui.success}"
                                        />
                                        <label for="slot2-black" class="text-white">{resources.ui.lobby.players.color.black}</label>

                                        <input
                                            type="radio"
                                            id="slot2-random"
                                            name="slot2-color"
                                            value={ChessColor.Random}
                                            checked={nonNullLobby.slots.slot2?.color === ChessColor.Random}
                                            on:change={() => setColor(nonNullLobby.slots.slot2?.player || '', ChessColor.Random)}
                                            class="form-radio h-4 w-4 text-{resources.config.colors.ui.success} border-gray-600 focus:ring-{resources.config.colors.ui.success}"
                                        />
                                        <label for="slot2-random" class="text-white">{resources.ui.lobby.players.color.random}</label>
                                    </div>
                                {/if}
                            </div>
                        </div>

                        {#if isHost() && isFull()}
                            <div class="flex justify-end mt-4">
                                <button
                                    on:click={handleRandomClick}
                                    class="px-4 py-2 bg-[#4CAF50] text-white rounded hover:bg-[#45a049] transition-colors"
                                >
                                    {resources.ui.buttons.randomize}
                                </button>
                            </div>
                        {/if}
                    </div>
                </div>

                <!-- Time Control -->
                <div class="bg-white/10 rounded-lg p-6">
                    <h2 class="text-2xl font-bold mb-4">{resources.ui.lobby.timeControl.title}</h2>
                    <div class="space-y-4">
                        {#if isHost()}
                            <div class="flex items-center gap-4">
                                <label for="minutes-input" class="text-lg">{resources.ui.lobby.timeControl.minutesLabel}</label>
                                <input
                                    id="minutes-input"
                                    type="number"
                                    min="1"
                                    max="60"
                                    bind:value={minutes}
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
                                    class="w-20 px-2 py-1 bg-white/10 border border-white/20 rounded text-white"
                                />
                            </div>
                        {:else}
                            <div class="flex items-center gap-4">
                                <label for="minutes-display" class="text-lg">{resources.ui.lobby.timeControl.minutesLabel}</label>
                                <span id="minutes-display" class="text-white">{nonNullLobby.timeControl?.minutes || 10}</span>
                            </div>
                            <div class="flex items-center gap-4">
                                <label for="increment-display" class="text-lg">{resources.ui.lobby.timeControl.incrementLabel}</label>
                                <span id="increment-display" class="text-white">{nonNullLobby.timeControl?.increment || 0}</span>
                            </div>
                        {/if}
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex justify-end gap-4">
                    {#if isHost()}
                        <button
                            on:click={deleteLobby}
                            class="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                        >
                            {resources.ui.buttons.delete}
                        </button>
                        {#if isFull()}
                            <button
                                on:click={startGame}
                                class="px-6 py-2 bg-[#4CAF50] text-white rounded hover:bg-[#45a049] transition-colors"
                            >
                                {resources.ui.buttons.start}
                            </button>
                        {/if}
                    {:else}
                        <button
                            on:click={deleteLobby}
                            class="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                        >
                            {resources.ui.buttons.leave}
                        </button>
                    {/if}
                </div>
            </div>
        </div>
    {/if}

    <!-- Error Message -->
    {#if error}
        <div class="fixed bottom-4 right-4 bg-red-500/90 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-4">
            <span>{error}</span>
            <button
                on:click={() => error = ''}
                class="text-white hover:text-white/80"
            >
                {resources.errors.common.closeButton}
            </button>
        </div>
    {/if}
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