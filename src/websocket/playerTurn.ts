import { CustomWebSocket } from '../model/types/index.ts';

export const playerTurn = (
  firstPlayer: CustomWebSocket,
  secondPlayer: CustomWebSocket,
  index: string,
) => {
  const response = {
    type: 'turn',
    data: JSON.stringify({
      currentPlayer: index,
    }),
    id: 0,
  };

  firstPlayer.send(JSON.stringify(response));
  secondPlayer.send(JSON.stringify(response));
};
