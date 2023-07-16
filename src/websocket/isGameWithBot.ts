import { PlayerCoordinates } from '../model/types/ships.ts';
import { Player, Request } from '../model/types/index.ts';
import { currentGames, players } from './server.ts';

export const isGameWithBot = (request: Request) => {
  const data = JSON.parse(request.data) as PlayerCoordinates;

  const bot = currentGames.filter((game) => game.currentGameId === data.gameId);
  if (bot === undefined) return;

  if (bot.length === 2) {
    const bot1 = players.find(
      (player) => player.index === bot[0].indexPlayer,
    ) as Player;
    const bot2 = players.find(
      (player) => player.index === bot[1].indexPlayer,
    ) as Player;

    return bot1.name === 'BOT' || bot2.name === 'BOT';
  }
};
