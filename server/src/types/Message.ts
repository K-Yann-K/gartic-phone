export interface SocketMessage {

    type: string;

    payload?: unknown;

}

export interface PlayerInfo {
    id: string;
    pseudo: string;
    ready: boolean;
}

export interface ChainEntry {
    playerId: string;
    pseudo: string;
    type: "word" | "drawing" | "guess";
    content: string;
}

export interface Chain {
    originalWord: string;
    entries: ChainEntry[];
}

// Client -> Server
export type ClientMessageType =
    | "JOIN"
    | "READY"
    | "SUBMIT_WORD"
    | "SUBMIT_DRAWING"
    | "SUBMIT_GUESS"
    | "PLAY_AGAIN";

// Server → Client
export type ServerMessageType =
    | "JOINED"
    | "PLAYER_JOINED"
    | "PLAYER_LEFT"
    | "PLAYER_READY"
    | "GAME_STARTING"
    | "PHASE_WORD_SELECTION"
    | "PHASE_DRAWING"
    | "PHASE_GUESSING"
    | "WAITING_FOR_OTHERS"
    | "RESULTS"
    | "ERROR";