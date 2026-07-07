import { useState } from "react";
import { Timer } from "./Timer.js";

interface GuessingPhaseProps {
    drawingUrl: string;
    timeLeft: number;
    onSubmit: (guess: string) => void;
}

export function GuessingPhase({ drawingUrl, timeLeft, onSubmit }: GuessingPhaseProps) {
    const [guess, setGuess] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!guess.trim() || submitted) return;
        setSubmitted(true);
        onSubmit(guess.trim());
    };

    return (
        <div className="guessing-phase">
            <div className="guessing-phase__header">
                <div>
                    <h2 className="phase-title">Qu'est-ce que c'est ?</h2>
                    <p className="phase-desc">Devine ce que le joueur a dessiné !</p>
                </div>
                <Timer timeLeft={timeLeft} total={60} />
            </div>

            <div className="drawing-display">
                {drawingUrl ? (
                    <img
                        src={drawingUrl}
                        alt="Dessin à deviner"
                        className="drawing-display__img"
                    />
                ) : (
                    <div className="drawing-display__empty">
                        <span>Pas de dessin reçu…</span>
                    </div>
                )}
            </div>

            {!submitted ? (
                <form className="word-form" onSubmit={handleSubmit}>
                    <input
                        className="input input--large"
                        type="text"
                        placeholder="Ta réponse…"
                        value={guess}
                        onChange={(e) => setGuess(e.target.value)}
                        maxLength={40}
                        autoFocus
                    />
                    <button
                        className="btn btn--primary"
                        type="submit"
                        disabled={!guess.trim()}
                    >
                        Envoyer ma réponse
                    </button>
                </form>
            ) : (
                <p className="submitted-feedback__text">
                    ✓ Réponse envoyée ! En attente des autres…
                </p>
            )}
        </div>
    );
}
