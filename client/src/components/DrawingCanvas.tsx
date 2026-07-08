import { useRef, useEffect, useState, useCallback } from "react";
import { Pencil, Square, Circle, Triangle, Eraser } from "lucide-react";

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

type Tool = "pencil" | "rectangle" | "ellipse" | "triangle" | "eraser";

export default function DrawingCanvas({ prompt, timeLeft, onSubmit, submitted, waitingCount }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const snapshotRef = useRef<ImageData | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState("#1a1a1a");
    const [brushSize, setBrushSize] = useState(4);
    const [tool, setTool] = useState<Tool>("pencil");
    const [eraserSize, setEraserSize] = useState(20);
    const [timeRemaining, setTimeRemaining] = useState(timeLeft);
    const startPos = useRef<{ x: number; y: number } | null>(null);
    const lastPos = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
        if (submitted) return;
        const interval = setInterval(() => {
            setTimeRemaining(t => {
                if (t <= 1) { clearInterval(interval); handleSubmit(); return 0; }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [submitted]);

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
            return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY };
        }
        return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
    };

    const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
        if (submitted) return;
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d")!;
        const pos = getPos(e, canvas);
        setIsDrawing(true);
        startPos.current = pos;
        lastPos.current = pos;
        if (tool !== "pencil" && tool !== "eraser") {
            snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || submitted) return;
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d")!;
        const pos = getPos(e, canvas);

        if (tool === "eraser") {
            ctx.save();
            ctx.globalCompositeOperation = "destination-out";
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, eraserSize / 2, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(0,0,0,1)";
            ctx.fill();
            // Tracer aussi entre lastPos et pos pour ne pas avoir de trous
            if (lastPos.current) {
                ctx.beginPath();
                ctx.moveTo(lastPos.current.x, lastPos.current.y);
                ctx.lineTo(pos.x, pos.y);
                ctx.lineWidth = eraserSize;
                ctx.lineCap = "round";
                ctx.strokeStyle = "rgba(0,0,0,1)";
                ctx.stroke();
            }
            ctx.restore();
            // Remettre du blanc là où on a effacé (canvas fond blanc)
            ctx.save();
            ctx.globalCompositeOperation = "destination-over";
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
            lastPos.current = pos;

        } else if (tool === "pencil") {
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

        } else {
            if (snapshotRef.current) {
                ctx.putImageData(snapshotRef.current, 0, 0);
            }
            const start = startPos.current!;
            const w = pos.x - start.x;
            const h = pos.y - start.y;

            ctx.strokeStyle = color;
            ctx.lineWidth = brushSize;
            ctx.beginPath();

            if (tool === "rectangle") {
                ctx.strokeRect(start.x, start.y, w, h);
            } else if (tool === "ellipse") {
                ctx.ellipse(
                    start.x + w / 2, start.y + h / 2,
                    Math.abs(w / 2), Math.abs(h / 2),
                    0, 0, Math.PI * 2
                );
                ctx.stroke();
            } else if (tool === "triangle") {
                ctx.moveTo(start.x + w / 2, start.y);
                ctx.lineTo(start.x + w, start.y + h);
                ctx.lineTo(start.x, start.y + h);
                ctx.closePath();
                ctx.stroke();
            }
        }
    };

    const stopDraw = () => {
        setIsDrawing(false);
        startPos.current = null;
        lastPos.current = null;
        snapshotRef.current = null;
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const handleSubmit = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        onSubmit(canvas.toDataURL("image/png"));
    }, [onSubmit]);

    const getCursor = () => {
        if (tool === "eraser") return "cell";
        if (tool === "pencil") return "crosshair";
        return "cell";
    };

    const TOOLS: { id: Tool; label: React.ReactNode }[] = [
        { id: "pencil",    label: <Pencil size={20} /> },
        { id: "rectangle", label: <Square size={20} /> },
        { id: "ellipse",   label: <Circle size={20} /> },
        { id: "triangle",  label: <Triangle size={20} /> },
        { id: "eraser",    label: <Eraser size={20} /> },
    ];

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
                    <div className="waiting-dots"><span></span><span></span><span></span></div>
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
                <div className={timeRemaining <= 10 ? "timer urgent" : "timer"}>
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
                    style={{ cursor: getCursor() }}
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

                <div className="toolbar-row">
                    <div className="shape-picker">
                        {TOOLS.map(t => (
                            <button
                                key={t.id}
                                className={`shape-btn ${tool === t.id ? "selected" : ""}`}
                                onClick={() => setTool(t.id)}
                                title={t.id}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {tool === "eraser" ? (
                        <div className="eraser-slider">
                            <label>
                                Rayon : <strong>{eraserSize}px</strong>
                            </label>
                            <input
                                type="range"
                                min={4}
                                max={80}
                                value={eraserSize}
                                onChange={e => setEraserSize(Number(e.target.value))}
                            />
                            <span
                                className="eraser-preview"
                                style={{
                                    width: eraserSize,
                                    height: eraserSize,
                                }}
                            />
                        </div>
                    ) : (
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
                    )}
                </div>

                <div className="toolbar-actions">
                    <button className="btn-secondary" onClick={clearCanvas}>Effacer</button>
                    <button className="btn-primary" onClick={handleSubmit}>Envoyer</button>
                </div>
            </div>
        </div>
    );
}