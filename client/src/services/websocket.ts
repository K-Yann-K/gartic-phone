type MessageHandler = (msg: { type: string; payload?: unknown }) => void;

class WebSocketService {
    private socket: WebSocket | null = null;
    private handlers: MessageHandler[] = [];
    private queue: string[] = [];
    private url = "ws://localhost:3000/ws";
    private shouldReconnect = true;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    connect() {
        this.shouldReconnect = true;
        this.createSocket();
    }

    private createSocket() {
        this.socket = new WebSocket(this.url);

        this.socket.onopen = () => {
            console.log("[WS] Connecté");
            if (this.reconnectTimer) {
                clearTimeout(this.reconnectTimer);
                this.reconnectTimer = null;
            }
            this.queue.forEach((msg) => this.socket!.send(msg));
            this.queue = [];
        };

        this.socket.onmessage = (event: MessageEvent) => {
            try {
                const msg = JSON.parse(event.data as string);
                this.handlers.forEach((h) => h(msg));
            } catch {
                console.warn("[WS] Message invalide", event.data);
            }
        };

        this.socket.onclose = () => {
            console.log("[WS] Déconnecté");
            if (this.shouldReconnect) {
                this.reconnectTimer = setTimeout(() => this.createSocket(), 3000);
            }
        };

        this.socket.onerror = (e) => console.error("[WS] Erreur", e);
    }

    send(msg: { type: string; payload?: unknown }) {
        const raw = JSON.stringify(msg);
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(raw);
        } else {
            this.queue.push(raw);
        }
    }

    onMessage(handler: MessageHandler): () => void {
        this.handlers.push(handler);
        return () => {
            this.handlers = this.handlers.filter((h) => h !== handler);
        };
    }

    disconnect() {
        this.shouldReconnect = false;
        this.queue = [];
        this.socket?.close();
    }
}

const ws = new WebSocketService();
export default ws;
