import WebSocket from 'ws';
import { Player, Request } from '../model/types/index';
import * as db from '../db/db.ts';
import { WebSocketServer } from 'ws';
// import { v4 as uuidv4 } from 'uuid';

const webSocketPort = 3000;

export const wss = new WebSocketServer({
  port: webSocketPort,
});

wss.on('connection', (ws: WebSocket) => {
  console.log('A client connected');

  ws.on('message', (message: string) => {
    const request = JSON.parse(message);
    handleRequest(ws, request);
  });

  ws.on('close', () => {
    console.log('A client disconnected');
  });
});

function handleRequest(ws: WebSocket, request: Request) {
  console.log(request);

  const requestData = JSON.parse(request.data); 

  switch (request.type) {
  case 'reg':
    if (db.playerExists(requestData.name)) {
      handleLogin(ws, request);
    } else {
      handleRegistration(ws, request);
    }
    break;
  }
}

function handleRegistration(ws: WebSocket, request: Request) {
  const { name, password }: Player = JSON.parse(request.data);

  const { index, error, errorText } = db.registerPlayer(name, password);

  const response = {
    type: 'reg',
    data: JSON.stringify({
      name,
      index,
      error,
      errorText,
    }),
    id: 0,
  };

  ws.send(JSON.stringify(response));
}

function handleLogin(ws: WebSocket, request: Request) {
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
