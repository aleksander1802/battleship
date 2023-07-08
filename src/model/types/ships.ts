type ShipType = 'small' | 'medium' | 'large' | 'huge';

interface Position {
  x: number;
  y: number;
}

interface Ship {
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
