import { useState } from "react";

interface WordSelectionProps {
    onSubmit: (word: string) => void;
}

export function WordSelection({ onSubmit }: WordSelectionProps) {
    const [word, setWord] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!word.trim() || submitted) return;
        setSubmitted(true);
        onSubmit(word.trim());
    };

    return (
        <div className="phase-screen">
            <div className="phase-card">
                <div className="phase-icon"></div>
                <h2 className="phase-title">Choisis un mot</h2>
                <p className="phase-desc">
                    Écris un mot ou une courte phrase — un autre joueur devra le dessiner !
                </p>

                {!submitted ? (
                    <form className="word-form" onSubmit={handleSubmit}>
                        <input
                            className="input input--large"
                            type="text"
                            placeholder="Ex: chat astronaute…"
                            value={word}
                            onChange={(e) => setWord(e.target.value)}
                            maxLength={40}
                            autoFocus
                        />
                        <button
                            className="btn btn--primary"
                            type="submit"
                            disabled={!word.trim()}
                        >
                            Valider mon mot
                        </button>
                    </form>
                ) : (
                    <div className="submitted-feedback">
                        <p className="submitted-feedback__text">
                            ✓ Mot envoyé ! En attente des autres joueurs…
                        </p>
                        <p className="submitted-feedback__word">« {word} »</p>
                    </div>
                )}
            </div>
        </div>
    );
}
