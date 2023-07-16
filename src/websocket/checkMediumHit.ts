import { GameMatrix } from '../../src/model/types/matrix.ts';
import { updateSurroundingCells } from './updateSurroundingCells.ts';

export function checkMediumHit(
  matrix: GameMatrix,
  x: number,
  y: number,
): [boolean, GameMatrix] {
  const numRows = matrix.length;
  const numCols = matrix[0].length;

  const updatedMatrix: GameMatrix = matrix.map((rows) => [...rows]);

  if (x > 0 && matrix[y][x - 1] === 'shot') {
    if (matrix[y][x] === 'medium') {
      updatedMatrix[y][x] = 'killed';
      updatedMatrix[y][x - 1] = 'killed';
      updateSurroundingCells(updatedMatrix, x, y);
      updateSurroundingCells(updatedMatrix, x - 1, y);
      return [true, updatedMatrix];
    } else {
      updatedMatrix[y][x] = 'shot';
      return [false, updatedMatrix];
    }
  }

  if (x < numCols - 1 && matrix[y][x + 1] === 'shot') {
    if (matrix[y][x] === 'medium') {
      updatedMatrix[y][x] = 'killed';
      updatedMatrix[y][x + 1] = 'killed';
      updateSurroundingCells(updatedMatrix, x, y);
      updateSurroundingCells(updatedMatrix, x + 1, y);
      return [true, updatedMatrix];
    } else {
      updatedMatrix[y][x] = 'shot';
      return [false, updatedMatrix];
    }
  }

  if (y > 0 && matrix[y - 1][x] === 'shot') {
    if (matrix[y][x] === 'medium') {
      updatedMatrix[y][x] = 'killed';
      updatedMatrix[y - 1][x] = 'killed';
      updateSurroundingCells(updatedMatrix, x, y);
      updateSurroundingCells(updatedMatrix, x, y - 1);
      return [true, updatedMatrix];
    } else {
      updatedMatrix[y][x] = 'shot';
      return [false, updatedMatrix];
    }
  }

  if (y < numRows - 1 && matrix[y + 1][x] === 'shot') {
    if (matrix[y][x] === 'medium') {
      updatedMatrix[y][x] = 'killed';
      updatedMatrix[y + 1][x] = 'killed';
      updateSurroundingCells(updatedMatrix, x, y);
      updateSurroundingCells(updatedMatrix, x, y + 1);
      return [true, updatedMatrix];
    } else {
      updatedMatrix[y][x] = 'shot';
      return [false, updatedMatrix];
    }
  }

  return [false, matrix];
}
