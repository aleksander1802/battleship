import {
  CustomWebSocket,
  Player,
  Request,
} from '../../src/model/types/index.ts';
import { connections, players } from '../../src/websocket/server.ts';
import { v4 as uuidv4 } from 'uuid';

export function playerExists(request: Request) {
  const { name }: Player = JSON.parse(request.data);
  return players.some((player) => player.name === name);
}

export function registerPlayer(
  name: string,
  password: string,
  ws: CustomWebSocket,
) {
  const userId = uuidv4();

  ws.index = userId;

  const newPlayer = {
    name,
    password,
    index: ws.index,
    wins: 0,
  };

  players.push(newPlayer);
  connections.push(ws);

  const response = {
    type: 'reg',
    data: JSON.stringify({
      name,
      index: ws.index,
      error: false,
      errorText: '',
    }),
    id: 0,
  };

  return response;
}
