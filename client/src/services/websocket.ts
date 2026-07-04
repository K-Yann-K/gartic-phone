class WebSocketService {

    private socket?: WebSocket;

    connect() {
        this.socket = new WebSocket("ws://localhost:3000/ws");
    }

    getSocket() {
        return this.socket;
    }
}

export default new WebSocketService();