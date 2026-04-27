export interface UserResponse {
  id: string;
  email: string;
  name?: string;
  plan: string;
  role: string;
  isDemo: boolean;
  mustChangePassword: boolean;
  aiEnabled: boolean;
  aiRequestsLimit: number | null;
  createdAt: Date;
}
