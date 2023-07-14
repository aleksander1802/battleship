import { connections, winners } from './server.ts';

export const winnerUpdateResponse = () => {
  if (winners.length === 0) return;

  const response = {
    type: 'update_winners',
    data: JSON.stringify(winners),
    id: 0,
  };

  connections.forEach((ws) => {
    ws.send(JSON.stringify(response));
  });
};
