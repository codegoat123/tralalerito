export interface PlayerState {
  id: string;
  username: string;
  position: { x: number; y: number; z: number };
  rotation: number;
  isMoving: boolean;
}

export interface SnakeState {
  id: string;
  position: { x: number; y: number; z: number };
  targetPlayerId: string | null;
}

export type ClientToServerMessage =
  | { type: 'join'; username?: string }
  | { type: 'update_position'; position: { x: number; y: number; z: number }; rotation: number; isMoving: boolean }
  | { type: 'disconnect' };

export type ServerToClientMessage =
  | { type: 'welcome'; playerId: string; username: string }
  | { type: 'players_update'; players: Record<string, PlayerState> }
  | { type: 'snakes_update'; snakes: SnakeState[] }
  | { type: 'player_joined'; player: PlayerState }
  | { type: 'player_left'; playerId: string };

// Random username generator
const adjectives = [
  'Happy', 'Silly', 'Brave', 'Fancy', 'Crazy', 'Wild', 'Cool', 'Epic', 
  'Super', 'Mega', 'Tiny', 'Giant', 'Swift', 'Wise', 'Lucky', 'Jolly'
];

const nouns = [
  'Tralalerito', 'Penguin', 'Dragon', 'Ninja', 'Wizard', 'Robot', 'Knight',
  'Pirate', 'Viking', 'Samurai', 'Panda', 'Fox', 'Wolf', 'Bear', 'Tiger', 'Lion'
];

export function generateRandomUsername(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 100);
  return `${adj}${noun}${num}`;
}
