import {
  CustomWebSocket,
  Player,
  Request,
  RoomUsers,
} from '../model/types/index';
import * as db from '../db/db.ts';
import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

const webSocketPort = 3000;

let connections: CustomWebSocket[] = [];

export const wss = new WebSocketServer({
  port: webSocketPort,
});

wss.on('connection', (ws: CustomWebSocket) => {
  console.log('A client connected');
  const uniqueIndex: string = uuidv4();
  ws.index = uniqueIndex;

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
  }
}

function handleRegistration(ws: CustomWebSocket, request: Request) {
  const { name, password }: Player = JSON.parse(request.data);

  const { error, errorText } = db.registerPlayer(name, password, ws.index);

  const response = {
    type: 'reg',
    data: JSON.stringify({
      name,
      index: ws.index,
      error,
      errorText,
    }),
    id: 0,
  };

  ws.send(JSON.stringify(response));
}

function handleLogin(ws: CustomWebSocket, request: Request) {
  const { name, password } = JSON.parse(request.data);

  db.loginPlayer(name, password);

  const response = {
    type: 'reg',
    data: JSON.stringify({
      name,
      password,
    }),
    id: 0,
  };

  ws.send(JSON.stringify(response));
}

let roomUsers: RoomUsers[] = [];

function handleRoomCreation(ws: CustomWebSocket) {
  if (roomUsers.length > 0) return;

  if (roomUsers.length === 0) {
    const creator = db.players.find(
      (player) => player.index === ws.index,
    ) as Player;

    roomUsers.push(creator);

    const response = {
      type: 'create_room',
      data: '',
    };

    ws.send(JSON.stringify(response));
  }

  if (roomUsers.length === 1) {
    updateRoom(ws);
  }
}

const updateRoom = (ws: CustomWebSocket) => {
  const update = JSON.stringify([
    {
      roomId: ws.index,
      roomUsers: roomUsers,
    },
  ]);

  const response = {
    type: 'update_room',
    data: update,
    id: 0,
  };

  connections.forEach((ws) => {
    ws.send(JSON.stringify(response));
  });
};

export function roomUserExists(name: string) {
  return roomUsers.some((player) => player.name === name);
}

const addUserToRoomAndStartTheGame = (ws: CustomWebSocket) => {
  addUserToExistRoom(ws);
  startTheGame(ws);
};

const addUserToExistRoom = (ws: CustomWebSocket) => {
  if (roomUsers.length === 2) return;

  const creator = db.players.find(
    (player) => player.index === roomUsers[0].index,
  ) as Player;

  const response = {
    type: 'add_user_to_room',
    data: JSON.stringify({
      indexRoom: creator.index,
    }),
    id: 0,
  };

  const addUserToRoom = [...db.players].filter(
    (player) => player.index !== creator.index,
  )[0];

  roomUsers.push(addUserToRoom);

  ws.send(JSON.stringify(response));
};

const startTheGame = (ws: CustomWebSocket) => {
  const creator = db.players.find(
    (player) => player.index === roomUsers[0].index,
  ) as Player;

  const response = {
    type: 'create_game',
    data: JSON.stringify({
      idGame: creator.index,
      idPlayer: ws.index,
    }),
    id: 0,
  };

  connections.forEach((ws) => {
    ws.send(JSON.stringify(response));
  });
  roomUsers.length = 0;
};
