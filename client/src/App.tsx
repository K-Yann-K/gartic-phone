import { useState, useEffect, useCallback } from "react";
import ws from "./services/websocket";
import LobbyScreen from "./components/LobbyScreen";
import WaitingRoom from "./components/WaitingRoom";
import WordInput from "./components/WordInput";
import DrawingCanvas from "./components/DrawingCanvas";
import GuessingScreen from "./components/GuessingScreen";

type Screen = "lobby" | "waiting" | "word_selection" | "drawing" | "guessing";

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

export default function App() {
    const [screen, setScreen] = useState<Screen>("lobby");
    const [myId, setMyId] = useState("");
    const [players, setPlayers] = useState<PlayerInfo[]>([]);
    const [isReady, setIsReady] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const [drawingPrompt, setDrawingPrompt] = useState("");
    const [drawingTime, setDrawingTime] = useState(90);

    const [guessingDataUrl, setGuessingDataUrl] = useState("");
    const [guessingTime, setGuessingTime] = useState(90);

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
                case "PLAYER_JOINED": {
                    const { player } = msg.payload as { player: PlayerInfo };
                    setPlayers(prev => {
                        if (prev.find(p => p.id === player.id)) return prev;
                        return [...prev, player];
                    });
                    showNotification(`${player.pseudo} a rejoint la partie !`);
                    break;
                }
                case "PLAYER_LEFT": {
                    const { playerId, pseudo } = msg.payload as { playerId: string; pseudo: string };
                    setPlayers(prev => prev.filter(p => p.id !== playerId));
                    showNotification(`${pseudo} a quitté la partie`);
                    break;
                }
                case "PLAYER_READY": {
                    const { playerId } = msg.payload as { playerId: string };
                    setPlayers(prev =>
                        prev.map(p => p.id === playerId ? { ...p, ready: true } : p)
                    );
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
                    const { prompt, timeLeft } = msg.payload as { prompt: string; timeLeft: number };
                    setDrawingPrompt(prompt);
                    setDrawingTime(timeLeft);
                    setScreen("drawing");
                    setSubmitted(false);
                    setWaitingCount(null);
                    break;
                }
                case "PHASE_GUESSING": {
                    const { dataUrl, timeLeft } = msg.payload as { dataUrl: string; timeLeft: number };
                    setGuessingDataUrl(dataUrl);
                    setGuessingTime(timeLeft);
                    setScreen("guessing");
                    setSubmitted(false);
                    setWaitingCount(null);
                    break;
                }
                case "WAITING_FOR_OTHERS": {
                    const count = msg.payload as { submitted: number; total: number };
                    setWaitingCount(count);
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

    return (
        <div className="app">
            {notification && <div className="notification">{notification}</div>}

            {screen === "lobby" && <LobbyScreen onJoin={handleJoin} />}

            {screen === "waiting" && (
                <WaitingRoom players={players} myId={myId} isReady={isReady} onReady={handleReady} />
            )}

            {screen === "word_selection" && (
                <WordInput onSubmit={handleSubmitWord} submitted={submitted} waitingCount={waitingCount} />
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
        </div>
    );
}
