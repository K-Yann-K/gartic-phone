// ─── Types partagés Client ────────────────────────────────────────────────────

export interface PlayerInfo {
    id: string;
    pseudo: string;
    ready: boolean;
}

export interface Chain {
    startWord: string;
    steps: ChainStep[];
}

export interface ChainStep {
    playerPseudo: string;
    type: "word" | "drawing" | "guess";
    content: string;
}

// ─── Payloads serveur → client ────────────────────────────────────────────────

export type ServerMessageType =
    | "CONNECTED"
    | "PLAYER_LIST"
    | "PLAYER_JOINED"
    | "PLAYER_LEFT"
    | "GAME_STARTED"
    | "PHASE_WORD_SELECTION"
    | "PHASE_DRAWING"
    | "PHASE_GUESSING"
    | "PHASE_RESULTS"
    | "TIMER_UPDATE"
    | "ERROR";

export interface ServerMessage<T = unknown> {
    type: ServerMessageType;
    payload: T;
}

export type GamePhase =
    | "LOBBY"
    | "WORD_SELECTION"
    | "DRAWING"
    | "GUESSING"
    | "RESULTS";
