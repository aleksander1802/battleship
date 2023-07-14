import { botCreation } from '../botForTheGame/dirtyBot.ts';
import {
  CustomWebSocket,
  Player,
  Request,
} from '../../src/model/types/index.ts';
import { players } from './server.ts';

export function handleLogin(ws: CustomWebSocket, request: Request) {
  const { name, password, index }: Player = JSON.parse(request.data);

  const foundPlayer = players.find(
    (player) => player.name === name && player.password === password,
  ) as Player;

  if (!foundPlayer) {
    const response = {
      type: 'reg',
      data: JSON.stringify({
        error: true,
        errorText: 'Invalid password',
      }),
      id: 0,
    };
    console.log('Invalid password');

    ws.send(JSON.stringify(response));
    return;
  } else {
    const response = {
      type: 'reg',
      data: JSON.stringify({
        name: name,
        index: index,
        error: false,
        errorText: '',
      }),
      id: 0,
    };

    ws.send(JSON.stringify(response));
    botCreation(players);
  }
}
