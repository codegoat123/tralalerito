import { useEffect, useRef, useState } from 'react';
import type { PlayerState, SnakeState, ServerToClientMessage, ClientToServerMessage } from '@shared/multiplayer-types';

export function useMultiplayer() {
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [myUsername, setMyUsername] = useState<string>('');
  const [players, setPlayers] = useState<Record<string, PlayerState>>({});
  const [snakes, setSnakes] = useState<SnakeState[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to multiplayer server');
      setIsConnected(true);
      
      // Join the game
      const joinMsg: ClientToServerMessage = { type: 'join' };
      ws.send(JSON.stringify(joinMsg));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as ServerToClientMessage;

        switch (message.type) {
          case 'welcome':
            setMyPlayerId(message.playerId);
            setMyUsername(message.username);
            console.log(`Welcome! You are ${message.username} (${message.playerId})`);
            break;

          case 'players_update':
            setPlayers(message.players);
            break;

          case 'snakes_update':
            setSnakes(message.snakes);
            break;

          case 'player_joined':
            setPlayers(prev => ({
              ...prev,
              [message.player.id]: message.player
            }));
            console.log(`${message.player.username} joined the game`);
            break;

          case 'player_left':
            setPlayers(prev => {
              const newPlayers = { ...prev };
              delete newPlayers[message.playerId];
              return newPlayers;
            });
            console.log(`Player left: ${message.playerId}`);
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from multiplayer server');
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, []);

  const updatePosition = (position: { x: number; y: number; z: number }, rotation: number, isMoving: boolean) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const msg: ClientToServerMessage = {
        type: 'update_position',
        position,
        rotation,
        isMoving
      };
      wsRef.current.send(JSON.stringify(msg));
    }
  };

  return {
    myPlayerId,
    myUsername,
    players,
    snakes,
    isConnected,
    updatePosition
  };
}
