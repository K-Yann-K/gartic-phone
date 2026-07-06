import type { WSContext } from "hono/ws";

export interface Player {
    id: string;
    pseudo: string;
    ready: boolean;
    ws: WSContext;
    submittedThisRound: boolean;
}
