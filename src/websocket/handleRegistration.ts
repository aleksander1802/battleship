import {
  CustomWebSocket,
  Player,
  Request,
} from '../../src/model/types/index.ts';
import * as db from '../db/db.ts';
import { registerPlayer } from '../db/db.ts';

export function handleRegistration(ws: CustomWebSocket, request: Request) {
  const requestData: Player = JSON.parse(request.data);

  if (db.playerExists(requestData.name)) {
    const response = {
      type: 'reg',
      data: JSON.stringify({
        name: requestData.name,
        index: ws.index,
        error: true,
        errorText: 'Player already exists',
      }),
      id: 0,
    };

    ws.send(JSON.stringify(response));
  } else if (requestData.name.length < 5) {
    const response = {
      type: 'reg',
      data: JSON.stringify({
        name: requestData.name,
        index: ws.index,
        error: true,
        errorText: 'Minimum 5 characters',
      }),
      id: 0,
    };

    ws.send(JSON.stringify(response));
  } else if (requestData.password.length < 5) {
    const response = {
      type: 'reg',
      data: JSON.stringify({
        name: requestData.name,
        index: ws.index,
        error: true,
        errorText: 'Minimum 5 characters',
      }),
      id: 0,
    };

    ws.send(JSON.stringify(response));
  } else {
    const { name, password }: Player = JSON.parse(request.data);

    const response = registerPlayer(name, password, ws.index);

    ws.send(JSON.stringify(response));

    // const loginResponse = loginPlayer(ws.index);

    // ws.send(JSON.stringify(loginResponse));
  }
}
