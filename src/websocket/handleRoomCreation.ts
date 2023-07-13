import { CustomWebSocket, Player } from '../../src/model/types/index.ts';
import { roomUsers } from './server.ts';
import { players } from './server.ts';
import { updateRoom } from './updateRoom.ts';

export function handleRoomCreation(ws: CustomWebSocket) {
  if (roomUsers.find((room) => room.roomId === ws.index)) return;

  const creator = players.find((player) => player.index === ws.index) as Player;

  const newRoom = {
    roomId: creator.index,
    roomUsers: [
      {
        name: creator.name,
        index: creator.index,
      },
    ],
  };

  roomUsers.push(newRoom);

  updateRoom();
}
