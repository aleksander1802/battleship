import { httpServer } from './src/http_server/index.ts';
import dotenv from 'dotenv';
import './src/websocket/server.ts';
import { exec } from 'child_process';

dotenv.config();

export const HTTP_PORT = parseInt(process.env.PORT || '8181');

console.log(`Start static http server on the ${HTTP_PORT} port!`);

httpServer.listen(HTTP_PORT, () => {
  const openCommand = process.platform === 'win32' ? 'start' : 'xdg-open';

  exec(`${openCommand} http://localhost:${HTTP_PORT}`, (error) => {
    if (error) {
      console.error(`Failed to open browser: ${error}`);
    }
  });
});
