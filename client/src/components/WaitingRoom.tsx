interface PlayerInfo {
    id: string;
    pseudo: string;
    ready: boolean;
}

interface Props {
    players: PlayerInfo[];
    myId: string;
    isReady: boolean;
    onReady: () => void;
}

export default function WaitingRoom({ players, myId, isReady, onReady }: Props) {
    const readyCount = players.filter(p => p.ready).length;
    const canStart = players.length >= 2 && players.every(p => p.ready);

    return (
        <div className="waiting-room">
            <div className="waiting-card">
                <h2>Salle d'attente</h2>
                <p className="waiting-subtitle">
                    {players.length < 2
                        ? "En attente d'au moins un autre joueur..."
                        : canStart
                            ? "Tous prêts ! La partie commence..."
                            : `${readyCount}/${players.length} joueurs prêts`
                    }
                </p>

                <div className="players-list">
                    {players.map(player => (
                        <div key={player.id} className={`player-card ${player.ready ? "ready" : ""}`}>
                            <span className="player-avatar">
                                {player.pseudo.charAt(0).toUpperCase()}
                            </span>
                            <span className="player-name">
                                {player.pseudo}
                                {player.id === myId && <span className="you-tag"> (toi)</span>}
                            </span>
                            <span className="ready-badge">
                                {player.ready ? "Prêt" : "Pas prêt"}
                            </span>
                        </div>
                    ))}
                </div>

                {!isReady && (
                    <button className="btn-primary" onClick={onReady}>
                        Je suis prêt !
                    </button>
                )}
                {isReady && (
                    <div className="waiting-msg">
                        En attente des autres joueurs...
                    </div>
                )}
            </div>
        </div>
    );
}
