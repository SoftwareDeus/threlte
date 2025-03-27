export const config = {
    colors: {
        board: {
            white: "#FFFFFF",
            black: "#000000",
            validMove: "#90EE90",
            underAttack: "#FFB6C1",
            possibleMove: "#ADD8E6"
        },
        pieces: {
            selected: "#FFD700",
            underAttack: "red",
            possibleMove: "#ADD8E6"
        },
        ui: {
            success: "#4CAF50",
            text: {
                primary: "white",
                secondary: "white/70"
            }
        }
    },
    board: {
        width: 8,
        depth: 8,
        tileSize: 1,
        pieceHeight: 0.5,
        pieceScale: {
            normal: 1,
            selected: 1.2,
            underAttack: 1.3
        }
    },
    pieces: {
        pawn: {
            radius: 0.2,
            height: 1,
            segments: 32
        },
        rook: {
            width: 0.5,
            height: 1,
            depth: 0.5
        },
        knight: {
            radius: 0.4,
            height: 1,
            segments: 8
        },
        bishop: {
            radius: 0.5,
            segments: 32
        },
        queen: {
            topRadius: 0.3,
            bottomRadius: 0.5,
            height: 1.5,
            segments: 32
        },
        king: {
            topRadius: 0.35,
            bottomRadius: 0.55,
            height: 1.8,
            segments: 32
        }
    },
    capturePlatform: {
        width: 8,
        depth: 2,
        height: 0.1,
        pieceSpacing: 1.2,
        pieceHeight: 0.1,
        whiteZ: -6,
        blackZ: 6
    },
    time: {
        defaultMinutes: 10,
        defaultIncrement: 0,
        maxMinutes: 60,
        maxIncrement: 60
    }
} as const; 