export interface UserResponse {
  id: string;
  email: string;
  name?: string;
  plan: string;
  role: string;
  mustChangePassword: boolean;
  aiEnabled: boolean;
  aiRequestsLimit: number | null;
  createdAt: Date;
}
