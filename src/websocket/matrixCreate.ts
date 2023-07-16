import { GameMatrix } from '../../src/model/types/matrix.ts';
import { Ship } from '../../src/model/types/ships.ts';

export function createMatrix(ships: Ship[]): GameMatrix {
  const matrixSize = 10;
  const matrix: GameMatrix = Array.from({ length: matrixSize }, () =>
    Array(matrixSize).fill('empty'),
  );

  for (const ship of ships) {
    const { x, y } = ship.position;
    const { direction, length } = ship;

    for (let i = 0; i < length; i += 1) {
      const cellX = direction ? x : x + i;
      const cellY = direction ? y + i : y;

      matrix[cellY][cellX] = ship.type;
    }
  }

  return matrix;
}
