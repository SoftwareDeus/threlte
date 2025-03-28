export enum ChessColor {
    White = 'white',
    Black = 'black',
    Random = 'random'
}

export type ColorSelection = ChessColor;

export enum ChessPieceType {
    Pawn = 'pawn',
    Knight = 'knight',
    Bishop = 'bishop',
    Rook = 'rook',
    Queen = 'queen',
    King = 'king'
}

export interface ChessPiece {
    id: string;
    type: ChessPieceType;
    color: ChessColor;
    position: string;
}

export interface Move {
    pieceId: string;
    targetPosition: string;
}

export interface GameState {
    pieces: ChessPiece[];
    activePlayer: ChessColor;
    capturedPieces: {
        white: ChessPiece[];
        black: ChessPiece[];
    };
    status?: string | null;
    reset?: () => void;
    lastMove?: Move;
    playerName?: string;
    timeControl?: {
        minutes: number;
        increment: number;
    };
    timeRemaining?: {
        white: number;
        black: number;
    };
    gameOver?: boolean;
    winner?: ChessColor;
}

export interface ChessPieceData {
    id: string;
    type: ChessPieceType;
    position: [number, number, number];
    color: ChessColor;
}

export interface Lobby {
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