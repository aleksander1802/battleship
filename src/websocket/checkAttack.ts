import { GameMatrix } from '../../src/model/types/matrix.ts';
import { Coordinates } from '../../src/model/types/ships.ts';
import { checkHugeHit } from './checkHugeHit.ts';
import { checkLargeHit } from './checkLargeHit.ts';
import { checkMediumHit } from './checkMediumHit.ts';
import { updateSurroundingCells } from './updateSurroundingCells.ts';

export function checkAttack(
  matrix: GameMatrix,
  attackCoordinates: Coordinates,
) {
  const { x, y } = attackCoordinates;

  const updatedMatrix: GameMatrix = matrix.map((rows) => [...rows]);

  if (
    updatedMatrix[y][x] === 'miss' ||
    updatedMatrix[y][x] === 'shot' ||
    updatedMatrix[y][x] === 'killed'
  ) {
    return { status: 'retry', updatedMatrix };
  } else if (updatedMatrix[y][x] === 'small') {
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
