export const GENRES = [
  'Action',
  'RPG',
  'Strategy',
  'Horror',
  'Gothic / Victorian',
  'Sci-fi',
  'Stealth',
  'Platformer',
  'Adventure',
  'Noir',
  'Souls-like',
  'Shooter',
  'Puzzle',
  'Simulation',
] as const

export type Genre = typeof GENRES[number]
