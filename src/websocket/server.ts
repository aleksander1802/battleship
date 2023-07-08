import {
  CustomWebSocket,
  Player,
  Request,
  RoomUsers,
} from '../model/types/index';
import * as db from '../db/db.ts';
import { players } from '../db/db.ts';
import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { AddShipsData, AddShipsRequest } from '../../src/model/types/ships.ts';
import { handleLogin } from './handleLogin.ts';
import { handleRegistration } from './handleRegistration.ts';
import { handleRoomCreation } from './handleRoomCreation.ts';

const webSocketPort = 3000;

export let connections: CustomWebSocket[] = [];
export let roomUsers: RoomUsers[] = [];
const playersInGame: AddShipsData[] = [];

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

    connections = connections.filter((connection) => connection !== ws);
    roomUsers = roomUsers.filter((room) => room.index !== ws.index);
  });
});

function handleRequest(ws: CustomWebSocket, request: Request) {
  console.log(request);

  const requestData = request.data && JSON.parse(request.data);
  switch (request.type) {
    case 'reg':
      if (db.playerExists(requestData.name)) {
        handleLogin(ws, request);
      } else {
        handleRegistration(ws, request);
      }
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
  const addShipsData = JSON.parse(request.data) as AddShipsData;

  playersInGame.push(addShipsData);

  if (playersInGame.length === 2) {
    startTheGame(ws, playersInGame);
  }
};

const startTheGame = (ws: CustomWebSocket, playersInGame: AddShipsData[]) => {
  const currentClient = playersInGame.find(
    (client) => client.indexPlayer === ws.index,
  ) as AddShipsData;

  const secondPlayer = playersInGame.filter(
    (client) => client.indexPlayer !== currentClient.indexPlayer,
  )[0] as AddShipsData;

  const currentClientData = JSON.stringify({
    ships: currentClient.ships,
    currentPlayerIndex: currentClient.indexPlayer,
  });
  const secondPlayerData = JSON.stringify({
    ships: secondPlayer.ships,
    currentPlayerIndex: secondPlayer.indexPlayer,
  }); 

  console.log(currentClientData);

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

  const connection1 = connections.filter(
    (item) => item.index === currentClient.indexPlayer,
  )[0];

  const connection2 = connections.filter(
    (item) => item.index !== connection1.index,
  )[0];

  connection1.send(JSON.stringify(response1));
  connection2.send(JSON.stringify(response2));
};
