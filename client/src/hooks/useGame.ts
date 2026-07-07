import { useCallback, useEffect, useReducer } from "react";
import ws from "../services/websocket.js";
import type {
    Chain,
    GamePhase,
    PlayerInfo,
    ServerMessage,
} from "../types/messages.js";

// ─── State ────────────────────────────────────────────────────────────────────

interface GameState {
    myId: string | null;
    phase: GamePhase;
    players: PlayerInfo[];
    /** Mot ou dessin à traiter ce tour */
    currentPrompt: string | null;
    /** URL du dessin reçu (phase GUESSING) */
    currentDrawingUrl: string | null;
    timeLeft: number;
    chains: Chain[];
    connected: boolean;
}

const initial: GameState = {
    myId: null,
    phase: "LOBBY",
    players: [],
    currentPrompt: null,
    currentDrawingUrl: null,
    timeLeft: 0,
    chains: [],
    connected: false,
};

// ─── Reducer ──────────────────────────────────────────────────────────────────

type Action =
    | { type: "CONNECTED"; id: string }
    | { type: "SET_PLAYERS"; players: PlayerInfo[] }
    | { type: "GAME_STARTED" }
    | { type: "PHASE_WORD_SELECTION" }
    | { type: "PHASE_DRAWING"; wordToDraw: string; timeLeft: number }
    | { type: "PHASE_GUESSING"; drawingUrl: string; timeLeft: number }
    | { type: "PHASE_RESULTS"; chains: Chain[] }
    | { type: "TIMER_UPDATE"; timeLeft: number }
    | { type: "WS_CONNECTED" }
    | { type: "WS_DISCONNECTED" };

function reducer(state: GameState, action: Action): GameState {
    switch (action.type) {
        case "CONNECTED":
            return { ...state, myId: action.id, connected: true };
        case "WS_CONNECTED":
            return { ...state, connected: true };
        case "WS_DISCONNECTED":
            return { ...state, connected: false };
        case "SET_PLAYERS":
            return { ...state, players: action.players };
        case "GAME_STARTED":
            return { ...state, phase: "WORD_SELECTION" };
        case "PHASE_WORD_SELECTION":
            return { ...state, phase: "WORD_SELECTION", currentPrompt: null };
        case "PHASE_DRAWING":
            return {
                ...state,
                phase: "DRAWING",
                currentPrompt: action.wordToDraw,
                currentDrawingUrl: null,
                timeLeft: action.timeLeft,
            };
        case "PHASE_GUESSING":
            return {
                ...state,
                phase: "GUESSING",
                currentDrawingUrl: action.drawingUrl,
                currentPrompt: null,
                timeLeft: action.timeLeft,
            };
        case "PHASE_RESULTS":
            return { ...state, phase: "RESULTS", chains: action.chains };
        case "TIMER_UPDATE":
            return { ...state, timeLeft: action.timeLeft };
        default:
            return state;
    }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGame() {
    const [state, dispatch] = useReducer(reducer, initial);

    useEffect(() => {
        const WS_URL = "ws://localhost:3000/ws";
        ws.connect(WS_URL);

        // Handlers
        const onConnected = (p: unknown) => {
            const { id } = p as { id: string };
            dispatch({ type: "CONNECTED", id });
        };

        const onPlayerList = (p: unknown) => {
            const { players } = p as { players: PlayerInfo[] };
            dispatch({ type: "SET_PLAYERS", players });
        };

        const onGameStarted = () => dispatch({ type: "GAME_STARTED" });

        const onWordSelection = () => dispatch({ type: "PHASE_WORD_SELECTION" });

        const onDrawing = (p: unknown) => {
            const { wordToDraw, timeLeft } = p as {
                wordToDraw: string;
                timeLeft: number;
            };
            dispatch({ type: "PHASE_DRAWING", wordToDraw, timeLeft });
        };

        const onGuessing = (p: unknown) => {
            const { drawingUrl, timeLeft } = p as {
                drawingUrl: string;
                timeLeft: number;
            };
            dispatch({ type: "PHASE_GUESSING", drawingUrl, timeLeft });
        };

        const onResults = (p: unknown) => {
            const { chains } = p as { chains: Chain[] };
            dispatch({ type: "PHASE_RESULTS", chains });
        };

        const onTimer = (p: unknown) => {
            const { timeLeft } = p as { timeLeft: number };
            dispatch({ type: "TIMER_UPDATE", timeLeft });
        };

        ws.on("CONNECTED", onConnected);
        ws.on("PLAYER_LIST", onPlayerList);
        ws.on("PLAYER_JOINED", onPlayerList); // liste rafraîchie globalement
        ws.on("PLAYER_LEFT", onPlayerList);
        ws.on("GAME_STARTED", onGameStarted);
        ws.on("PHASE_WORD_SELECTION", onWordSelection);
        ws.on("PHASE_DRAWING", onDrawing);
        ws.on("PHASE_GUESSING", onGuessing);
        ws.on("PHASE_RESULTS", onResults);
        ws.on("TIMER_UPDATE", onTimer);

        return () => {
            ws.off("CONNECTED", onConnected);
            ws.off("PLAYER_LIST", onPlayerList);
            ws.off("PLAYER_JOINED", onPlayerList);
            ws.off("PLAYER_LEFT", onPlayerList);
            ws.off("GAME_STARTED", onGameStarted);
            ws.off("PHASE_WORD_SELECTION", onWordSelection);
            ws.off("PHASE_DRAWING", onDrawing);
            ws.off("PHASE_GUESSING", onGuessing);
            ws.off("PHASE_RESULTS", onResults);
            ws.off("TIMER_UPDATE", onTimer);
            ws.disconnect();
        };
    }, []);

    // ── Actions envoyées au serveur ───────────────────────────────────────────

    const join = useCallback((pseudo: string) => {
        ws.send("JOIN", { pseudo });
    }, []);

    const setReady = useCallback(() => {
        ws.send("READY");
    }, []);

    const submitWord = useCallback((word: string) => {
        ws.send("SUBMIT_WORD", { word });
    }, []);

    const submitDrawing = useCallback((dataUrl: string) => {
        ws.send("SUBMIT_DRAWING", { dataUrl });
    }, []);

    const submitGuess = useCallback((guess: string) => {
        ws.send("SUBMIT_GUESS", { guess });
    }, []);

    const newGame = useCallback(() => {
        ws.send("NEW_GAME");
    }, []);

    return {
        ...state,
        join,
        setReady,
        submitWord,
        submitDrawing,
        submitGuess,
        newGame,
    };
}
