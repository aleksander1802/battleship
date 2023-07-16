import { botCreation } from '../botForTheGame/dirtyBot.ts';
import {
  CustomWebSocket,
  Player,
  Request,
} from '../../src/model/types/index.ts';

import { registerPlayer } from '../db/db.ts';
import { players } from './server.ts';

export function handleRegistration(ws: CustomWebSocket, request: Request) {
  const { name, password }: Player = JSON.parse(request.data);

  const empty = /^\S+$/;

  if (name.length < 5 || password.length < 5) {
    const response = {
      type: 'reg',
      data: JSON.stringify({
        error: true,
        errorText: 'Minimum 5 characters',
      }),
      id: 0,
    };

    ws.send(JSON.stringify(response));
  } else if (!empty.test(name) || !empty.test(password)) {
    const response = {
      type: 'reg',
      data: JSON.stringify({
        error: true,
        errorText:
          'Please note that your password or username should not contain any spaces.',
      }),
      id: 0,
    };

    ws.send(JSON.stringify(response));
  } else {
    const response = registerPlayer(name, password, ws);

    ws.send(JSON.stringify(response));

    botCreation(players);
  }
}
