export type AppRole = 'CEO' | 'Kế toán';

export type AuthUser = {
  username: string;
  role: AppRole;
  displayName: string;
};

export type SessionUser = AuthUser & {
  exp: number;
};
