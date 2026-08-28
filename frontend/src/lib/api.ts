export const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

export interface User {
  id: number;
  username: string;
  email: string;
  role?: {
    id: number;
    name: string;
    type: string;
    description: string;
  };
}

export interface AuthResponse {
  jwt: string;
  user: User;
}
