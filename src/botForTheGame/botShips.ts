enum ShipType {
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
  Huge = 'huge',
}

type GameCell = 'empty' | ShipType;
type GameMatrix = GameCell[][];

interface ShipPlacement {
  type: ShipType;
  length: number;
}

export function generateBotShips(): GameMatrix {
  const matrixSize = 10;
  const matrix: GameMatrix = Array.from({ length: matrixSize }, () =>
    Array(matrixSize).fill('empty'),
  );

  const shipTypes: ShipType[] = [
    ShipType.Huge,
    ShipType.Large,
    ShipType.Large,
    ShipType.Medium,
    ShipType.Medium,
    ShipType.Medium,
    ShipType.Small,
    ShipType.Small,
    ShipType.Small,
    ShipType.Small,
  ];

  shuffleArray(shipTypes);

  const shipPlacements: ShipPlacement[] = [
    { type: ShipType.Small, length: 1 },
    { type: ShipType.Medium, length: 2 },
    { type: ShipType.Large, length: 3 },
    { type: ShipType.Huge, length: 4 },
  ];

  for (const shipPlacement of shipPlacements) {
    let shipPlaced = false;
    while (!shipPlaced) {
      const x = getRandomNumber(0, matrixSize - 1);
      const y = getRandomNumber(0, matrixSize - 1);

      if (
        matrix[y][x] === 'empty' &&
        isShipPlacementValid(matrix, x, y, shipPlacement.length)
      ) {
        placeShip(matrix, x, y, shipPlacement);
        shipPlaced = true;
      }
    }
  }

  return matrix;
}

function placeShip(
  matrix: GameMatrix,
  x: number,
  y: number,
  shipPlacement: ShipPlacement,
): void {
  const { type, length } = shipPlacement;

  if (isShipHorizontal(type)) {
    for (let i = x; i < x + length; i++) {
      matrix[y][i] = type;
    }
  } else {
    for (let i = y; i < y + length; i++) {
      matrix[i][x] = type;
    }
  }
}

function isShipPlacementValid(
  matrix: GameMatrix,
  x: number,
  y: number,
  length: number,
): boolean {
  const matrixSize = matrix.length;

  if (isShipHorizontal(ShipType.Huge) && x + length > matrixSize) {
    return false;
  }

  if (!isShipHorizontal(ShipType.Huge) && y + length > matrixSize) {
    return false;
  }

  if (isShipHorizontal(ShipType.Huge)) {
    for (let i = x; i < x + length; i++) {
      if (matrix[y][i] !== 'empty') {
        return false;
      }
    }
  } else {
    for (let i = y; i < y + length; i++) {
      if (matrix[i][x] !== 'empty') {
        return false;
      }
    }
  }

  return true;
}

function isShipHorizontal(shipType: ShipType): boolean {
  return shipType === ShipType.Huge || shipType === ShipType.Large;
}

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffledArray = [...array];
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
}
