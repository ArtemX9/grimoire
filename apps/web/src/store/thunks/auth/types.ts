import { Role } from '@grimoire/shared';

export type Session = {
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    mustChangePassword: boolean;
    aiEnabled: boolean;
    aiRequestsLimit: number | null;
  };
};

export type SignInArgs = {
  email: string;
  password: string;
};
