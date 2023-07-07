export interface Player {
  name: string;
  password: string;
  wins: number;
}

export interface Request {
  type: string;
  data: string;
  id: number;
}

