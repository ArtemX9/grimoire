export const MOODS = [
  'Dark & tense',
  'Chill',
  'Intense',
  'Story-heavy',
  'Mindless fun',
  'Challenging',
  'Atmospheric',
  'Emotional',
] as const

export type Mood = typeof MOODS[number]
