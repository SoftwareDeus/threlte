export enum ChessColor {
    White = 'white',
    Black = 'black'
}

export enum ChessPieceType {
    Pawn = 'pawn',
    Knight = 'knight',
    Bishop = 'bishop',
    Rook = 'rook',
    Queen = 'queen',
    King = 'king'
}

export interface ChessPiece {
    type: ChessPieceType;
    color: ChessColor;
    position: string;
}

export interface Move {
    pieceId: string;
    targetPosition: string;
}

export interface GameState {
    board: ChessPiece[];
    activePlayer: ChessColor;
    capturedPieces: {
        white: ChessPiece[];
        black: ChessPiece[];
    };
    status: string | null;
    reset: () => void;
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
} 