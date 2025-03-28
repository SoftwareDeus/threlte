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
    import LobbyDetail from '$lib/components/lobby/LobbyDetail.svelte';

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

    function handleColorChange(slot: 1 | 2, color: ChessColor) {
        if (!lobby) return;
        const player = slot === 1 ? lobby.slots.slot1?.player : lobby.slots.slot2?.player;
        if (player) {
            setPlayerColor(player, color);
        }
    }
</script>

<div class="w-screen h-screen bg-[#1a1a1a] text-white font-sans p-8">
    {#if lobby}
        <LobbyDetail
            {lobby}
            isHost={isHost()}
            {minutes}
            {increment}
            onMinutesChange={(value) => minutes = value}
            onIncrementChange={(value) => increment = value}
            onColorChange={handleColorChange}
            onStart={startGame}
            onDelete={deleteLobby}
            onRandomize={randomizePlayers}
        />
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