import { useState } from "react";
import type { PlayerInfo } from "../types/messages.js";

interface LobbyProps {
    myId: string | null;
    players: PlayerInfo[];
    onJoin: (pseudo: string) => void;
    onReady: () => void;
}

export function Lobby({ myId, players, onJoin, onReady }: LobbyProps) {
    const [pseudo, setPseudo] = useState("");
    const [joined, setJoined] = useState(false);

    const me = players.find((p) => p.id === myId);
    const allReady = players.length >= 2 && players.every((p) => p.ready);

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!pseudo.trim()) return;
        onJoin(pseudo.trim());
        setJoined(true);
    };

    return (
        <div className="lobby">
            <header className="lobby__header">
                <h1 className="logo">
                    <span className="logo__gartic">Gartic</span>
                    <span className="logo__phone"> Phone</span>
                </h1>
                <p className="lobby__subtitle">Dessine. Devine. Rigole.</p>
            </header>

            {!joined ? (
                <form className="join-form" onSubmit={handleJoin}>
                    <input
                        className="input"
                        type="text"
                        placeholder="Ton pseudo…"
                        value={pseudo}
                        onChange={(e) => setPseudo(e.target.value)}
                        maxLength={20}
                        autoFocus
                    />
                    <button className="btn btn--primary" type="submit" disabled={!pseudo.trim()}>
                        Rejoindre la partie
                    </button>
                </form>
            ) : (
                <div className="lobby__ready-section">
                    <p className="lobby__hint">
                        {allReady
                            ? "La partie démarre…"
                            : players.length < 2
                            ? "En attente d'autres joueurs…"
                            : "En attente que tout le monde soit prêt"}
                    </p>
                    {!me?.ready && (
                        <button className="btn btn--primary" onClick={onReady}>
                            Je suis prêt !
                        </button>
                    )}
                    {me?.ready && (
                        <p className="lobby__status">✓ Tu es prêt !</p>
                    )}
                </div>
            )}

            <div className="player-list">
                <h2 className="player-list__title">
                    Joueurs ({players.length})
                </h2>
                {players.length === 0 && (
                    <p className="player-list__empty">Personne pour l'instant…</p>
                )}
                <ul className="player-list__items">
                    {players.map((p) => (
                        <li key={p.id} className="player-item">
                            <span className="player-item__pseudo">
                                {p.pseudo}
                                {p.id === myId && (
                                    <span className="player-item__you"> (toi)</span>
                                )}
                            </span>
                            <span
                                className={`player-item__badge ${
                                    p.ready ? "player-item__badge--ready" : ""
                                }`}
                            >
                                {p.ready ? "Prêt" : "En attente"}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
