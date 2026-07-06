import { useState } from "react";

interface Props {
    onSubmit: (word: string) => void;
    submitted: boolean;
    waitingCount: { submitted: number; total: number } | null;
}

export default function WordInput({ onSubmit, submitted, waitingCount }: Props) {
    const [word, setWord] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = () => {
        const trimmed = word.trim();
        if (!trimmed) {
            setError("Entre un mot !");
            return;
        }
        if (trimmed.length > 50) {
            setError("Max 50 caractères");
            return;
        }
        setError("");
        onSubmit(trimmed);
    };

    if (submitted) {
        return (
            <div className="phase-screen">
                <div className="phase-card">
                    <div className="submitted-icon"></div>
                    <h2>Mot envoyé !</h2>
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
            <div className="phase-card">
                <div className="phase-icon"></div>
                <h2>Tour 1 — Choisir un mot</h2>
                <p className="phase-description">
                    Entre un mot ou une expression que les autres devront dessiner.
                </p>
                <div className="input-group">
                    <input
                        type="text"
                        placeholder="Ex: astronaute, pizza géante..."
                        value={word}
                        maxLength={50}
                        onChange={e => setWord(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSubmit()}
                        autoFocus
                    />
                    {error && <span className="error-text">{error}</span>}
                    <button className="btn-primary" onClick={handleSubmit}>
                        Valider
                    </button>
                </div>
            </div>
        </div>
    );
}
