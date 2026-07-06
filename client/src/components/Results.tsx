import type { Chain } from "../types/messages";

interface ResultsProps {
    chains: Chain[];
    onNewGame: () => void;
}

export function Results({ chains, onNewGame }: ResultsProps) {
    return (
        <div className="results">
            <h2 className="results__title">Résultats de la manche !</h2>

            <div className="chains">
                {chains.map((chain, i) => (
                    <div key={i} className="chain">
                        <h3 className="chain__start">
                            Mot de départ : <em>« {chain.startWord} »</em>
                        </h3>

                        <div className="chain__steps">
                            {chain.steps.map((step, j) => (
                                <div key={j} className="chain-step">
                                    <div className="chain-step__meta">
                                        <span className="chain-step__player">
                                            {step.playerPseudo}
                                        </span>
                                        <span className="chain-step__badge">
                                            {step.type === "word"
                                                ? "Mot"
                                                : step.type === "drawing"
                                                ? "Dessin"
                                                : "Devinette"}
                                        </span>
                                    </div>

                                    <div className="chain-step__content">
                                        {step.type === "drawing" ? (
                                            step.content ? (
                                                <img
                                                    src={step.content}
                                                    alt={`Dessin de ${step.playerPseudo}`}
                                                    className="chain-step__img"
                                                />
                                            ) : (
                                                <div className="chain-step__empty">
                                                    Pas de dessin
                                                </div>
                                            )
                                        ) : (
                                            <p className="chain-step__text">
                                                « {step.content} »
                                            </p>
                                        )}
                                    </div>

                                    {j < chain.steps.length - 1 && (
                                        <div className="chain-step__arrow">↓</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <button className="btn btn--primary btn--full" onClick={onNewGame}>
                Nouvelle manche 
            </button>
        </div>
    );
}
