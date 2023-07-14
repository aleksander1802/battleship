import {
  CustomWebSocket,
  Player,
  Request,
} from '../../src/model/types/index.ts';

import { registerPlayer } from '../db/db.ts';

export function handleRegistration(ws: CustomWebSocket, request: Request) {
  const { name, password }: Player = JSON.parse(request.data);
  

  if (name.length < 5) {
    const response = {
      type: 'reg',
      data: JSON.stringify({
        error: true,
        errorText: 'Minimum 5 characters',
      }),
      id: 0,
    };

    ws.send(JSON.stringify(response));
  } else if (password.length < 5) {
    const response = {
      type: 'reg',
      data: JSON.stringify({
        error: true,
        errorText: 'Minimum 5 characters',
      }),
      id: 0,
    };

    ws.send(JSON.stringify(response));
  } else {
    const response = registerPlayer(name, password, ws);

    ws.send(JSON.stringify(response));

    // const loginResponse = loginPlayer(ws.index);

    // ws.send(JSON.stringify(loginResponse));
  }
}


