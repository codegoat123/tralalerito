import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import type { 
  PlayerState, 
  SnakeState, 
  ClientToServerMessage, 
  ServerToClientMessage 
} from "@shared/multiplayer-types";
import { generateRandomUsername } from "@shared/multiplayer-types";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  const players = new Map<string, PlayerState>();
  const clientSockets = new Map<string, WebSocket>();
  let playerUpdatePending = false;
  let pendingPlayerUpdates = new Set<string>();

  wss.on('connection', (ws: WebSocket) => {
    let playerId: string | null = null;

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString()) as ClientToServerMessage;

        if (message.type === 'join') {
          playerId = `player-${Date.now()}-${Math.random()}`;
          const username = message.username || generateRandomUsername();

          const newPlayer: PlayerState = {
            id: playerId,
            username,
            position: { x: 0, y: 2.2, z: 0 },
            rotation: 0,
            isMoving: false
          };

          players.set(playerId, newPlayer);
          clientSockets.set(playerId, ws);

          // Send welcome message to the new player
          const welcomeMsg: ServerToClientMessage = {
            type: 'welcome',
            playerId,
            username
          };
          ws.send(JSON.stringify(welcomeMsg));

          // Send current players to new player
          const playersUpdate: ServerToClientMessage = {
            type: 'players_update',
            players: Object.fromEntries(players)
          };
          ws.send(JSON.stringify(playersUpdate));

          // Notify all other players
          const joinMsg: ServerToClientMessage = {
            type: 'player_joined',
            player: newPlayer
          };

          clientSockets.forEach((clientWs, clientId) => {
            if (clientId !== playerId && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify(joinMsg));
            }
          });
        } else if (message.type === 'update_position' && playerId) {
          const player = players.get(playerId);
          if (player) {
            const oldY = player.position.y;
            
            // Update player state
            player.position = message.position;
            player.rotation = message.rotation;
            player.isMoving = message.isMoving;

            // Basic anti-cheat: prevent impossible jumps (more than 10 units up in one update)
            if (player.position.y - oldY > 10) {
              player.position.y = oldY + 2; // Cap the jump
            }

            // Prevent falling through the world
            if (player.position.y < -40) {
              player.position = { x: 0, y: 2.2, z: 0 };
            }

            // Mark this player as updated
            pendingPlayerUpdates.add(playerId);

            // Schedule broadcast if not already pending
            if (!playerUpdatePending) {
              playerUpdatePending = true;
              setImmediate(() => {
                // Broadcast updated players state to ALL clients
                const updateMsg: ServerToClientMessage = {
                  type: 'players_update',
                  players: Object.fromEntries(players)
                };

                clientSockets.forEach((clientWs) => {
                  if (clientWs.readyState === WebSocket.OPEN) {
                    clientWs.send(JSON.stringify(updateMsg));
                  }
                });

                playerUpdatePending = false;
                pendingPlayerUpdates.clear();
              });
            }
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      if (playerId) {
        players.delete(playerId);
        clientSockets.delete(playerId);

        // Notify all players
        const leaveMsg: ServerToClientMessage = {
          type: 'player_left',
          playerId
        };

        clientSockets.forEach(clientWs => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify(leaveMsg));
          }
        });
      }
    });
  });

  return httpServer;
}