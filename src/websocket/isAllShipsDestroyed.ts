import { GameMatrix } from '../model/types/matrix.ts';

export function isAllShipsDestroyed(matrix: GameMatrix): boolean {
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
