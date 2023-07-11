// import { Player } from '../../src/model/types/index.ts';
import { players } from '../../src/websocket/server.ts';

export function playerExists(name: string) {
  return players.some((player) => player.name === name);
}

export function registerPlayer(name: string, password: string, index: string) {
  
    const newPlayer = {
      name,
      password,
      index,
      wins: 0,
    };

    players.push(newPlayer);

    const response = {
      type: 'reg',
      data: JSON.stringify({
        name,
        index,
        error: false,
        errorText: '',
      }),
      id: 0,
    };

    return response;
  
}

// export function loginPlayer(index: string) {
//   const foundPlayer = players.find(
//     (player) => player.index === index,
//   ) as Player;

//   if (!foundPlayer) {
//     return { index: -1, error: true, errorText: 'Invalid credentials' };
//   }

//   const response = {
//     type: 'reg',
//     data: JSON.stringify({
//       name: foundPlayer.name,
//       password: foundPlayer.password,
//     }),
//     id: 0,
//   };

//   return response;
// }
