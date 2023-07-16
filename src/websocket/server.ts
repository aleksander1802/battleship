import {
  AttackFeedback,
  CustomWebSocket,
  FinishMessage,
  IndexRoom,
  Player,
  Request,
  Response,
  Room,
  Winner,
} from '../model/types/index.ts';

import { WebSocketServer } from 'ws';

import {
  AddShipsData,
  AddShipsRequest,
  Coordinates,
  PlayerCoordinates,
  Ship,
} from '../../src/model/types/ships.ts';

import { handleRegistration } from './handleRegistration.ts';
import { handleRoomCreation } from './handleRoomCreation.ts';
import { PlayerMatrixForTheGame } from '../../src/model/types/matrix.ts';
import { createMatrix } from './matrixCreate.ts';
import { checkAttack } from './checkAttack.ts';
import { updateRoom } from './updateRoom.ts';
import { handleLogin } from './handleLogin.ts';
import { playerExists } from '../db/db.ts';
import { generateBotShips } from '../botForTheGame/botShips.ts';
import { winnerUpdateResponse } from './updateWinners.ts';
import { getUpdatedCoordinates } from './getUpdatedCoordinates.ts';
import { isAllShipsDestroyed } from './isAllShipsDestroyed.ts';
import { generateRandomCoordinates } from './generateRandomCoordinates.ts';
import { playerTurn } from './playerTurn.ts';
import { isGameWithBot } from './isGameWithBot.ts';

const webSocketPort = 3000;

export let players: Player[] = [];
export let connections: CustomWebSocket[] = [];
export let roomUsers: Room[] = [];
export let currentGames: PlayerMatrixForTheGame[] = [];
export let winners: Winner[] = [];

export const wss = new WebSocketServer({
  port: webSocketPort,
});

wss.on('connection', (ws: CustomWebSocket) => {
  console.log(`A client connected on the ${webSocketPort} webSocketPort`);

  ws.on('message', (message: string) => {
    const request = JSON.parse(message);
    handleRequest(ws, request);
  });

  ws.on('close', () => {
    console.log('A client disconnected');

    connections = connections.filter(
      (connection) => connection.index !== ws.index,
    );

    roomUsers = roomUsers.filter((room) => room.roomId !== ws.index);

    updateRoom();

    flawlessWictory(ws);
  });
});

export function handleRequest(ws: CustomWebSocket, request: Request) {
  console.log(request);

  switch (request.type) {
    case 'reg':
      if (playerExists(request)) {
        handleLogin(ws, request);
      } else {
        handleRegistration(ws, request);
      }
      updateRoom();
      winnerUpdateResponse();
      break;
    case 'create_room':
      handleRoomCreation(ws);
      break;
    case 'add_user_to_room':
      addUserToRoomAndStartTheGame(ws, request);
      break;
    case 'add_ships':
      addShips(request);
      break;
    case 'attack':
      if (isGameWithBot(request)) {
        handleBotAttack(ws, request, false);
      } else {
        handleAttack(request, false);
      }
      break;
    case 'randomAttack':
      if (isGameWithBot(request)) {
        handleBotAttack(ws, request, true);
      } else {
        handleAttack(request, true);
      }
      break;
    case 'single_play':
      singlePlay(ws);
      break;
  }
}

const flawlessWictory = (ws: CustomWebSocket) => {
  const isThePlayerWasInTheGame = currentGames.filter(
    (game) => game.currentGameId === ws.index,
  );

  if (isThePlayerWasInTheGame.length === 2) {
    const playerWhoLeftTheGame = isThePlayerWasInTheGame.find(
      (player) => player.indexPlayer === ws.index,
    ) as PlayerMatrixForTheGame;

    const winnerOfTheGame = isThePlayerWasInTheGame.filter(
      (player) => player.indexPlayer !== playerWhoLeftTheGame.indexPlayer,
    )[0];

    currentGames = currentGames.filter(
      (game) => game.currentGameId !== playerWhoLeftTheGame.currentGameId,
    );

    const connection1 = connections.find(
      (ws) => ws.index === winnerOfTheGame.indexPlayer,
    );

    const data = JSON.stringify({
      winPlayer: winnerOfTheGame.indexPlayer,
    });

    const response: FinishMessage = {
      type: 'finish',
      data,
      id: 0,
    };

    if (connection1) {
      connection1.send(JSON.stringify(response));
    }

    updateWinners(winnerOfTheGame.indexPlayer);
  }
};

const addUserToRoomAndStartTheGame = (
  ws: CustomWebSocket,
  request: Request,
) => {
  addUserToExistRoom(ws, request);
};

const addUserToExistRoom = (ws: CustomWebSocket, request: Request) => {
  const roomIndex = JSON.parse(request.data) as IndexRoom;

  const isThePlayerTheCreatorOfTheRoom = roomIndex.indexRoom === ws.index;

  if (isThePlayerTheCreatorOfTheRoom) return;

  const response = {
    type: 'add_user_to_room',
    data: JSON.stringify({
      indexRoom: roomIndex,
    }),
    id: 0,
  };

  const addPlayerToRoom = players.find(
    (player) => player.index === ws.index,
  ) as Player;

  const theRoomToWhichWeAddThePlayer = roomUsers.find(
    (room) => room.roomId === roomIndex.indexRoom,
  ) as Room;

  if (roomUsers.find((room) => room.roomId === addPlayerToRoom.index)) {
    roomUsers = roomUsers.filter(
      (room) => room.roomId !== addPlayerToRoom.index,
    );
  }

  theRoomToWhichWeAddThePlayer.roomUsers.push(addPlayerToRoom);

  ws.send(JSON.stringify(response));
  updateRoom();
  placementOfShipsForTheGame(request);
};

const placementOfShipsForTheGame = (request: Request) => {
  const req = JSON.parse(request.data) as IndexRoom;
  const currentRoom = roomUsers.find(
    (room) => room.roomId === req.indexRoom,
  ) as Room;

  const creator = currentRoom.roomUsers.find(
    (player) => player.index === req.indexRoom,
  ) as Player;

  const secondPlayer = currentRoom.roomUsers.filter(
    (player) => player.index !== creator.index,
  )[0];

  const data1 = JSON.stringify({
    idGame: creator.index,
    idPlayer: creator.index,
  });

  const data2 = JSON.stringify({
    idGame: creator.index,
    idPlayer: secondPlayer.index,
  });

  const response1 = {
    type: 'create_game',
    data: data1,
    id: 0,
  };

  const response2 = {
    type: 'create_game',
    data: data2,
    id: 0,
  };

  const connection1 = connections.find(
    (item) => item.index === creator.index,
  ) as CustomWebSocket;

  const connection2 = connections.find(
    (item) => item.index === secondPlayer.index,
  ) as CustomWebSocket;

  connection1.send(JSON.stringify(response1));
  connection2.send(JSON.stringify(response2));

  roomUsers = roomUsers.filter((room) => room.roomId !== currentRoom.roomId);

  updateRoom();
};

const addShips = (request: AddShipsRequest) => {
  const shipsData = JSON.parse(request.data) as AddShipsData;

  const ships: Ship[] = shipsData.ships;

  const matrix = createMatrix(ships);

  const player: PlayerMatrixForTheGame = {
    currentGameId: shipsData.gameId,
    ships: matrix,
    indexPlayer: shipsData.indexPlayer,
    turn: false,
  };

  currentGames.push(player);

  const currentGame = currentGames.filter(
    (game) => game.currentGameId === player.currentGameId,
  );

  if (currentGame.length === 2) {
    const bot1 = players.find(
      (player) => player.index === currentGame[0].indexPlayer,
    ) as Player;
    const bot2 = players.find(
      (player) => player.index === currentGame[1].indexPlayer,
    ) as Player;

    if (bot1.name === 'BOT' || bot2?.name === 'BOT') {
      startGameWithBot(currentGame);
      console.log(currentGames);
    } else {
      const arrayForGameStarting: PlayerMatrixForTheGame[] =
        currentGames.filter((game) => game.currentGameId === shipsData.gameId);

      if (arrayForGameStarting.length === 2) {
        startTheGame(arrayForGameStarting);
      }
    }
  }
};

const startTheGame = (playersInGame: PlayerMatrixForTheGame[]) => {
  const gameCreator = playersInGame.find(
    (client) => client.indexPlayer === client.currentGameId,
  ) as PlayerMatrixForTheGame;

  const secondPlayer = playersInGame.filter(
    (client) =>
      client.indexPlayer !== gameCreator.indexPlayer &&
      gameCreator.currentGameId === gameCreator.indexPlayer,
  )[0];

  const creatorClientData = JSON.stringify({
    ships: gameCreator.ships,
    currentPlayerIndex: gameCreator.indexPlayer,
  });
  const secondPlayerData = JSON.stringify({
    ships: secondPlayer.ships,
    currentPlayerIndex: secondPlayer.indexPlayer,
  });

  const response1 = {
    type: 'start_game',
    data: creatorClientData,
    id: 0,
  };

  const response2 = {
    type: 'start_game',
    data: secondPlayerData,
    id: 0,
  };

  const connection1 = connections.find(
    (item) => item.index === gameCreator.indexPlayer,
  ) as CustomWebSocket;

  const connection2 = connections.find(
    (item) => item.index === secondPlayer.indexPlayer,
  ) as CustomWebSocket;

  connection1.send(JSON.stringify(response1));
  connection2.send(JSON.stringify(response2));

  gameCreator.turn = true;

  playerTurn(connection1, connection2, gameCreator.indexPlayer);
};

const handleAttack = (request: Request, bot: boolean) => {
  const currentPlayer: PlayerCoordinates = JSON.parse(request.data);
  let coordinates: Coordinates;

  const currentGameArray = currentGames.filter(
    (game) => game.currentGameId === currentPlayer.gameId,
  );

  const enemy = currentGameArray.filter(
    (enemy) => enemy.indexPlayer !== currentPlayer.indexPlayer,
  )[0];

  if (enemy === undefined) return;

  const enemyShips = enemy.ships.map((rows) => [...rows]);

  if (enemy.turn) return;

  if (bot) {
    coordinates = generateRandomCoordinates(enemyShips);
  } else {
    coordinates = {
      x: currentPlayer.x,
      y: currentPlayer.y,
    };
  }

  const { status, updatedMatrix } = checkAttack(
    enemyShips,
    coordinates,
  ) as AttackFeedback;

  currentGames = currentGames.map((item) =>
    item.indexPlayer === enemy.indexPlayer
      ? { ...item, ships: updatedMatrix }
      : item,
  );

  const connection1 = connections.find(
    (item) => item.index === currentPlayer.indexPlayer,
  ) as CustomWebSocket;

  const connection2 = connections.find(
    (item) => item.index === enemy.indexPlayer,
  ) as CustomWebSocket;

  if (status === 'retry') {
    const cell = updatedMatrix[currentPlayer.y][currentPlayer.x];

    const response: Response = {
      type: 'attack',
      data: JSON.stringify({
        position: coordinates,
        currentPlayer: currentPlayer.indexPlayer,
        status: cell,
      }),
      id: 0,
    };

    connection1.send(JSON.stringify(response));
    connection2.send(JSON.stringify(response));
    playerTurn(connection1, connection2, currentPlayer.indexPlayer);
  } else if (status === 'shot') {
    const response: Response = {
      type: 'attack',
      data: JSON.stringify({
        position: coordinates,
        currentPlayer: currentPlayer.indexPlayer,
        status: status,
      }),
      id: 0,
    };

    connection1.send(JSON.stringify(response));
    connection2.send(JSON.stringify(response));
    playerTurn(connection1, connection2, currentPlayer.indexPlayer);
  } else if (status === 'killed') {
    const updatedCoordinates = getUpdatedCoordinates(enemyShips, updatedMatrix);

    for (let i = 0; i < updatedCoordinates.length; i++) {
      const coord = updatedCoordinates[i];
      const response: Response = {
        type: 'attack',
        data: JSON.stringify({
          position: {
            x: coord.x,
            y: coord.y,
          },
          currentPlayer: currentPlayer.indexPlayer,
          status: coord.status,
        }),
        id: 0,
      };

      connection1.send(JSON.stringify(response));
      connection2.send(JSON.stringify(response));
    }

    const destroyed = isAllShipsDestroyed(updatedMatrix);
    if (destroyed) {
      const data = JSON.stringify({
        winPlayer: currentPlayer.indexPlayer,
      });

      const response: FinishMessage = {
        type: 'finish',
        data,
        id: 0,
      };

      connection1.send(JSON.stringify(response));
      connection2.send(JSON.stringify(response));

      updateWinners(currentPlayer.indexPlayer);
      currentGames = currentGames.filter(
        (game) => game.currentGameId !== currentPlayer.gameId,
      );

      return;
    } else {
      playerTurn(connection1, connection2, currentPlayer.indexPlayer);
    }
  } else {
    currentGames = currentGames.map((game) => {
      if (game.indexPlayer === currentPlayer.indexPlayer) {
        return { ...game, turn: false };
      } else if (game.indexPlayer === enemy.indexPlayer) {
        return { ...game, turn: true };
      }

      return game;
    });

    const response: Response = {
      type: 'attack',
      data: JSON.stringify({
        position: coordinates,
        currentPlayer: currentPlayer.indexPlayer,
        status: status,
      }),
      id: 0,
    };

    connection1.send(JSON.stringify(response));
    connection2.send(JSON.stringify(response));
    playerTurn(connection1, connection2, enemy.indexPlayer);
  }
};

export const updateWinners = (id: string) => {
  const winner = players.find((player) => player.index === id) as Player;

  players = players.map((player) => {
    if (player.index === id) {
      return { ...player, wins: (player.wins += 1) };
    }

    return player;
  });

  const isWinnerInTheArray = winners.find(
    (player) => player.name === winner.name,
  );

  if (isWinnerInTheArray) {
    winners = winners.map((player) => {
      if (player.name === winner.name) {
        return { ...player, wins: (player.wins += 1) };
      }
      return player;
    });
  } else {
    winners.push(winner);
  }

  winnerUpdateResponse();
};

const singlePlay = (ws: CustomWebSocket) => {
  if (roomUsers.some((room) => room.roomId === ws.index)) {
    roomUsers = roomUsers.filter((room) => room.roomId !== ws.index);
    updateRoom();
  }

  const bots = players.filter((player) => player.name === 'BOT');

  const freeBots: Player[] = [];

  for (let i = 0; i < bots.length; i += 1) {
    const currentBot = bots[i];
    if (!currentGames.some((bot) => bot.indexPlayer === currentBot.index)) {
      freeBots.push(currentBot);
    }
  }

  const currentBot = freeBots[0];

  const data1 = JSON.stringify({
    idGame: ws.index,
    idPlayer: ws.index,
  });

  const response1 = {
    type: 'create_game',
    data: data1,
    id: 0,
  };

  const connection1 = connections.find(
    (item) => item.index === ws.index,
  ) as CustomWebSocket;

  const matrix = generateBotShips();

  const bot: PlayerMatrixForTheGame = {
    currentGameId: ws.index,
    ships: matrix,
    indexPlayer: currentBot.index,
    turn: false,
  };

  currentGames.push(bot);

  connection1.send(JSON.stringify(response1));
};

const startGameWithBot = (arrayForGameWithBot: PlayerMatrixForTheGame[]) => {
  const gameCreator = arrayForGameWithBot.find(
    (client) => client.indexPlayer === client.currentGameId,
  ) as PlayerMatrixForTheGame;

  const creatorClientData = JSON.stringify({
    ships: gameCreator.ships,
    currentPlayerIndex: gameCreator.indexPlayer,
  });

  const response1 = {
    type: 'start_game',
    data: creatorClientData,
    id: 0,
  };

  const connection1 = connections.find(
    (item) => item.index === gameCreator.indexPlayer,
  ) as CustomWebSocket;

  connection1.send(JSON.stringify(response1));

  gameCreator.turn = true;

  playerTurnWithBot(connection1, gameCreator.indexPlayer);
};

const playerTurnWithBot = (firstPlayer: CustomWebSocket, index: string) => {
  const response = {
    type: 'turn',
    data: JSON.stringify({
      currentPlayer: index,
    }),
    id: 0,
  };

  firstPlayer.send(JSON.stringify(response));
};

const handleBotAttack = (
  ws: CustomWebSocket,
  request: Request,
  bot: boolean,
) => {
  const currentPlayer = JSON.parse(request.data) as PlayerCoordinates;

  const isCurrentPlayerBot = players.find(
    (player) => player.index === currentPlayer.indexPlayer,
  ) as Player;

  const currentGame = currentGames.filter(
    (player) => player.currentGameId === ws.index,
  );

  if (isCurrentPlayerBot.name === 'BOT') {
    const playerAkaEnemy = currentGame.find(
      (game) => game.indexPlayer == ws.index,
    ) as PlayerMatrixForTheGame;

    if (playerAkaEnemy === undefined) return;

    setTimeout(() => {
      botAttack(playerAkaEnemy, request);
    }, 1000);
  } else {
    let coordinates: Coordinates;

    const player = currentGame.find(
      (game) => game.indexPlayer === ws.index,
    ) as PlayerMatrixForTheGame;

    const enemy = currentGame.filter(
      (game) => game.indexPlayer !== player.indexPlayer,
    )[0];

    if (enemy === undefined) return;

    const enemyShips = enemy.ships;

    if (bot) {
      coordinates = generateRandomCoordinates(enemyShips);
    } else {
      coordinates = {
        x: currentPlayer.x,
        y: currentPlayer.y,
      };
    }

    const { status, updatedMatrix } = checkAttack(
      enemyShips,
      coordinates,
    ) as AttackFeedback;

    currentGames = currentGames.map((item) =>
      item.indexPlayer === enemy.indexPlayer
        ? { ...item, ships: updatedMatrix }
        : item,
    );

    const connection1 = connections.find(
      (item) => item.index === player.indexPlayer,
    ) as CustomWebSocket;

    if (status === 'retry') {
      const cell = updatedMatrix[currentPlayer.y][currentPlayer.x];

      const response: Response = {
        type: 'attack',
        data: JSON.stringify({
          position: coordinates,
          currentPlayer: player.indexPlayer,
          status: cell,
        }),
        id: 0,
      };

      connection1.send(JSON.stringify(response));
      playerTurnWithBot(connection1, player.indexPlayer);
    } else if (status === 'shot') {
      const response: Response = {
        type: 'attack',
        data: JSON.stringify({
          position: coordinates,
          currentPlayer: player.indexPlayer,
          status: status,
        }),
        id: 0,
      };

      connection1.send(JSON.stringify(response));
      playerTurnWithBot(connection1, player.indexPlayer);
    } else if (status === 'killed') {
      const updatedCoordinates = getUpdatedCoordinates(
        enemyShips,
        updatedMatrix,
      );

      for (let i = 0; i < updatedCoordinates.length; i++) {
        const coord = updatedCoordinates[i];
        const response: Response = {
          type: 'attack',
          data: JSON.stringify({
            position: {
              x: coord.x,
              y: coord.y,
            },
            currentPlayer: player.indexPlayer,
            status: coord.status,
          }),
          id: 0,
        };

        connection1.send(JSON.stringify(response));
      }

      const destroyed = isAllShipsDestroyed(updatedMatrix);

      if (destroyed) {
        const data = JSON.stringify({
          winPlayer: currentPlayer.indexPlayer,
        });

        const response: FinishMessage = {
          type: 'finish',
          data,
          id: 0,
        };

        connection1.send(JSON.stringify(response));

        updateWinners(player.indexPlayer);

        currentGames = currentGames.filter(
          (game) => game.currentGameId !== ws.index,
        );

        return;
      } else {
        playerTurnWithBot(connection1, currentPlayer.indexPlayer);
      }
    } else {
      currentGames = currentGames.map((game) => {
        if (game.indexPlayer === currentPlayer.indexPlayer) {
          return { ...game, turn: false };
        } else if (game.indexPlayer === enemy.indexPlayer) {
          return { ...game, turn: true };
        }

        return game;
      });

      const response: Response = {
        type: 'attack',
        data: JSON.stringify({
          position: coordinates,
          currentPlayer: currentPlayer.indexPlayer,
          status: status,
        }),
        id: 0,
      };

      connection1.send(JSON.stringify(response));

      playerTurnWithBot(connection1, enemy.indexPlayer);

      setTimeout(() => {
        botAttack(player);
      }, 1000);
    }
  }
};

const botAttack = (realPlayer: PlayerMatrixForTheGame, request?: Request) => {
  let bot: PlayerMatrixForTheGame;
  const currentGame = currentGames.filter(
    (game) => (game.currentGameId = realPlayer.currentGameId),
  );

  if (request) {
    const currentBot = JSON.parse(request.data) as PlayerCoordinates;
    bot = currentGame.find(
      (item) => item.indexPlayer === currentBot.indexPlayer,
    ) as PlayerMatrixForTheGame;
  } else {
    bot = currentGame.filter(
      (item) => item.indexPlayer !== realPlayer.indexPlayer,
    )[0];
  }

  const newCoords = generateRandomCoordinates(realPlayer.ships);

  const { status, updatedMatrix } = checkAttack(realPlayer.ships, newCoords);

  currentGames = currentGames.map((item) =>
    item.indexPlayer === realPlayer.indexPlayer
      ? { ...item, ships: updatedMatrix }
      : item,
  );

  const connectionPlayer = connections.find(
    (item) => item.index === realPlayer.indexPlayer,
  ) as CustomWebSocket;

  if (status === 'shot') {
    const response: Response = {
      type: 'attack',
      data: JSON.stringify({
        position: newCoords,
        currentPlayer: bot.indexPlayer,
        status: status,
      }),
      id: 0,
    };

    const updatedPlayer = {
      currentGameId: realPlayer.currentGameId,
      indexPlayer: realPlayer.indexPlayer,
      ships: updatedMatrix,
      turn: false,
    };

    connectionPlayer.send(JSON.stringify(response));

    playerTurnWithBot(connectionPlayer, bot.indexPlayer);

    setTimeout(() => {
      botAttack(updatedPlayer);
    }, 1000);
  } else if (status === 'killed') {
    const updatedCoordinates = getUpdatedCoordinates(
      realPlayer.ships,
      updatedMatrix,
    );

    for (let i = 0; i < updatedCoordinates.length; i++) {
      const coord = updatedCoordinates[i];
      const response: Response = {
        type: 'attack',
        data: JSON.stringify({
          position: {
            x: coord.x,
            y: coord.y,
          },
          currentPlayer: bot.indexPlayer,
          status: coord.status,
        }),
        id: 0,
      };

      connectionPlayer.send(JSON.stringify(response));
    }

    const updatedPlayer = {
      currentGameId: realPlayer.currentGameId,
      indexPlayer: realPlayer.indexPlayer,
      ships: updatedMatrix,
      turn: false,
    };

    const destroyed = isAllShipsDestroyed(updatedMatrix);
    if (destroyed) {
      const data = JSON.stringify({
        winPlayer: bot.indexPlayer,
      });

      const response: FinishMessage = {
        type: 'finish',
        data,
        id: 0,
      };

      connectionPlayer.send(JSON.stringify(response));

      updateWinners(bot.indexPlayer);
      currentGames = currentGames.filter(
        (game) => game.currentGameId !== realPlayer.currentGameId,
      );
      return;
    } else {
      playerTurnWithBot(connectionPlayer, bot.indexPlayer);

      setTimeout(() => {
        botAttack(updatedPlayer);
      }, 1000);
    }
  } else {
    currentGames = currentGames.map((game) => {
      if (game.indexPlayer === bot.indexPlayer) {
        return { ...game, turn: false };
      } else if (game.indexPlayer === realPlayer.indexPlayer) {
        return { ...game, turn: true };
      }

      return game;
    });

    const response: Response = {
      type: 'attack',
      data: JSON.stringify({
        position: newCoords,
        currentPlayer: bot.indexPlayer,
        status: status,
      }),
      id: 0,
    };

    connectionPlayer.send(JSON.stringify(response));

    playerTurnWithBot(connectionPlayer, realPlayer.indexPlayer);
  }
};
