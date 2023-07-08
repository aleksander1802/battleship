import { CustomWebSocket, Player, Request } from '../../src/model/types/index.ts';
import * as db from '../db/db.ts';

export function handleLogin(ws: CustomWebSocket, request: Request) {
  const { name, password }: Player = JSON.parse(request.data);

  db.loginPlayer(name, password);

  const response = {
    type: 'reg',
    data: JSON.stringify({
      name,
      password,
    }),
    id: 0,
  };

  ws.send(JSON.stringify(response));
}
