import { expect, type APIRequestContext } from "@playwright/test";

export const backendApiUrl = `${
  process.env.PLAYWRIGHT_BACKEND_URL ?? "http://127.0.0.1:4100"
}/api`;

export interface TestUser {
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  password: string;
}

export function createTestUser(label: string): TestUser {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const normalizedLabel = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return {
    firstName: "Auth",
    lastName: "Tester",
    name: "Auth Tester",
    email: `auth-${normalizedLabel}-${suffix}@example.com`,
    password: "Password123!",
  };
}

export async function registerUser(
  request: APIRequestContext,
  user: TestUser,
) {
  const response = await request.post(`${backendApiUrl}/auth/register`, {
    data: {
      name: user.name,
      email: user.email,
      password: user.password,
    },
  });

  expect(response.ok(), await response.text()).toBeTruthy();
}

export async function loginByApi(request: APIRequestContext, user: TestUser) {
  const response = await request.post(`${backendApiUrl}/auth/login`, {
    data: {
      email: user.email,
      password: user.password,
    },
  });

  expect(response.ok(), await response.text()).toBeTruthy();
}

export async function registerAndLoginByApi(
  registerRequest: APIRequestContext,
  loginRequest: APIRequestContext,
  label: string,
) {
  const user = createTestUser(label);

  await registerUser(registerRequest, user);
  await loginByApi(loginRequest, user);

  return user;
}
