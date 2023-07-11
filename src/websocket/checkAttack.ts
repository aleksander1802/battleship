// import { GameMatrix } from '../../src/model/types/matrix.ts';
// import { Coordinates, ShipType, Status } from '../../src/model/types/ships.ts';

import { updateSurroundingCells } from './updateSurroundingCells.ts';

export type ShipType = 'small' | 'medium' | 'large' | 'huge';
export interface Coordinates {
  x: number;
  y: number;
}
export type Status = 'miss' | 'killed' | 'shot' | 'retry';

export type MatrixCells =
  | 'miss'
  | 'killed'
  | 'shot'
  | 'small'
  | 'medium'
  | 'large'
  | 'huge'
  | 'empty';

export type GameMatrix = MatrixCells[][];

export function checkAttack(
  matrix: GameMatrix,
  attackCoordinates: Coordinates,
) {
  const { x, y } = attackCoordinates;
  const cellValue = matrix[y][x];

  if (cellValue === 'miss' || cellValue === 'shot' || cellValue === 'killed') {
    return { status: 'retry', updatedMatrix: matrix };
  }

  const updatedMatrix: GameMatrix = [...matrix];

  if (updatedMatrix[y][x] === 'small') {
    updatedMatrix[y][x] = 'killed';

    updateSurroundingCells(updatedMatrix, x, y);

    return { status: 'killed', updatedMatrix };
  } else if (updatedMatrix[y][x] === 'medium') {
    const [isMediumHit, newMatrix] = checkMediumHit(updatedMatrix, x, y);

    if (isMediumHit) {
      return { status: 'killed', updatedMatrix: newMatrix };
    } else {
      updatedMatrix[y][x] = 'shot';

      return { status: 'shot', updatedMatrix };
    }
  } else if (updatedMatrix[y][x] === 'large') {
    const [isLargeHit, newMatrix] = checkLargeHit(updatedMatrix, x, y);

    if (isLargeHit) {
      return { status: 'killed', updatedMatrix: newMatrix };
    } else {
      updatedMatrix[y][x] = 'shot';

      return { status: 'shot', updatedMatrix };
    }
  } else if (updatedMatrix[y][x] === 'huge') {
    const [isHugeHit, newMatrix] = checkHugeHit(updatedMatrix, x, y);

    if (isHugeHit) {
      return { status: 'killed', updatedMatrix: newMatrix };
    } else {
      updatedMatrix[y][x] = 'shot';

      return { status: 'shot', updatedMatrix };
    }
  } else {
    updatedMatrix[y][x] = 'miss';

    return { status: 'miss', updatedMatrix };
  }
}

function checkMediumHit(
  matrix: GameMatrix,
  x: number,
  y: number,
): [boolean, GameMatrix] {
  const numRows = matrix.length;
  const numCols = matrix[0].length;

  const updatedMatrix: GameMatrix = [...matrix];

  if (x > 0 && matrix[y][x - 1] === 'shot') {
    if (matrix[y][x] === 'medium') {
      updatedMatrix[y][x] = 'killed';
      updatedMatrix[y][x - 1] = 'killed';
      updateSurroundingCells(updatedMatrix, x, y);
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
      return [true, updatedMatrix];
    } else {
      updatedMatrix[y][x] = 'shot';
      return [false, updatedMatrix];
    }
  }

  return [false, matrix];
}

function checkLargeHit(
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
      }
      updateSurroundingCells(updatedMatrix, x, y);
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
      }
      updateSurroundingCells(updatedMatrix, x, y);
      return [true, updatedMatrix];
    } else {
      updatedMatrix[y][x] = 'shot';
      return [false, updatedMatrix];
    }
  }

  return [false, updatedMatrix];
}

function checkHugeHit(
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

  if (countLeft + countRight >= 3) {
    if (matrix[y][x] === 'huge') {
      updatedMatrix[y][x] = 'killed';
      for (let i = x - countLeft; i <= x + countRight; i++) {
        updatedMatrix[y][i] = 'killed';
      }
      updateSurroundingCells(updatedMatrix, x, y);
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

  if (countTop + countBottom >= 3) {
    if (matrix[y][x] === 'huge') {
      updatedMatrix[y][x] = 'killed';
      for (let i = y - countTop; i <= y + countBottom; i++) {
        updatedMatrix[i][x] = 'killed';
      }
      updateSurroundingCells(updatedMatrix, x, y);
      return [true, updatedMatrix];
    } else {
      updatedMatrix[y][x] = 'shot';
      return [false, updatedMatrix];
    }
  }

  return [false, updatedMatrix];
}
