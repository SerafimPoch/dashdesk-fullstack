import { defineConfig, devices } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const frontendUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3100";
const backendUrl = process.env.PLAYWRIGHT_BACKEND_URL ?? "http://127.0.0.1:4100";
const backendApiUrl = `${backendUrl}/api`;
const backendEnv = loadEnvFile(resolve(process.cwd(), "../backend/.env"));

function loadEnvFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) {
    return {};
  }

  return readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .reduce<Record<string, string>>((env, line) => {
      const trimmedLine = line.trim();

      if (!trimmedLine || trimmedLine.startsWith("#")) {
        return env;
      }

      const separatorIndex = trimmedLine.indexOf("=");

      if (separatorIndex === -1) {
        return env;
      }

      const key = trimmedLine.slice(0, separatorIndex).trim();
      const rawValue = trimmedLine.slice(separatorIndex + 1).trim();
      const value = rawValue.replace(/^(['"])(.*)\1$/, "$2");

      env[key] = value;

      return env;
    }, {});
}

function getEnv(name: string): string | undefined {
  return process.env[name] ?? backendEnv[name];
}

export default defineConfig({
  testDir: ".",
  testMatch: "features/**/*.e2e.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["./lib/e2e/playwright-reporter.ts"], ["html", { open: "never" }]],
  use: {
    baseURL: frontendUrl,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      name: "backend",
      command: "yarn start",
      cwd: "../backend",
      url: `${backendApiUrl}/auth/me`,
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      env: {
        NODE_ENV: "test",
        PORT: "4100",
        FRONTEND_URL: frontendUrl,
        DATABASE_URL:
          getEnv("TEST_DATABASE_URL") ??
          getEnv("DATABASE_URL") ??
          "postgresql://postgres:postgres@127.0.0.1:5432/dashdesk_e2e",
        JWT_ACCESS_SECRET:
          getEnv("JWT_ACCESS_SECRET") ?? "playwright-access-secret",
        GOOGLE_CLIENT_ID: getEnv("GOOGLE_CLIENT_ID") ?? "playwright-google",
        GOOGLE_CLIENT_SECRET:
          getEnv("GOOGLE_CLIENT_SECRET") ?? "playwright-google-secret",
        GOOGLE_CALLBACK_URL:
          getEnv("GOOGLE_CALLBACK_URL") ??
          `${backendApiUrl}/auth/oauth/google/callback`,
        MICROSOFT_CLIENT_ID:
          getEnv("MICROSOFT_CLIENT_ID") ?? "playwright-microsoft",
        MICROSOFT_CLIENT_SECRET:
          getEnv("MICROSOFT_CLIENT_SECRET") ?? "playwright-microsoft-secret",
        MICROSOFT_CALLBACK_URL:
          getEnv("MICROSOFT_CALLBACK_URL") ??
          `${backendApiUrl}/auth/oauth/microsoft/callback`,
      },
    },
    {
      name: "frontend",
      command: "yarn dev --hostname 127.0.0.1 --port 3100",
      url: frontendUrl,
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      env: {
        NEXT_PUBLIC_API_URL: backendApiUrl,
        BACKEND_API_URL: backendApiUrl,
      },
    },
  ],
});
