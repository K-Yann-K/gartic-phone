import { GameState } from "./GameState.js";
import type { Player } from "./Player.js";
import type { PlayerInfo } from "../types/Message.js";

export class Room {
    public id: string;
    private players: Map<string, Player> = new Map();
    private state: GameState = GameState.WAITING;

    constructor(id: string) {
        this.id = id;
    }

    addPlayer(player: Player): void {
        this.players.set(player.id, player);

        // Notifier les autres joueurs
        this.broadcastExcept(player.id, {
            type: "PLAYER_JOINED",
            payload: { player: this.toInfo(player) }
        });

        // Envoyer l'état actuel au nouveau joueur
        this.send(player.id, {
            type: "JOINED",
            payload: {
                playerId: player.id,
                players: this.getPlayerInfos()
            }
        });

        if (this.state !== GameState.WAITING) {
            this.send(player.id, {
                type: "ERROR",
                payload: { message: "Une partie est en cours. Tu rejoindras la prochaine manche !" }
            });
        }
    }

    removePlayer(playerId: string): void {
        const player = this.players.get(playerId);
        if (!player) return;

        this.players.delete(playerId);
        this.broadcast({
            type: "PLAYER_LEFT",
            payload: { playerId, pseudo: player.pseudo }
        });
    }

    setReady(playerId: string): void {
        const player = this.players.get(playerId);
        if (!player || this.state !== GameState.WAITING) return;

        player.ready = true;
        this.broadcast({
            type: "PLAYER_READY",
            payload: { playerId }
        });

        const allReady = this.players.size >= 2 &&
            Array.from(this.players.values()).every(p => p.ready);

        if (allReady) {
            this.startGame();
        }
    }

    private startGame(): void {
        this.state = GameState.WORD_SELECTION;
        this.broadcast({
            type: "GAME_STARTING",
            payload: { players: this.getPlayerInfos() }
        });

        setTimeout(() => {
            this.broadcast({ type: "PHASE_WORD_SELECTION", payload: {} });
        }, 1000);
    }

    private toInfo(player: Player): PlayerInfo {
        return { id: player.id, pseudo: player.pseudo, ready: player.ready };
    }

    private getPlayerInfos(): PlayerInfo[] {
        return Array.from(this.players.values()).map(this.toInfo);
    }

    private send(playerId: string, msg: object): void {
        const player = this.players.get(playerId);
        if (!player) return;
        try { player.ws.send(JSON.stringify(msg)); } catch { }
    }

    private broadcast(msg: object): void {
        this.players.forEach(player => {
            try { player.ws.send(JSON.stringify(msg)); } catch { }
        });
    }

    private broadcastExcept(excludeId: string, msg: object): void {
        this.players.forEach((player, id) => {
            if (id === excludeId) return;
            try { player.ws.send(JSON.stringify(msg)); } catch { }
        });
    }

    get playerCount(): number {
        return this.players.size;
    }
}
