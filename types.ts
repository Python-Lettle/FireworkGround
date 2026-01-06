export interface Coordinate {
  x: number;
  y: number;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  isCurrentUser: boolean;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  timestamp: number;
  color: string;
}

export interface GameStats {
  fireworksLaunched: number;
  explosions: number;
}
