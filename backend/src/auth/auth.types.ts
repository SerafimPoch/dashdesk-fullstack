export interface AuthenticatedUser {
  id: string;
  email: string;
}

export interface AuthResult {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: {
    email: string;
  };
}
