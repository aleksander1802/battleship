import { CustomWebSocket, Player } from '../../src/model/types/index.ts';
import { roomUsers } from './server.ts';
import { players } from '../db/db.ts';
import { updateRoom } from './updateRoom.ts';

export function handleRoomCreation(ws: CustomWebSocket) {
  if (roomUsers.length > 0) return;

  const creator = players.find((player) => player.index === ws.index) as Player;

  roomUsers.push(creator);

  const response = {
    type: 'create_room',
    data: '',
  };

  ws.send(JSON.stringify(response));

  if (roomUsers.length === 1) {
    updateRoom();
  }
}
