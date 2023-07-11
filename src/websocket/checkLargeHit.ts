import { GameMatrix } from '../../src/model/types/matrix.ts';
import { updateSurroundingCells } from './updateSurroundingCells.ts';

export function checkLargeHit(
  matrix: GameMatrix,
  x: number,
  y: number,
): [boolean, GameMatrix] {
  const numRows = matrix.length;
  const numCols = matrix[0].length;

  const updatedMatrix = [...matrix];

  let countLeft = 0;
  let countRight = 0;

  for (let i = x - 1; i >= 0; i--) {
    if (matrix[y][i] === 'shot') {
      countLeft++;
    } else if (matrix[y][i] === 'empty' || matrix[y][i] === 'miss') {
      break;
    } else {
      continue;
    }
  }

  for (let i = x + 1; i < numCols; i++) {
    if (matrix[y][i] === 'shot') {
      countRight++;
    } else if (matrix[y][i] === 'empty' || matrix[y][i] === 'miss') {
      break;
    } else {
      continue;
    }
  }

  if (countLeft + countRight >= 2) {
    if (matrix[y][x] === 'large') {
      updatedMatrix[y][x] = 'killed';

      for (let i = x - countLeft; i <= x + countRight; i++) {
        updatedMatrix[y][i] = 'killed';

        updateSurroundingCells(updatedMatrix, x - countLeft, y);
        updateSurroundingCells(updatedMatrix, x + countRight, y);
      }
      return [true, updatedMatrix];
    } else {
      updatedMatrix[y][x] = 'shot';
      return [false, updatedMatrix];
    }
  }

  let countTop = 0;
  let countBottom = 0;

  for (let i = y - 1; i >= 0; i--) {
    if (matrix[i][x] === 'shot') {
      countTop++;
    } else if (matrix[i][x] === 'empty' || matrix[i][x] === 'miss') {
      break;
    } else {
      continue;
    }
  }

  for (let i = y + 1; i < numRows; i++) {
    if (matrix[i][x] === 'shot') {
      countBottom++;
    } else if (matrix[i][x] === 'empty' || matrix[i][x] === 'miss') {
      break;
    } else {
      continue;
    }
  }

  if (countTop + countBottom >= 2) {
    if (matrix[y][x] === 'large') {
      updatedMatrix[y][x] = 'killed';
      for (let i = y - countTop; i <= y + countBottom; i++) {
        updatedMatrix[i][x] = 'killed';

        updateSurroundingCells(updatedMatrix, x, y - countTop);
        updateSurroundingCells(updatedMatrix, x, y + countBottom);
      }
      return [true, updatedMatrix];
    } else {
      updatedMatrix[y][x] = 'shot';
      return [false, updatedMatrix];
    }
  }

  return [false, updatedMatrix];
}
