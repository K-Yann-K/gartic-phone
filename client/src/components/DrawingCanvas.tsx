import { useRef, useEffect, useState, useCallback } from "react";

interface Props {
    prompt: string;
    timeLeft: number;
    onSubmit: (dataUrl: string) => void;
    submitted: boolean;
    waitingCount: { submitted: number; total: number } | null;
}

const COLORS = [
    "#1a1a1a", "#e74c3c", "#e67e22", "#f1c40f",
    "#2ecc71", "#3498db", "#9b59b6", "#ffffff",
    "#7f8c8d", "#c0392b", "#d35400", "#8e44ad",
];

export default function DrawingCanvas({ prompt, timeLeft, onSubmit, submitted, waitingCount }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState("#1a1a1a");
    const [brushSize, setBrushSize] = useState(4);
    const [timeRemaining, setTimeRemaining] = useState(timeLeft);
    const lastPos = useRef<{ x: number; y: number } | null>(null);

    // Countdown timer
    useEffect(() => {
        if (submitted) return;
        const interval = setInterval(() => {
            setTimeRemaining(t => {
                if (t <= 1) {
                    clearInterval(interval);
                    handleSubmit();
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [submitted]);

    // White background
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, []);

    const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        if ("touches" in e) {
            const touch = e.touches[0];
            return {
                x: (touch.clientX - rect.left) * scaleX,
                y: (touch.clientY - rect.top) * scaleY
            };
        }
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    };

    const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
        if (submitted) return;
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        setIsDrawing(true);
        lastPos.current = getPos(e, canvas);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || submitted) return;
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const pos = getPos(e, canvas);
        const last = lastPos.current;
        if (!last) return;

        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();

        lastPos.current = pos;
    };

    const stopDraw = () => {
        setIsDrawing(false);
        lastPos.current = null;
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const handleSubmit = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dataUrl = canvas.toDataURL("image/png");
        onSubmit(dataUrl);
    }, [onSubmit]);

    const timerClass = timeRemaining <= 10 ? "timer urgent" : "timer";

    if (submitted) {
        return (
            <div className="phase-screen">
                <div className="phase-card">
                    <div className="submitted-icon"></div>
                    <h2>Dessin envoyé !</h2>
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
        <div className="drawing-screen">
            <div className="drawing-header">
                <div className="prompt-box">
                    <span className="prompt-label">À dessiner :</span>
                    <span className="prompt-word">{prompt}</span>
                </div>
                <div className={timerClass}>
                    {timeRemaining}s
                </div>
            </div>

            <div className="canvas-wrapper">
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={500}
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={stopDraw}
                    onMouseLeave={stopDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={stopDraw}
                    style={{ cursor: "crosshair" }}
                />
            </div>

            <div className="drawing-toolbar">
                <div className="color-palette">
                    {COLORS.map(c => (
                        <button
                            key={c}
                            className={`color-swatch ${color === c ? "selected" : ""}`}
                            style={{ background: c }}
                            onClick={() => setColor(c)}
                        />
                    ))}
                </div>
                <div className="brush-sizes">
                    {[2, 4, 8, 16].map(size => (
                        <button
                            key={size}
                            className={`brush-btn ${brushSize === size ? "selected" : ""}`}
                            onClick={() => setBrushSize(size)}
                        >
                            <span style={{
                                display: "block",
                                width: size * 2,
                                height: size * 2,
                                borderRadius: "50%",
                                background: color,
                                margin: "auto"
                            }} />
                        </button>
                    ))}
                </div>
                <div className="toolbar-actions">
                    <button className="btn-secondary" onClick={clearCanvas}>
                        Effacer
                    </button>
                    <button className="btn-primary" onClick={handleSubmit}>
                        Envoyer
                    </button>
                </div>
            </div>
        </div>
    );
}
