import { MatrixCells } from '../model/types/matrix.ts';

export function generateRandomCoordinates(matrix: MatrixCells[][]): {
  x: number;
  y: number;
} {
  const excludedValues = ['miss', 'killed', 'shot'];

  const validCoordinates = [];
  for (let y = 0; y < matrix.length; y += 1) {
    for (let x = 0; x < matrix[y].length; x += 1) {
      if (!excludedValues.includes(matrix[y][x])) {
        validCoordinates.push({ x, y });
      }
    }
  }

  const randomIndex = Math.floor(Math.random() * validCoordinates.length);
  return validCoordinates[randomIndex];
}
