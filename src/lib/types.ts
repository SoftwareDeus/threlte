// Gemeinsamer Enum für Farbe von Spielern und Figuren
export enum ChessColor {
	White = 'white',
	Black = 'black'
}

// Enum für die Typen der Schachfiguren
export enum ChessPieceType {
	Pawn = 'pawn',
	Rook = 'rook',
	Knight = 'knight',
	Bishop = 'bishop',
	Queen = 'queen',
	King = 'king'
}

// Typdefinition für die Daten einer Schachfigur
export type ChessPieceData = {
	id: string; // Einzigartige ID für die Figur
	type: ChessPieceType; // Figurtyp
	position: [number, number, number]; // Position: [X, Y, Z]
	color: ChessColor; // Farbe: Weiß oder Schwarz
};

// Typdefinition für den Zustand des Spiels
export type GameState = {
	pieces: ChessPieceData[]; // Aktive Figuren auf dem Spielfeld
	activePlayer: ChessColor; // Aktueller Spieler (White oder Black)
	capturedPieces: {
		white: ChessPieceData[]; // Geschlagene schwarze Figuren
		black: ChessPieceData[]; // Geschlagene weiße Figuren
	};
};