import { Player } from '../../src/model/types/index';

export const players: Player[] = [];

export function playerExists(name: string) {
  return players.some((player) => player.name === name);
}

export function registerPlayer(name: string, password: string) {
  if (playerExists(name)) {
    return { index: -1, error: true, errorText: 'Player already exists' };
  }

  console.log(name, password);

  const newPlayer = {
    name,
    password,
    wins: 0,
  };

  players.push(newPlayer);
  console.log(players);

  return {
    index: players.length,
    error: false,
    errorText: '',
  };
}

export function loginPlayer(name: string, password: string) {
  const foundPlayer = players.find(
    (player) => player.name === name && player.password === password,
  );

  if (!foundPlayer) {
    return { index: -1, error: true, errorText: 'Invalid credentials' };
  }

  return {
    index: players.indexOf(foundPlayer),
    error: false,
    errorText: '',
  };
}
