export const errors = {
	common: {
		nameRequired: 'Please enter your name',
		genericError: 'An error occurred',
		closeButton: '×',
		fetchFailed: 'Failed to fetch data',
		updateFailed: 'Failed to update data',
		deleteFailed: 'Failed to delete data',
		joinFailed: 'Failed to join',
		leaveFailed: 'Failed to leave lobby',
		startFailed: 'Failed to start game',
		createFailed: 'Failed to create',
		lobbyNameRequired: 'Please enter a lobby name',
		authRequired: 'Please log in to continue'
	},
	server: {
		validation: {
			missingRequiredFields: 'Missing required fields',
			invalidColor: 'Invalid color',
			lobbyNotFound: 'Lobby not found',
			onlyHostCanSetColors: 'Only the host can set colors',
			targetPlayerNotFound: 'Target player is not in this lobby',
			playerNameRequired: 'Player name is required',
			alreadyInLobby: 'Already in this lobby',
			lobbyFull: 'Lobby is full',
			gameStarted: 'Game has already started',
			onlyHostCanStart: 'Only the host can start the game',
			needSecondPlayer: 'Cannot start game without a second player',
			onlyHostCanUpdateTime: 'Only the host can update time settings',
			cannotUpdateTimeAfterStart: 'Cannot update time settings after game has started',
			onlyHostCanRandomize: 'Only the host can randomize players',
			needSecondPlayerForRandom: 'Cannot randomize without a second player',
			gameNotFound: 'Game not found or not started',
			invalidMove: 'Invalid move',
			pieceNotFound: 'Piece not found',
			playerNotFound: 'Player not found in lobby',
			notYourTurn: 'Not your turn',
			cannotMoveOpponent: "Cannot move opponent's pieces",
			timeControlNotInitialized: 'Time control not initialized',
			invalidPlayerOrColor: 'Invalid player or color',
			invalidTimeControl:
				'Invalid time control settings. Minutes must be between 1 and 60, and increment between 0 and 60.',
			lobbyNotAvailable: 'Lobby is not available',
			cannotJoinOwnLobby: 'Cannot join your own lobby',
			notInLobby: 'You are not in this lobby',
			notHost: 'Only the host can perform this action',
			lobbyNotFull: 'Lobby is not full'
		}
	}
} as const;
