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

export interface PlayerMatrixForTheGame {
  currentGameId: string;
  ships: GameMatrix;
  indexPlayer: string;
  turn: boolean;
}
