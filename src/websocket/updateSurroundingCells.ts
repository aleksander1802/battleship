import { GameMatrix } from './checkAttack.ts';

export function updateSurroundingCells(
  matrix: GameMatrix,
  x: number,
  y: number,
) {
  const numRows = matrix.length;
  const numCols = matrix[0].length;

  // Обновляем статус ячейки слева
  if (x > 0 && matrix[y][x - 1] !== 'killed') {
    matrix[y][x - 1] = 'miss';
  }

  // Обновляем статус ячейки справа
  if (x < numCols - 1 && matrix[y][x + 1] !== 'killed') {
    matrix[y][x + 1] = 'miss';
  }

  // Обновляем статус ячейки сверху
  if (y > 0 && matrix[y - 1][x] !== 'killed') {
    matrix[y - 1][x] = 'miss';
  }

  // Обновляем статус ячейки снизу
  if (y < numRows - 1 && matrix[y + 1][x] !== 'killed') {
    matrix[y + 1][x] = 'miss';
  }

  // Обновляем статус ячейки в левом верхнем углу
  if (x > 0 && y > 0 && matrix[y - 1][x - 1] !== 'killed') {
    matrix[y - 1][x - 1] = 'miss';
  }

  // Обновляем статус ячейки в правом верхнем углу
  if (x < numCols - 1 && y > 0 && matrix[y - 1][x + 1] !== 'killed') {
    matrix[y - 1][x + 1] = 'miss';
  }

  // Обновляем статус ячейки в левом нижнем углу
  if (x > 0 && y < numRows - 1 && matrix[y + 1][x - 1] !== 'killed') {
    matrix[y + 1][x - 1] = 'miss';
  }

  // Обновляем статус ячейки в правом нижнем углу
  if (x < numCols - 1 && y < numRows - 1 && matrix[y + 1][x + 1] !== 'killed') {
    matrix[y + 1][x + 1] = 'miss';
  }
}


  