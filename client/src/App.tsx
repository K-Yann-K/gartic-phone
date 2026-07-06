import { useState, useEffect, useCallback } from "react";
import ws from "./services/websocket";
import LobbyScreen from "./components/LobbyScreen";
import WaitingRoom from "./components/WaitingRoom";
import WordInput from "./components/WordInput";
import DrawingCanvas from "./components/DrawingCanvas";
import GuessingScreen from "./components/GuessingScreen";
import ResultsScreen from "./components/ResultsScreen";

type Screen = "lobby" | "waiting" | "word_selection" | "drawing" | "guessing"
    | "results";

interface PlayerInfo {
    id: string;
    pseudo: string;
    ready: boolean;
}

interface ChainEntry {
    playerId: string;
    pseudo: string;
    type: "word" | "drawing" | "guess";
    content: string;
}

interface Chain {
    originalWord: string;
    entries: ChainEntry[];
}

export default function App() {
    const [screen, setScreen] = useState<Screen>("lobby");
    const [myId, setMyId] = useState("");
    const [players, setPlayers] = useState<PlayerInfo[]>([]);
    const [isReady, setIsReady] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const [drawingPrompt, setDrawingPrompt] = useState("");
    const [drawingTime, setDrawingTime] = useState(90);

    const [guessingDataUrl, setGuessingDataUrl] = useState("");
    const [guessingTime, setGuessingTime] = useState(60);

    const [chains, setChains] = useState<Chain[]>([]);
    const [waitingCount, setWaitingCount] = useState<{ submitted: number; total: number } | null>(null);
    const [notification, setNotification] = useState<string | null>(null);

    const showNotification = (msg: string) => {
        setNotification(msg);
        setTimeout(() => setNotification(null), 3000);
    };

    useEffect(() => {
        const unsub = ws.onMessage((raw: unknown) => {
            const msg = raw as { type: string; payload?: unknown };

            switch (msg.type) {
                case "CONNECTED": {
                    const { id } = msg.payload as { id: string };
                    setMyId(id);
                    break;
                }

                case "PLAYER_LIST": {
                    const { players: list } = msg.payload as { players: PlayerInfo[] };
                    setPlayers(list);
                    setScreen(prev => prev === "lobby" ? "waiting" : prev);
                    break;
                }

                case "JOINED": {
                    const payload = msg.payload as { playerId: string; players: PlayerInfo[] };
                    setMyId(payload.playerId);
                    setPlayers(payload.players);
                    setScreen("waiting");
                    setIsReady(false);
                    setSubmitted(false);
                    setWaitingCount(null);
                    break;
                }

                case "PLAYER_READY": {
                    const { playerId } = msg.payload as { playerId: string };
                    setPlayers(prev =>
                        prev.map(p => p.id === playerId ? { ...p, ready: true } : p)
                    );
                    break;
                }

                case "PLAYER_JOINED": {
                    // Le serveur envoie PLAYER_LIST juste après, pas besoin de gérer manuellement
                    break;
                }

                case "PLAYER_LEFT": {
                    const { pseudo } = msg.payload as { id: string; pseudo: string };
                    showNotification(`${pseudo} a quitté la partie`);
                    break;
                }

                case "GAME_STARTING": {
                    const { players: gamePlayers } = msg.payload as { players: PlayerInfo[] };
                    setPlayers(gamePlayers);
                    showNotification("La partie commence !");
                    break;
                }

                case "PHASE_WORD_SELECTION": {
                    setScreen("word_selection");
                    setSubmitted(false);
                    setWaitingCount(null);
                    break;
                }

                case "PHASE_DRAWING": {
                    const { wordToDraw, timeLeft } = msg.payload as { wordToDraw: string; timeLeft: number };
                    setDrawingPrompt(wordToDraw);
                    setDrawingTime(timeLeft);
                    setScreen("drawing");
                    setSubmitted(false);
                    setWaitingCount(null);
                    break;
                }

                case "PHASE_GUESSING": {
                    const { drawingUrl, timeLeft } = msg.payload as { drawingUrl: string; timeLeft: number };
                    setGuessingDataUrl(drawingUrl);
                    setGuessingTime(timeLeft);
                    setScreen("guessing");
                    setSubmitted(false);
                    setWaitingCount(null);
                    break;
                }

                case "PHASE_RESULTS": {
                    const { chains: raw } = msg.payload as {
                        chains: Array<{
                            startWord: string;
                            steps: Array<{ playerPseudo: string; type: "word" | "drawing" | "guess"; content: string }>;
                        }>;
                    };
                    // Convertir le format serveur en format attendu par ResultsScreen
                    const converted: Chain[] = raw.map(c => ({
                        originalWord: c.startWord,
                        entries: c.steps.map(s => ({
                            playerId: "",
                            pseudo: s.playerPseudo,
                            type: s.type,
                            content: s.content,
                        })),
                    }));
                    setChains(converted);
                    setScreen("results");
                    break;
                }

                case "TIMER_UPDATE": {
                    const { timeLeft } = msg.payload as { timeLeft: number };
                    setDrawingTime(timeLeft);
                    setGuessingTime(timeLeft);
                    break;
                }

                case "ERROR": {
                    const { message } = msg.payload as { message: string };
                    showNotification(`⚠️ ${message}`);
                    break;
                }
            }
        });

        return unsub;
    }, []);

    const handleJoin = useCallback((pseudo: string) => {
        ws.connect();
        setTimeout(() => {
            ws.send({ type: "JOIN", payload: { pseudo } });
        }, 200);
    }, []);

    const handleReady = useCallback(() => {
        ws.send({ type: "READY" });
        setIsReady(true);
    }, []);

    const handleSubmitWord = useCallback((word: string) => {
        ws.send({ type: "SUBMIT_WORD", payload: { word } });
        setSubmitted(true);
    }, []);

    const handleSubmitDrawing = useCallback((dataUrl: string) => {
        ws.send({ type: "SUBMIT_DRAWING", payload: { dataUrl } });
        setSubmitted(true);
    }, []);

    const handleSubmitGuess = useCallback((guess: string) => {
        ws.send({ type: "SUBMIT_GUESS", payload: { guess } });
        setSubmitted(true);
    }, []);

    const handlePlayAgain = useCallback(() => {
        ws.send({ type: "PLAY_AGAIN" });
        setScreen("waiting");
        setIsReady(false);
        setSubmitted(false);
    }, []);

    return (
        <div className="app">
            {notification && (
                <div className="notification">{notification}</div>
            )}

            {screen === "lobby" && (
                <LobbyScreen onJoin={handleJoin} />
            )}

            {screen === "waiting" && (
                <WaitingRoom
                    players={players}
                    myId={myId}
                    isReady={isReady}
                    onReady={handleReady}
                />
            )}

            {screen === "word_selection" && (
                <WordInput
                    onSubmit={handleSubmitWord}
                    submitted={submitted}
                    waitingCount={waitingCount}
                />
            )}

            {screen === "drawing" && (
                <DrawingCanvas
                    prompt={drawingPrompt}
                    timeLeft={drawingTime}
                    onSubmit={handleSubmitDrawing}
                    submitted={submitted}
                    waitingCount={waitingCount}
                />
            )}

            {screen === "guessing" && (
                <GuessingScreen
                    dataUrl={guessingDataUrl}
                    timeLeft={guessingTime}
                    onSubmit={handleSubmitGuess}
                    submitted={submitted}
                    waitingCount={waitingCount}
                />
            )}

            {screen === "results" && (
                <ResultsScreen
                    chains={chains}
                    onPlayAgain={handlePlayAgain}
                />
            )}
        </div>
    );
}
