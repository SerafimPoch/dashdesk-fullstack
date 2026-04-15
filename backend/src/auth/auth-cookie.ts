import { CookieOptions } from 'express';

export const ACCESS_TOKEN_COOKIE = 'accessToken';
export const REFRESH_TOKEN_COOKIE = 'refreshToken';

const BASE_COOKIE_CONFIG: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: false,
};

export const ACCESS_TOKEN_COOKIE_CONFIG: CookieOptions = {
  ...BASE_COOKIE_CONFIG,
  path: '/',
  maxAge: 1000 * 60 * 15,
};

export const REFRESH_TOKEN_COOKIE_CONFIG: CookieOptions = {
  ...BASE_COOKIE_CONFIG,
  path: '/api/auth',
  maxAge: 1000 * 60 * 60 * 24 * 7,
};
