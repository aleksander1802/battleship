import { connections, roomUsers } from './server.ts';

export const updateRoom = () => {
  const creator = roomUsers.filter((room) => room.roomUsers.length === 1);

  const update = JSON.stringify(creator);

  const response = {
    type: 'update_room',
    data: update,
    id: 0,
  };

  connections.forEach((ws) => {
    ws.send(JSON.stringify(response));
  });
};
