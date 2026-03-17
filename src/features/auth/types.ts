export type AuthUser = {
  id: number;
  name: string;
  email: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export type PersistedSession = {
  token: string;
  user: AuthUser;
};
