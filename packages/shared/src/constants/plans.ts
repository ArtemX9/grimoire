import { Plan } from '../types/user'

export const PLAN_FEATURES: Record<Plan, {
  platformSyncs: number
  aiRecommendations: boolean
  maxGames: number
}> = {
  [Plan.FREE]: {
    platformSyncs: 1,
    aiRecommendations: false,
    maxGames: 50,
  },
  [Plan.PRO]: {
    platformSyncs: 4,
    aiRecommendations: true,
    maxGames: Infinity,
  },
  [Plan.LIFETIME]: {
    platformSyncs: 4,
    aiRecommendations: true,
    maxGames: Infinity,
  },
}
