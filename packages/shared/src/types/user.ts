export enum Plan {
  FREE = 'FREE',
  PRO = 'PRO',
  LIFETIME = 'LIFETIME',
}

export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export interface User {
  id: string
  email: string
  name?: string
  plan: Plan
  role: Role
  mustChangePassword: boolean
  aiEnabled: boolean
  aiRequestsLimit: number | null
  createdAt: Date
}
