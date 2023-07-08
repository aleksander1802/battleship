import { CustomWebSocket, Player, Request } from '../../src/model/types/index.ts';
import * as db from '../db/db.ts';

export function handleRegistration(ws: CustomWebSocket, request: Request) {
  const { name, password }: Player = JSON.parse(request.data);

  const { error, errorText } = db.registerPlayer(name, password, ws.index);

  const response = {
    type: 'reg',
    data: JSON.stringify({
      name,
      index: ws.index,
      error,
      errorText,
    }),
    id: 0,
  };

  ws.send(JSON.stringify(response));
}
