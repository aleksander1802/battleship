import { PlayerCoordinates } from '../model/types/ships.ts';
import { Request } from '../model/types/index.ts';
import { currentGames, players } from './server.ts';

export const isGameWithBot = (request: Request) => {
  const data = JSON.parse(request.data) as PlayerCoordinates;

  const bot = currentGames
    .filter((game) => game.currentGameId === data.gameId)
    .filter((player) => player.currentGameId !== player.indexPlayer)[0];

  if (bot === undefined) return;

  const botIndex = players.find((player) => player.index === bot.indexPlayer);

  if (botIndex !== undefined && botIndex.name === 'BOT') {
    return true;
  } else {
    return false;
  }
};
