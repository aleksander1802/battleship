import { Player } from '../model/types/index.ts';
import { v4 as uuidv4 } from 'uuid';

export const botCreation = (players: Player[]) => {
  const botId = uuidv4();

  const newBot = {
    name: 'BOT',
    password: botId,
    index: botId,
    wins: 0,
  };

  players.push(newBot);
};
