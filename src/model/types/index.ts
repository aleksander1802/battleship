import { WebSocket } from 'ws';

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

export interface RoomUsers {
  name: string;
  index: string;
}

export interface CustomWebSocket extends WebSocket {
  index: string;
}

export type FinishMessage = {
  type: 'finish';
  data: string;
  id: number;
};
