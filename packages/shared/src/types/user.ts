export enum Plan {
  FREE = 'FREE',
  PRO = 'PRO',
  LIFETIME = 'LIFETIME',
}

export interface User {
  id: string
  email: string
  name?: string
  plan: Plan
  createdAt: Date
}
