import { useState, useEffect, useCallback } from "react";
import ws from "./services/websocket";
import LobbyScreen from "./components/LobbyScreen";
import WaitingRoom from "./components/WaitingRoom";

type Screen = "lobby" | "waiting";

interface PlayerInfo {
    id: string;
    pseudo: string;
    ready: boolean;
}

export default function App() {
    const [screen, setScreen] = useState<Screen>("lobby");
    const [myId, setMyId] = useState("");
    const [players, setPlayers] = useState<PlayerInfo[]>([]);
    const [isReady, setIsReady] = useState(false);
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

    return (
        <div className="app">
            {notification && <div className="notification">{notification}</div>}

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
        </div>
    );
}
