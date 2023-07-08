import { connections, roomUsers } from './server.ts';

export const updateRoom = () => {
  const update = JSON.stringify([
    {
      roomId: roomUsers[0].index,
      roomUsers: roomUsers,
    },
  ]);

  const response = {
    type: 'update_room',
    data: update,
    id: 0,
  };

  connections.forEach((ws) => {
    ws.send(JSON.stringify(response));
  });
};
