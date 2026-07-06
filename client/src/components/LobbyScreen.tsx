import { useState } from "react";

interface Props {
    onJoin: (pseudo: string) => void;
}

export default function LobbyScreen({ onJoin }: Props) {
    const [pseudo, setPseudo] = useState("");
    const [error, setError] = useState("");

    const handleJoin = () => {
        const trimmed = pseudo.trim();
        if (trimmed.length < 1) {
            setError("Entre un pseudo !");
            return;
        }
        if (trimmed.length > 20) {
            setError("Max 20 caractères");
            return;
        }
        setError("");
        onJoin(trimmed);
    };

    return (
        <div className="lobby-screen">
            <div className="lobby-card">
                <div className="logo">
                    <h1>Gartic Phone</h1>
                    <p className="subtitle">Dessine, devine, rigole !</p>
                </div>
                <div className="input-group">
                    <input
                        type="text"
                        placeholder="Ton pseudo..."
                        value={pseudo}
                        maxLength={20}
                        onChange={e => setPseudo(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleJoin()}
                        autoFocus
                    />
                    {error && <span className="error-text">{error}</span>}
                    <button className="btn-primary" onClick={handleJoin}>
                        Rejoindre la partie
                    </button>
                </div>
            </div>
        </div>
    );
}
