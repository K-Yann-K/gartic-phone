interface ChainEntry {
    playerId: string;
    pseudo: string;
    type: "word" | "drawing" | "guess";
    content: string;
}

interface Chain {
    originalWord: string;
    entries: ChainEntry[];
}

interface Props {
    chains: Chain[];
    onPlayAgain: () => void;
}

export default function ResultsScreen({ chains, onPlayAgain }: Props) {
    return (
        <div className="results-screen">
            <div className="results-header">
                <h1>Résultats</h1>
                <p>Voyez comment les mots ont évolué !</p>
            </div>

            <div className="chains-container">
                {chains.map((chain, i) => (
                    <div key={i} className="chain-block">
                        <div className="chain-title">
                            Chaîne #{i + 1} — départ : <strong>"{chain.originalWord}"</strong>
                        </div>
                        <div className="chain-entries">
                            {chain.entries.map((entry, j) => (
                                <div key={j} className={`chain-entry entry-${entry.type}`}>
                                    <div className="entry-meta">
                                        <span className="entry-author">
                                            {entry.pseudo}
                                        </span>
                                        <span className="entry-type-badge">
                                            {entry.type === "word" && "Mot"}
                                            {entry.type === "drawing" && "Dessin"}
                                            {entry.type === "guess" && "Interprétation"}
                                        </span>
                                    </div>
                                    {entry.type === "drawing" ? (
                                        <div className="entry-drawing">
                                            <img src={entry.content} alt={`Dessin de ${entry.pseudo}`} />
                                        </div>
                                    ) : (
                                        <div className="entry-text">
                                            "{entry.content}"
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="results-footer">
                <button className="btn-primary btn-large" onClick={onPlayAgain}>
                    Nouvelle manche
                </button>
            </div>
        </div>
    );
}
