import { useState } from "react";

interface Props {
    dataUrl: string;
    timeLeft: number;
    onSubmit: (guess: string) => void;
    submitted: boolean;
    waitingCount: { submitted: number; total: number } | null;
}

export default function GuessingScreen({ dataUrl, timeLeft, onSubmit, submitted, waitingCount }: Props) {
    const [guess, setGuess] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = () => {
        const trimmed = guess.trim();
        if (!trimmed) {
            setError("Entre ta réponse !");
            return;
        }
        setError("");
        onSubmit(trimmed);
    };

    if (submitted) {
        return (
            <div className="phase-screen">
                <div className="phase-card">
                    <div className="submitted-icon">✅</div>
                    <h2>Réponse envoyée !</h2>
                    {waitingCount && (
                        <p className="waiting-progress">
                            {waitingCount.submitted}/{waitingCount.total} joueurs ont soumis
                        </p>
                    )}
                    <div className="waiting-dots">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="phase-screen">
            <div className="guessing-card">
                <div className="guessing-header">
                    <h2>🔍 Qu'est-ce que c'est ?</h2>
                    <div className="timer">{timeLeft}s</div>
                </div>
                <div className="drawing-preview">
                    <img src={dataUrl} alt="Dessin à deviner" />
                </div>
                <div className="input-group">
                    <input
                        type="text"
                        placeholder="Ta réponse..."
                        value={guess}
                        onChange={e => setGuess(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSubmit()}
                        autoFocus
                        maxLength={100}
                    />
                    {error && <span className="error-text">{error}</span>}
                    <button className="btn-primary" onClick={handleSubmit}>✅ Valider</button>
                </div>
            </div>
        </div>
    );
}
