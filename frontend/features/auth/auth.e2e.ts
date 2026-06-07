import { expect, test, type Page } from "@playwright/test";
import {
  createTestUser,
  loginByApi,
  registerUser,
} from "../../lib/e2e/auth-api";

async function expectDashboard(page: Page) {
  await expect(page).toHaveURL("/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Transactions" })).toBeVisible();
}

test.describe("Auth", () => {
  test("redirects guests from protected pages to sign in", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();
    await expect(page.getByLabel("Email address")).toBeVisible();
  });

  test("registers a user and opens the dashboard", async ({ page }) => {
    const user = createTestUser("register");

    await page.goto("/register");
    await page.getByLabel("First Name").fill(user.firstName);
    await page.getByLabel("Last Name").fill(user.lastName);
    await page.getByLabel("Email address").fill(user.email);
    await page.getByLabel("Password", { exact: true }).fill(user.password);
    await page.getByLabel("Confirm Password").fill(user.password);
    await page.getByLabel(/I agree/).setChecked(true, { force: true });
    await page.getByRole("button", { name: "Sign Up", exact: true }).click();

    await expectDashboard(page);
  });

  test("validates the registration form before submit", async ({ page }) => {
    const user = createTestUser("register-validation");

    await page.goto("/register");
    await page.getByLabel("Email address").fill("not-an-email");
    await page.getByRole("button", { name: "Sign Up", exact: true }).click();
    await expect(page.getByText("Enter a valid email address")).toBeVisible();
    await expect(page).toHaveURL("/register");

    await page.getByLabel("First Name").fill(user.firstName);
    await page.getByLabel("Last Name").fill(user.lastName);
    await page.getByLabel("Email address").fill(user.email);
    await page.getByLabel("Password", { exact: true }).fill(user.password);
    await page.getByLabel("Confirm Password").fill("Different123!");
    await page.getByRole("button", { name: "Sign Up", exact: true }).click();
    await expect(page.getByText("Passwords do not match")).toBeVisible();
    await expect(page).toHaveURL("/register");

    await page.getByLabel("Confirm Password").fill(user.password);
    await page.getByRole("button", { name: "Sign Up", exact: true }).click();
    await expect(
      page.getByText("You must agree to the terms and conditions"),
    ).toBeVisible();
    await expect(page).toHaveURL("/register");
  });

  test("logs in an existing user and keeps the session after reload", async ({
    page,
    request,
  }) => {
    const user = createTestUser("login");
    await registerUser(request, user);

    await page.goto("/");
    await page.getByLabel("Email address").fill(user.email);
    await page.getByLabel("Password").fill(user.password);
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await expectDashboard(page);

    await page.reload();
    await expectDashboard(page);
  });

  test("shows an error for invalid credentials", async ({ page, request }) => {
    const user = createTestUser("wrong-login");
    await registerUser(request, user);

    await page.goto("/");
    await page.getByLabel("Email address").fill(user.email);
    await page.getByLabel("Password").fill("WrongPassword123!");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();

    await expect(page.getByText("Invalid email or password")).toBeVisible();
    await expect(page).toHaveURL("/");

    await page.goto("/dashboard");
    await expect(page).toHaveURL("/");
  });

  test("redirects authenticated users away from sign in", async ({
    context,
    page,
    request,
  }) => {
    const user = createTestUser("authenticated-root");
    await registerUser(request, user);
    await loginByApi(context.request, user);

    await page.goto("/");

    await expectDashboard(page);
  });

  test("logs out and protects dashboard again", async ({
    context,
    page,
    request,
  }) => {
    const user = createTestUser("logout");
    await registerUser(request, user);
    await loginByApi(context.request, user);

    await page.goto("/dashboard");
    await expectDashboard(page);
    await page.getByRole("button", { name: "Logout" }).click();

    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();

    await page.goto("/dashboard");
    await expect(page).toHaveURL("/");
  });
});
