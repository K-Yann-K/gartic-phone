import { DrawingCanvas } from "./DrawingCanvas.js";
import { Timer } from "./Timer.js";

interface DrawingPhaseProps {
    wordToDraw: string;
    timeLeft: number;
    onSubmit: (dataUrl: string) => void;
}

export function DrawingPhase({ wordToDraw, timeLeft, onSubmit }: DrawingPhaseProps) {
    return (
        <div className="drawing-phase">
            <div className="drawing-phase__header">
                <div>
                    <h2 className="phase-title">Dessine !</h2>
                    <p className="drawing-phase__word">
                        Mot à dessiner : <strong>{wordToDraw}</strong>
                    </p>
                </div>
                <Timer timeLeft={timeLeft} total={90} />
            </div>
            <DrawingCanvas onSubmit={onSubmit} />
        </div>
    );
}
