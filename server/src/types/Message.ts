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