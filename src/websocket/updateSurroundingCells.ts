import { GameMatrix } from '../../src/model/types/matrix.ts';

export function updateSurroundingCells(
  matrix: GameMatrix,
  x: number,
  y: number,
) {
  const numRows = matrix.length;
  const numCols = matrix[0].length;

  if (x > 0 && matrix[y][x - 1] !== 'killed') {
    matrix[y][x - 1] = 'miss';
  }

  if (x < numCols - 1 && matrix[y][x + 1] !== 'killed') {
    matrix[y][x + 1] = 'miss';
  }

  if (y > 0 && matrix[y - 1][x] !== 'killed') {
    matrix[y - 1][x] = 'miss';
  }

  if (y < numRows - 1 && matrix[y + 1][x] !== 'killed') {
    matrix[y + 1][x] = 'miss';
  }

  if (x > 0 && y > 0 && matrix[y - 1][x - 1] !== 'killed') {
    matrix[y - 1][x - 1] = 'miss';
  }

  if (x < numCols - 1 && y > 0 && matrix[y - 1][x + 1] !== 'killed') {
    matrix[y - 1][x + 1] = 'miss';
  }

  if (x > 0 && y < numRows - 1 && matrix[y + 1][x - 1] !== 'killed') {
    matrix[y + 1][x - 1] = 'miss';
  }

  if (x < numCols - 1 && y < numRows - 1 && matrix[y + 1][x + 1] !== 'killed') {
    matrix[y + 1][x + 1] = 'miss';
  }
}
