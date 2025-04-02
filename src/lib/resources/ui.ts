export const ui = {
	mainMenu: {
		title: 'Chess Game',
		nameInput: {
			placeholder: 'Enter your name'
		}
	},
	lobby: {
		title: 'Chess Lobbies',
		createNew: 'Create New Lobby',
		nameInput: {
			placeholder: 'Enter lobby name'
		},
		timeControl: {
			title: 'Time Control',
			minutesLabel: 'Minutes per player:',
			incrementLabel: 'Increment (seconds):'
		},
		players: {
			title: 'Players',
			slot1: 'Slot 1',
			slot2: 'Slot 2',
			waitingForPlayer: 'Waiting for player...',
			color: {
				white: 'White',
				black: 'Black',
				random: 'Random'
			}
		}
	},
	chess: {
		pieces: {
			white: {
				king: 'White King',
				queen: 'White Queen',
				bishop: 'White Bishop',
				knight: 'White Knight',
				rook: 'White Rook',
				pawn: 'White Pawn'
			},
			black: {
				king: 'Black King',
				queen: 'Black Queen',
				bishop: 'Black Bishop',
				knight: 'Black Knight',
				rook: 'Black Rook',
				pawn: 'Black Pawn'
			}
		},
		game: {
			whiteToMove: 'White to move',
			blackToMove: 'Black to move',
			check: 'Check!',
			checkmate: 'Checkmate!',
			stalemate: 'Stalemate!',
			draw: 'Draw!',
			captured: 'Captured',
			gameOver: 'Game Over!',
			wins: 'wins!'
		}
	},
	buttons: {
		close: '×',
		delete: 'Delete',
		leave: 'Leave',
		localGame: 'Local Game',
		multiplayer: 'Multiplayer',
		join: 'Join',
		cancel: 'Cancel',
		confirm: 'Confirm',
		back: 'Back',
		start: 'Start Game',
		create: 'Create',
		randomize: 'Randomize'
	},
	labels: {
		you: 'You',
		host: 'Host',
		player: 'Player',
		waiting: 'Waiting...',
		full: 'Full',
		joined: 'Joined',
		confirmDelete: 'Confirm Delete',
		confirmDeleteMessage: 'Are you sure you want to delete this lobby?',
		loading: 'Loading...',
		backToLobbies: 'Back to Lobby'
	}
} as const;
