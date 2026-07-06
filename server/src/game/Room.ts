import { GameState } from "./GameState.js";
import type { Player } from "./Player.js";
import type { ChainEntry, PlayerInfo } from "../types/Message.js";

const DRAWING_TIME = 90;
const GUESSING_TIME = 90;

export class Room {
    public id: string;
    private players: Map<string, Player> = new Map();
    private state: GameState = GameState.WAITING;

    private chains: ChainEntry[][] = [];
    private round: number = 0;
    private playerOrder: string[] = [];
    private pendingSubmissions: Map<number, { playerId: string; content: string }> = new Map();
    private timer: ReturnType<typeof setTimeout> | null = null;

    constructor(id: string) {
        this.id = id;
    }

    addPlayer(player: Player): void {
        this.players.set(player.id, player);
        this.broadcastExcept(player.id, {
            type: "PLAYER_JOINED",
            payload: { player: this.toInfo(player) }
        });
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

        if (this.state !== GameState.WAITING && this.state !== GameState.RESULTS) {
            this.checkAllSubmitted();
        }

        if (this.players.size < 2 && this.state !== GameState.WAITING) {
            this.resetToWaiting();
        }
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

    playAgain(playerId: string): void {
        if (this.state !== GameState.RESULTS) return;
        this.resetToWaiting();
    }

    submitWord(playerId: string, word: string): void {
        if (this.state !== GameState.WORD_SELECTION) return;
        this.handleSubmission(playerId, word);
    }

    submitDrawing(playerId: string, dataUrl: string): void {
        if (this.state !== GameState.DRAWING) return;
        this.handleSubmission(playerId, dataUrl);
    }

    submitGuess(playerId: string, guess: string): void {
        if (this.state !== GameState.GUESSING) return;
        this.handleSubmission(playerId, guess);
    }

    private startGame(): void {
        this.state = GameState.WORD_SELECTION;
        this.playerOrder = Array.from(this.players.keys());
        this.round = 0;
        this.chains = this.playerOrder.map(() => []);
        this.pendingSubmissions.clear();
        this.players.forEach(p => p.submittedThisRound = false);

        this.broadcast({
            type: "GAME_STARTING",
            payload: { players: this.getPlayerInfos() }
        });

        setTimeout(() => {
            this.broadcast({ type: "PHASE_WORD_SELECTION", payload: {} });
        }, 1000);
    }

    private handleSubmission(playerId: string, content: string): void {
        const player = this.players.get(playerId);
        if (!player || player.submittedThisRound) return;

        player.submittedThisRound = true;

        const chainIndex = this.getChainIndexForPlayer(playerId);
        if (chainIndex === -1) return;

        const entry: ChainEntry = {
            playerId,
            pseudo: player.pseudo,
            type: this.currentEntryType(),
            content
        };

        this.chains[chainIndex].push(entry);
        this.pendingSubmissions.set(chainIndex, { playerId, content });

        const submitted = Array.from(this.players.values()).filter(p => p.submittedThisRound).length;
        const total = this.activePlayers().length;

        this.broadcast({
            type: "WAITING_FOR_OTHERS",
            payload: { submitted, total }
        });

        this.checkAllSubmitted();
    }

    private checkAllSubmitted(): void {
        const active = this.activePlayers();
        const allDone = active.every(p => p.submittedThisRound);
        if (allDone) {
            this.advanceRound();
        }
    }

    private advanceRound(): void {
        this.clearTimer();
        this.round++;

        const totalRounds = this.playerOrder.length;

        if (this.round >= totalRounds) {
            this.showResults();
            return;
        }

        this.players.forEach(p => p.submittedThisRound = false);
        this.pendingSubmissions.clear();

        if (this.round % 2 === 1) {
            this.state = GameState.DRAWING;
            this.startDrawingPhase();
        } else {
            this.state = GameState.GUESSING;
            this.startGuessingPhase();
        }
    }

    private startDrawingPhase(): void {
        this.activePlayers().forEach(player => {
            const chainIndex = this.getChainIndexForPlayer(player.id);
            if (chainIndex === -1) return;
            const chain = this.chains[chainIndex];
            const lastEntry = chain[chain.length - 1];

            this.send(player.id, {
                type: "PHASE_DRAWING",
                payload: {
                    prompt: lastEntry.content,
                    timeLeft: DRAWING_TIME
                }
            });
        });

        this.timer = setTimeout(() => {
            this.activePlayers().forEach(player => {
                if (!player.submittedThisRound) {
                    this.handleSubmission(player.id, "");
                }
            });
        }, DRAWING_TIME * 1000);
    }

    private startGuessingPhase(): void {
        this.activePlayers().forEach(player => {
            const chainIndex = this.getChainIndexForPlayer(player.id);
            if (chainIndex === -1) return;
            const chain = this.chains[chainIndex];
            const lastEntry = chain[chain.length - 1];

            this.send(player.id, {
                type: "PHASE_GUESSING",
                payload: {
                    dataUrl: lastEntry.content,
                    timeLeft: GUESSING_TIME
                }
            });
        });

        this.timer = setTimeout(() => {
            this.activePlayers().forEach(player => {
                if (!player.submittedThisRound) {
                    this.handleSubmission(player.id, "???");
                }
            });
        }, GUESSING_TIME * 1000);
    }

    private showResults(): void {
        this.state = GameState.RESULTS;
        this.clearTimer();

        const result = this.chains.map(chain => ({
            originalWord: chain[0]?.content ?? "",
            entries: chain
        }));

        this.broadcast({
            type: "RESULTS",
            payload: { chains: result }
        });
    }

    private resetToWaiting(): void {
        this.clearTimer();
        this.state = GameState.WAITING;
        this.round = 0;
        this.chains = [];
        this.playerOrder = [];
        this.pendingSubmissions.clear();
        this.players.forEach(p => {
            p.ready = false;
            p.submittedThisRound = false;
        });

        this.broadcast({
            type: "JOINED",
            payload: { playerId: "", players: this.getPlayerInfos() }
        });
    }

    private clearTimer(): void {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }

    // Round 0: joueur i → chaîne i
    // Round 1: joueur i → chaîne (i+1)%n  ← rotation à corriger
    private getChainIndexForPlayer(playerId: string): number {
        const playerIndex = this.playerOrder.indexOf(playerId);
        if (playerIndex === -1) return -1;
        const n = this.playerOrder.length;
        return (playerIndex + this.round) % n;
    }

    private currentEntryType(): "word" | "drawing" | "guess" {
        if (this.round === 0) return "word";
        return this.round % 2 === 1 ? "drawing" : "guess";
    }

    private activePlayers(): Player[] {
        return this.playerOrder
            .map(id => this.players.get(id))
            .filter((p): p is Player => p !== undefined);
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

    get playerCount(): number { return this.players.size; }
    get currentState(): GameState { return this.state; }
}
