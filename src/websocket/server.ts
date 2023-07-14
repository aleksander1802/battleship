import {
  AttackFeedback,
  CustomWebSocket,
  FinishMessage,
  IndexRoom,
  Player,
  Request,
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
  UpdatedCoordinates,
} from '../../src/model/types/ships.ts';

import { handleRegistration } from './handleRegistration.ts';
import { handleRoomCreation } from './handleRoomCreation.ts';
import {
  GameMatrix,
  MatrixCells,
  PlayerMatrixForTheGame,
} from '../../src/model/types/matrix.ts';
import { createMatrix } from './matrixCreate.ts';
import { checkAttack } from './checkAttack.ts';
import { updateRoom } from './updateRoom.ts';
import { handleLogin } from './handleLogin.ts';
import { playerExists } from '../db/db.ts';
import { generateBotShips } from '../botForTheGame/botShips.ts';

const webSocketPort = 3000;

export let players: Player[] = [];
export let connections: CustomWebSocket[] = [];
export let roomUsers: Room[] = [];
let currentGames: PlayerMatrixForTheGame[] = [];
let winners: Winner[] = [];

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
        handleBotAttack(request);
      } else {
        handleAttack(request, false);
      }
      break;
    case 'randomAttack':
      handleAttack(request, true);
      break;
    case 'single_play':
      singlePlay(ws);
      break;
  }
}

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

  const arrayForGameStarting: PlayerMatrixForTheGame[] = currentGames.filter(
    (game) => game.currentGameId === shipsData.gameId,
  );

  const currentBot = players.find((player) => player.name === 'BOT') as Player;

  const isGameWithBot = arrayForGameStarting.some(
    (game) => game.indexPlayer === currentBot.index,
  );

  if (arrayForGameStarting.length === 2 && !isGameWithBot) {
    startTheGame(arrayForGameStarting);
  }

  if (isGameWithBot) {
    const arrayForGameWithBot = currentGames.filter(
      (game) => game.currentGameId === shipsData.indexPlayer,
    );

    startGameWithBot(arrayForGameWithBot);
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

const playerTurn = (
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

const handleAttack = (request: Request, bot: boolean) => {
  const currentPlayer: PlayerCoordinates = JSON.parse(request.data);
  let coordinates: Coordinates;

  const currentGameArray = currentGames.filter(
    (game) => game.currentGameId === currentPlayer.gameId,
  );

  const enemy = currentGameArray.filter(
    (enemy) => enemy.indexPlayer !== currentPlayer.indexPlayer,
  )[0];

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

  console.table(updatedMatrix);

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

  type Response = {
    type: string;
    data: string;
    id: number;
  };

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
        (game) => game.currentGameId !== currentPlayer.indexPlayer,
      );
      return;
    }
    playerTurn(connection1, connection2, currentPlayer.indexPlayer);
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

const getUpdatedCoordinates = (
  originalMatrix: MatrixCells[][],
  updatedMatrix: MatrixCells[][],
): UpdatedCoordinates[] => {
  const updatedCoordinates: UpdatedCoordinates[] = [];

  for (let y = 0; y < updatedMatrix.length; y += 1) {
    for (let x = 0; x < updatedMatrix[y].length; x += 1) {
      const coordinate = { x, y, status: updatedMatrix[y][x] };

      if (originalMatrix[y][x] !== updatedMatrix[y][x]) {
        updatedCoordinates.push(coordinate);
      }
    }
  }

  return updatedCoordinates;
};

function isAllShipsDestroyed(matrix: GameMatrix): boolean {
  for (const row of matrix) {
    for (const cell of row) {
      if (
        cell === 'small' ||
        cell === 'medium' ||
        cell === 'large' ||
        cell === 'huge'
      ) {
        return false;
      }
    }
  }
  return true;
}

function generateRandomCoordinates(matrix: MatrixCells[][]): {
  x: number;
  y: number;
} {
  const excludedValues = ['miss', 'killed', 'shot'];

  const validCoordinates = [];
  for (let y = 0; y < matrix.length; y += 1) {
    for (let x = 0; x < matrix[y].length; x += 1) {
      if (!excludedValues.includes(matrix[y][x])) {
        validCoordinates.push({ x, y });
      }
    }
  }

  const randomIndex = Math.floor(Math.random() * validCoordinates.length);
  return validCoordinates[randomIndex];
}

const updateWinners = (id: string) => {
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

  const response = {
    type: 'update_winners',
    data: JSON.stringify(winners),
    id: 0,
  };

  connections.forEach((ws) => {
    ws.send(JSON.stringify(response));
  });
};

const singlePlay = (ws: CustomWebSocket) => {
  const currentBot = players.find((player) => player.name === 'BOT') as Player;

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

const isGameWithBot = (request: Request) => {
  const data = JSON.parse(request.data) as PlayerCoordinates;

  const bot = currentGames
    .filter((game) => game.currentGameId === data.gameId)
    .filter((player) => player.currentGameId !== player.indexPlayer)[0];

  return (
    players.find((player) => player.index === bot.indexPlayer)?.name === 'BOT'
  );
};

const handleBotAttack = (request: Request) => {
  console.log('BOTOTOTOTOTOTOTOTO');
};
