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
  const snakes: SnakeState[] = [];
  const clientSockets = new Map<string, WebSocket>();

  // Initialize snakes (5 snakes on the map)
  for (let i = 0; i < 5; i++) {
    snakes.push({
      id: `snake-${i}`,
      position: {
        x: Math.random() * 160 - 80,
        y: 0,
        z: Math.random() * 160 - 80
      },
      targetPlayerId: null
    });
  }

  // Snake AI update loop
  setInterval(() => {
    snakes.forEach(snake => {
      let closestPlayer: PlayerState | null = null;
      let closestDistance = Infinity;

      // Find closest player within range
      players.forEach((player: PlayerState) => {
        const dx = player.position.x - snake.position.x;
        const dz = player.position.z - snake.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance < 30 && distance < closestDistance) {
          closestDistance = distance;
          closestPlayer = player;
        }
      });

      // Move towards closest player
      if (closestPlayer !== null) {
        snake.targetPlayerId = closestPlayer.id;
        const dx = closestPlayer.position.x - snake.position.x;
        const dz = closestPlayer.position.z - snake.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance > 2) {
          const speed = 0.08;
          snake.position.x += (dx / distance) * speed;
          snake.position.z += (dz / distance) * speed;
        }
      } else {
        snake.targetPlayerId = null;
      }
    });

    // Broadcast snake positions to all clients
    const snakeMessage: ServerToClientMessage = {
      type: 'snakes_update',
      snakes: snakes
    };

    clientSockets.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(snakeMessage));
      }
    });
  }, 50);

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

          // Send current snakes to new player
          const snakesUpdate: ServerToClientMessage = {
            type: 'snakes_update',
            snakes
          };
          ws.send(JSON.stringify(snakesUpdate));

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
            // Update player state
            player.position = message.position;
            player.rotation = message.rotation;
            player.isMoving = message.isMoving;

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