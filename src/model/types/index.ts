import { WebSocket } from 'ws';
import { Status } from './ships.ts';
import { MatrixCells } from './matrix.ts';

export interface Player {
  name: string;
  password: string;
  index: string;
  wins: number;
}

export interface Request {
  type: string;
  data: string;
  id: number;
}

export type Response = {
  type: string;
  data: string;
  id: number;
};

export interface RoomUsers {
  name: string;
  index: string;
}

export interface Room {
  roomId: string;
  roomUsers: RoomUsers[];
}

export interface CustomWebSocket extends WebSocket {
  index: string;
}

export type IndexRoom = {
  indexRoom: string;
};

export type FinishMessage = {
  type: 'finish';
  data: string;
  id: number;
};

export type AttackFeedback = {
  status: Status;
  updatedMatrix: MatrixCells[][];
};

export interface Winner {
  name: string;
  wins: number;
}
