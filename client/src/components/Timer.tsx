interface TimerProps {
    timeLeft: number;
    total: number;
}

export function Timer({ timeLeft, total }: TimerProps) {
    const pct = Math.max(0, (timeLeft / total) * 100);
    const urgent = timeLeft <= 10;

    return (
        <div className="timer">
            <span className={`timer__value ${urgent ? "timer__value--urgent" : ""}`}>
                {timeLeft}s
            </span>
            <div className="timer__bar">
                <div
                    className={`timer__fill ${urgent ? "timer__fill--urgent" : ""}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}
