import {
  CustomWebSocket,
  FinishMessage,
  Player,
  Request,
  RoomUsers,
} from '../model/types/index.ts';

import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import {
  AddShipsData,
  AddShipsRequest,
  Coordinates,
  PlayerCoordinates,
  Ship,
  Status,
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

const webSocketPort = 3000;

export let players: Player[] = [];
export let connections: CustomWebSocket[] = [];
export let roomUsers: RoomUsers[] = [];
let currentGames: PlayerMatrixForTheGame[] = [];

export const wss = new WebSocketServer({
  port: webSocketPort,
});

wss.on('connection', (ws: CustomWebSocket) => {
  console.log('A client connected');

  const userId = uuidv4();
  ws.index = userId;

  connections.push(ws);

  ws.on('message', (message: string) => {
    const request = JSON.parse(message);
    handleRequest(ws, request);
  });

  ws.on('close', () => {
    console.log('A client disconnected');

    connections = connections.filter(
      (connection) => connection.index !== ws.index,
    );
    roomUsers = roomUsers.filter((room) => room.index !== ws.index);
    players = players.filter((player) => player.index !== ws.index);
  });
});

function handleRequest(ws: CustomWebSocket, request: Request) {
  console.log(request);

  switch (request.type) {
    case 'reg':
      handleRegistration(ws, request);
      break;
    case 'create_room':
      handleRoomCreation(ws);
      break;
    case 'add_user_to_room':
      addUserToRoomAndStartTheGame(ws);
      break;
    case 'add_ships':
      addShips(ws, request);
      break;
    case 'attack':
      handleAttack(request);
      break;
  }
}

const addUserToRoomAndStartTheGame = (ws: CustomWebSocket) => {
  addUserToExistRoom(ws);
  placementOfShipsForTheGame(ws);
};

const addUserToExistRoom = (ws: CustomWebSocket) => {
  if (roomUsers.length === 2) return;

  const creator = players.find(
    (player) => player.index === roomUsers[0].index,
  ) as Player;

  const response = {
    type: 'add_user_to_room',
    data: JSON.stringify({
      indexRoom: creator.index,
    }),
    id: 0,
  };

  const addUserToRoom = [...players].filter(
    (player) => player.index !== creator.index,
  )[0];

  roomUsers.push(addUserToRoom);

  ws.send(JSON.stringify(response));
};

const placementOfShipsForTheGame = (ws: CustomWebSocket) => {
  const creator = roomUsers.find(
    (player) => player.index === ws.index,
  ) as Player;

  const dataID1 = roomUsers.filter(
    (player) => player.index === creator.index,
  )[0];
  const dataID2 = roomUsers.filter(
    (player) => player.index !== creator.index,
  )[0];

  const data1 = JSON.stringify({
    idGame: creator.index,
    idPlayer: dataID1.index,
  });

  const data2 = JSON.stringify({
    idGame: creator.index,
    idPlayer: dataID2.index,
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

  const connection1 = connections.filter(
    (item) => item.index === creator.index,
  )[0];

  const connection2 = connections.filter(
    (item) => item.index !== creator.index,
  )[0];
  connection1.send(JSON.stringify(response1));
  connection2.send(JSON.stringify(response2));

  roomUsers.length = 0;
};

const addShips = (ws: CustomWebSocket, request: AddShipsRequest) => {
  const ShipsData = JSON.parse(request.data) as AddShipsData;
  const ships: Ship[] = ShipsData.ships;

  const matrix = createMatrix(ships);

  const player: PlayerMatrixForTheGame = {
    currentGameId: ShipsData.gameId,
    ships: matrix,
    indexPlayer: ShipsData.indexPlayer,
    turn: false,
  };

  currentGames.push(player);

  const arrayForGameStarting: PlayerMatrixForTheGame[] = currentGames.filter(
    (game) => game.currentGameId,
  );

  if (arrayForGameStarting.length === 2) {
    startTheGame(arrayForGameStarting);
  }
};

const startTheGame = (playersInGame: PlayerMatrixForTheGame[]) => {
  const gameCreator = playersInGame.find(
    (client) => client.indexPlayer === client.currentGameId,
  ) as PlayerMatrixForTheGame;

  const secondPlayer = playersInGame.filter(
    (client) => client.indexPlayer !== gameCreator.indexPlayer,
  )[0] as PlayerMatrixForTheGame;

  const currentClientData = JSON.stringify({
    ships: gameCreator.ships,
    currentPlayerIndex: gameCreator.indexPlayer,
  });
  const secondPlayerData = JSON.stringify({
    ships: secondPlayer.ships,
    currentPlayerIndex: secondPlayer.indexPlayer,
  });

  const response1 = {
    type: 'start_game',
    data: currentClientData,
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

const handleAttack = (request: Request) => {
  const currentPlayer: PlayerCoordinates = JSON.parse(request.data);
  const coordinates: Coordinates = {
    x: currentPlayer.x,
    y: currentPlayer.y,
  };

  const currentGameArray = currentGames.filter(
    (game) => game.currentGameId === currentPlayer.gameId,
  );

  const enemy = currentGameArray.filter(
    (enemy) => enemy.indexPlayer !== currentPlayer.indexPlayer,
  )[0];

  const enemyShips = enemy.ships.map((rows) => [...rows]);

  if (enemy.turn) return;

  type AttackFeedback = {
    status: Status;
    updatedMatrix: MatrixCells[][];
  };

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
        position: {
          x: currentPlayer.x,
          y: currentPlayer.y,
        },
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
        position: {
          x: currentPlayer.x,
          y: currentPlayer.y,
        },
        currentPlayer: currentPlayer.indexPlayer,
        status: status,
      }),
      id: 0,
    };

    connection1.send(JSON.stringify(response));
    connection2.send(JSON.stringify(response));
    playerTurn(connection1, connection2, currentPlayer.indexPlayer);
  } else if (status === 'killed') {
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
      return;
    }

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
        position: {
          x: currentPlayer.x,
          y: currentPlayer.y,
        },
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
