import { serve } from "@hono/node-server";
import { createNodeWebSocket } from "@hono/node-ws";
import { Hono } from "hono";
import { Room } from "./game/Room.js";

const app = new Hono();

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

const room = new Room("default");

app.get(
    "/ws",
    upgradeWebSocket((c) => {
        const playerId = crypto.randomUUID();

        return {
            onOpen(_event, ws) {
                console.log(`[+] Joueur connecté : ${playerId}`);
            },

            onMessage(event, ws) {
                let msg: { type: string; payload?: unknown };
                try {
                    msg = JSON.parse(event.data as string);
                } catch {
                    console.warn("Message invalide reçu");
                    return;
                }

                console.log(`[MSG] ${playerId} → ${msg.type}`);

                switch (msg.type) {
                    case "JOIN": {
                        const { pseudo } = msg.payload as { pseudo: string };
                        if (!pseudo?.trim()) return;
                        room.addPlayer({
                            id: playerId,
                            pseudo: pseudo.trim(),
                            ready: false,
                            submittedThisRound: false,
                            ws,
                        });
                        break;
                    }
                    case "READY": {
                        room.setReady(playerId);
                        break;
                    }
                    case "SUBMIT_WORD": {
                        const { word } = msg.payload as { word: string };
                        if (!word?.trim()) return;
                        room.submitWord(playerId, word);
                        break;
                    }
                    case "SUBMIT_DRAWING": {
                        const { dataUrl } = msg.payload as { dataUrl: string };
                        room.submitDrawing(playerId, dataUrl ?? "");
                        break;
                    }
                    case "SUBMIT_GUESS": {
                        const { guess } = msg.payload as { guess: string };
                        room.submitGuess(playerId, guess ?? "");
                        break;
                    }
                    case "PLAY_AGAIN": {
                        room.playAgain(playerId);
                        break;
                    }
                    default:
                        console.warn("Type de message inconnu :", msg.type);
                }
            },

            onClose() {
                console.log(`[-] Joueur déconnecté : ${playerId}`);
                room.removePlayer(playerId);
            },

            onError(err) {
                console.error(`[ERR] ${playerId}`, err);
                room.removePlayer(playerId);
            },
        };
    })
);

app.get("/", (c) => c.json({ status: "ok" }));

const server = serve(
    { fetch: app.fetch, port: 3000 },
    (info) => {
        console.log(`Gartic Phone server — http://localhost:${info.port}`);
    }
);

injectWebSocket(server);
