// Gemeinsamer Enum für Farbe von Spielern und Figuren
export enum ChessColor {
	White = 'white',
	Black = 'black'
}

// Enum für die Typen der Schachfiguren
export enum ChessPieceType {
	Pawn = 'pawn',
	Knight = 'knight',
	Bishop = 'bishop',
	Rook = 'rook',
	Queen = 'queen',
	King = 'king'
}

// Typdefinition für die Daten einer Schachfigur
export interface ChessPieceData {
	id: string; // Einzigartige ID für die Figur
	type: ChessPieceType; // Figurtyp
	position: [number, number, number]; // Position: [X, Y, Z]
	color: ChessColor; // Farbe: Weiß oder Schwarz
}

// Typdefinition für den Zustand des Spiels
export interface GameState {
	pieces: ChessPieceData[]; // Aktive Figuren auf dem Spielfeld
	activePlayer: ChessColor; // Aktueller Spieler (White oder Black)
	capturedPieces: {
		white: ChessPieceData[]; // Geschlagene schwarze Figuren
		black: ChessPieceData[]; // Geschlagene weiße Figuren
	};
	status: string | null;
	reset: () => void;
}

// Typdefinition für einen Lobby
export interface Lobby {
	id: string;
	name: string;
	host: string;
	status: 'waiting' | 'playing';
	created: Date;
	slots: {
		slot1?: {
			player?: string;
			color: 'white' | 'black';
		};
		slot2?: {
			player?: string;
			color: 'white' | 'black';
		};
	};
	timeControl?: {
		minutes: number;
		increment: number;
	};
}