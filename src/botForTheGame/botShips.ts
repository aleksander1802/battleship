import { ShipType } from '../model/types/ships.ts';
import { GameMatrix } from '../model/types/matrix.ts';

type Ship = {
  type: ShipType;
  size: number;
  placed: boolean;
};

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function initializeMatrix(): GameMatrix {
  const matrix: GameMatrix = [];
  for (let i = 0; i < 10; i++) {
    matrix[i] = Array(10).fill('empty');
  }
  return matrix;
}

function getUnplacedShip(ships: Ship[], type: ShipType): Ship {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return ships.find((ship) => ship.type === type && !ship.placed)!;
}

function checkPlacement(
  matrix: GameMatrix,
  row: number,
  col: number,
  size: number,
  horizontal: boolean,
): boolean {
  if (horizontal) {
    for (let i = col - 1; i < col + size + 1; i++) {
      for (let j = row - 1; j <= row + 1; j++) {
        if (matrix[j]?.[i] && matrix[j][i] !== 'empty') {
          return false;
        }
      }
    }
  } else {
    for (let i = row - 1; i < row + size + 1; i++) {
      for (let j = col - 1; j <= col + 1; j++) {
        if (matrix[i]?.[j] && matrix[i][j] !== 'empty') {
          return false;
        }
      }
    }
  }

  return true;
}

function placeHugeShip(matrix: GameMatrix, ships: Ship[]): void {
  const ship = getUnplacedShip(ships, 'huge');
  let row: number | undefined, col: number | undefined;
  let validPlacement = false;

  while (!validPlacement) {
    row = getRandomNumber(0, 5);
    col = getRandomNumber(0, 5);
    const horizontal = getRandomNumber(0, 1) === 0;
    validPlacement = checkPlacement(matrix, row, col, ship.size, horizontal);
    if (validPlacement) {
      validPlacement = checkNoAdjacentShips(
        matrix,
        row,
        col,
        ship.size,
        horizontal,
      );
    }
  }

  if (row !== undefined && col !== undefined) {
    if (ship.size === 4) {
      for (let i = row; i < row + ship.size; i++) {
        matrix[i][col] = ship.type;
      }
    }
  }

  ship.placed = true;
}

function placeLargeShips(matrix: GameMatrix, ships: Ship[]): void {
  for (let i = 0; i < 2; i++) {
    const ship = getUnplacedShip(ships, 'large');
    let row: number | undefined, col: number | undefined;
    let validPlacement = false;
    let horizontal = Math.random() < 0.5;

    while (!validPlacement) {
      row = getRandomNumber(0, 9);
      col = getRandomNumber(0, 9);
      horizontal = Math.random() < 0.5;
      validPlacement = checkPlacement(matrix, row, col, ship.size, horizontal);
      if (validPlacement) {
        validPlacement = checkNoAdjacentShips(
          matrix,
          row,
          col,
          ship.size,
          horizontal,
        );
      }
    }

    if (row !== undefined && col !== undefined) {
      if (horizontal) {
        if (col + ship.size <= 10) {
          for (let j = col; j < col + ship.size; j++) {
            matrix[row][j] = ship.type;
          }
        }
      } else {
        if (row + ship.size <= 10) {
          for (let j = row; j < row + ship.size; j++) {
            matrix[j][col] = ship.type;
          }
        }
      }
    }

    ship.placed = true;
  }
}

function placeMediumShips(matrix: GameMatrix, ships: Ship[]): void {
  for (let i = 0; i < 3; i++) {
    const ship = getUnplacedShip(ships, 'medium');
    let row: number | undefined, col: number | undefined;
    const horizontal = Math.random() < 0.5;

    let validPlacement = false;

    while (!validPlacement) {
      if (horizontal) {
        row = getRandomNumber(0, 9);
        col = getRandomNumber(0, 9 - ship.size);
      } else {
        row = getRandomNumber(0, 9 - ship.size);
        col = getRandomNumber(0, 9);
      }

      validPlacement = checkPlacement(matrix, row, col, ship.size, horizontal);
      if (validPlacement) {
        validPlacement = checkNoAdjacentShips(
          matrix,
          row,
          col,
          ship.size,
          horizontal,
        );
      }
    }

    if (row !== undefined && col !== undefined) {
      if (horizontal) {
        for (let j = col; j < col + ship.size; j++) {
          matrix[row][j] = ship.type;
        }
      } else {
        for (let j = row; j < row + ship.size; j++) {
          matrix[j][col] = ship.type;
        }
      }
    }

    ship.placed = true;
  }
}

function placeSmallShips(matrix: GameMatrix, ships: Ship[]): void {
  for (let i = 0; i < 4; i++) {
    const ship = getUnplacedShip(ships, 'small');
    let row: number | undefined, col: number | undefined;
    let validPlacement = false;

    while (!validPlacement) {
      row = getRandomNumber(0, 9);
      col = getRandomNumber(0, 9);
      validPlacement = checkPlacement(matrix, row, col, ship.size, true);
      if (validPlacement) {
        validPlacement = checkNoAdjacentShips(
          matrix,
          row,
          col,
          ship.size,
          true,
        );
      }
    }

    if (row !== undefined && col !== undefined) {
      matrix[row][col] = ship.type;
    }

    ship.placed = true;
  }
}

function checkNoAdjacentShips(
  matrix: GameMatrix,
  row: number,
  col: number,
  size: number,
  horizontal: boolean,
): boolean {
  const startCol = col - 1 < 0 ? 0 : col - 1;
  const startRow = row - 1 < 0 ? 0 : row - 1;
  const endCol =
    col + (horizontal ? size : 1) > 9 ? 9 : col + (horizontal ? size : 1);
  const endRow =
    row + (horizontal ? 1 : size) > 9 ? 9 : row + (horizontal ? 1 : size);

  for (let i = startRow; i <= endRow; i++) {
    for (let j = startCol; j <= endCol; j++) {
      if (matrix[i][j] !== 'empty') {
        return false;
      }
    }
  }

  return true;
}

export function generateBotShips(): GameMatrix {
  const matrix = initializeMatrix();
  const ships: Ship[] = [
    { type: 'small', size: 1, placed: false },
    { type: 'small', size: 1, placed: false },
    { type: 'small', size: 1, placed: false },
    { type: 'small', size: 1, placed: false },
    { type: 'medium', size: 2, placed: false },
    { type: 'medium', size: 2, placed: false },
    { type: 'medium', size: 2, placed: false },
    { type: 'large', size: 3, placed: false },
    { type: 'large', size: 3, placed: false },
    { type: 'huge', size: 4, placed: false },
  ];

  placeHugeShip(matrix, ships);
  placeLargeShips(matrix, ships);
  placeMediumShips(matrix, ships);
  placeSmallShips(matrix, ships);

  return matrix;
}
