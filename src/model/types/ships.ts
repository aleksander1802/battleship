import { MatrixCells } from './matrix.ts';

export type ShipType = 'small' | 'medium' | 'large' | 'huge';

interface Position {
  x: number;
  y: number;
}

export interface Ship {
  position: Position;
  direction: boolean;
  length: number;
  type: ShipType;
}

export interface AddShipsData {
  gameId: string;
  ships: Ship[];
  indexPlayer: string;
}

export interface AddShipsPayload {
  type: string;
  data: AddShipsData;
  id: number;
}

export interface AddShipsRequest {
  type: string;
  data: string;
  id: number;
}

export interface Coordinates {
  x: number;
  y: number;
}

export interface UpdatedCoordinates {
  x: number;
  y: number;
  status: MatrixCells;
}

export interface PlayerCoordinates {
  x: number;
  y: number;
  gameId: string;
  indexPlayer: string;
}

type inGameCommands = 'attack' | 'randomAttack' | 'turn' | 'finish';
export type Status = 'miss' | 'killed' | 'shot' | 'retry';

export interface Attack {
  type: inGameCommands;
  data: {
    gameId: string;
    x: number;
    y: number;
    indexPlayer: string;
  };
  id: 0;
}

export interface AttackFeedback {
  type: inGameCommands;
  data: {
    position: Coordinates;
    currentPlayer: number;
    status: Status;
  };
  id: 0;
}

export interface RandomAttack {
  type: inGameCommands;
  data: {
    gameId: number;
    indexPlayer: number;
  };
  id: 0;
}
