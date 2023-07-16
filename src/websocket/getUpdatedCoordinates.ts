import { MatrixCells } from '../model/types/matrix.ts';
import { UpdatedCoordinates } from '../model/types/ships.ts';

export const getUpdatedCoordinates = (
  originalMatrix: MatrixCells[][],
  updatedMatrix: MatrixCells[][],
): UpdatedCoordinates[] => {
  const updatedCoordinates: UpdatedCoordinates[] = [];

  for (let y = 0; y < updatedMatrix.length; y += 1) {
    for (let x = 0; x < updatedMatrix[y].length; x += 1) {
      const coordinate = { x, y, status: updatedMatrix[y][x] };

      if (originalMatrix[y][x] !== updatedMatrix[y][x]) {
        updatedCoordinates.push(coordinate);
      }
    }
  }

  return updatedCoordinates;
};
