import {
  expect,
  test,
  type APIRequestContext,
  type BrowserContext,
  type Locator,
  type Page,
} from "@playwright/test";
import {
  backendApiUrl,
  registerAndLoginByApi,
} from "../../lib/e2e/auth-api";

interface UserSeed {
  name: string;
  email: string;
  password: string;
}

interface UsersListResponse {
  items: Array<Pick<UserSeed, "name" | "email">>;
  meta: {
    total: number;
    totalPages: number;
  };
}

function usersTable(page: Page) {
  return page.getByRole("table", { name: "User records" });
}

function userRow(page: Page, user: Pick<UserSeed, "email">) {
  return usersTable(page).getByRole("row").filter({ hasText: user.email });
}

function userData(label: string, overrides: Partial<UserSeed> = {}) {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const normalizedLabel = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return {
    name: `User ${normalizedLabel} ${suffix}`,
    email: `user-${normalizedLabel}-${suffix}@example.com`,
    password: "Password123!",
    ...overrides,
  };
}

async function createSignedInUser(
  context: BrowserContext,
  request: APIRequestContext,
  label: string,
) {
  return registerAndLoginByApi(request, context.request, label);
}

async function createUser(request: APIRequestContext, user: UserSeed) {
  const response = await request.post(`${backendApiUrl}/users`, {
    data: user,
  });

  expect(response.ok(), await response.text()).toBeTruthy();
}

async function expectUserVisible(page: Page, user: UserSeed) {
  const row = userRow(page, user);

  await expect(row).toBeVisible();
  await expect(row).toContainText(user.name);
  await expect(row).toContainText(user.email);
}

async function expectUserRowVisible(
  page: Page,
  user: Pick<UserSeed, "name" | "email">,
) {
  const row = userRow(page, user);

  await expect(row).toBeVisible();
  await expect(row).toContainText(user.name);
  await expect(row).toContainText(user.email);
}

async function expectUserHidden(page: Page, user: UserSeed) {
  await expect(userRow(page, user)).toHaveCount(0);
}

async function openUsersPage(page: Page) {
  await page.goto("/users");
  await expect(page).toHaveURL("/users");
  await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
}

async function fillUserForm(dialog: Locator, user: UserSeed) {
  await dialog.getByLabel("Name").fill(user.name);
  await dialog.getByLabel("Email").fill(user.email);
  await dialog.getByLabel("Password", { exact: true }).fill(user.password);
  await dialog.getByLabel("Confirm password").fill(user.password);
}

function waitForUsersPageResponse(page: Page, search: string, pageNumber: number) {
  return page.waitForResponse((response) => {
    const url = new URL(response.url());

    return (
      response.request().method() === "GET" &&
      url.pathname.endsWith("/api/users") &&
      url.searchParams.get("search") === search &&
      url.searchParams.get("page") === String(pageNumber)
    );
  });
}

test.describe("Users", () => {
  test("redirects guests from users to sign in", async ({ page }) => {
    await page.goto("/users");

    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();
  });

  test("shows the users workspace to authenticated users", async ({
    context,
    page,
    request,
  }) => {
    await createSignedInUser(context, request, "users-page");

    await openUsersPage(page);

    await expect(page.getByRole("heading", { name: "User Records" }))
      .toBeVisible();
    await expect(usersTable(page)).toBeVisible();
    await expect(page.getByPlaceholder("Search in table...")).toBeVisible();
    await expect(page.getByRole("button", { name: "Add" })).toBeVisible();
  });

  test("creates a user from the add dialog", async ({
    context,
    page,
    request,
  }) => {
    await createSignedInUser(context, request, "users-create");
    const user = userData("created");

    await openUsersPage(page);
    await page.getByRole("button", { name: "Add" }).click();
    const dialog = page.getByRole("dialog", { name: "Add user" });
    await expect(dialog).toBeVisible();

    await fillUserForm(dialog, user);
    await dialog.getByRole("button", { name: "Save" }).click();

    await expect(dialog).toBeHidden();
    await expectUserVisible(page, user);
  });

  test("validates the create user form", async ({ context, page, request }) => {
    await createSignedInUser(context, request, "users-validation");
    const validUser = userData("validation");

    await openUsersPage(page);
    await page.getByRole("button", { name: "Add" }).click();
    const dialog = page.getByRole("dialog", { name: "Add user" });
    await dialog.getByRole("button", { name: "Save" }).click();

    await expect(dialog.getByText("Name must be at least 2 characters"))
      .toBeVisible();
    await expect(dialog.getByText("Enter a valid email address")).toBeVisible();
    await expect(
      dialog.getByText("Password must be at least 8 characters", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      dialog.getByText("Confirm password must be at least 8 characters"),
    ).toBeVisible();

    await dialog.getByLabel("Name").fill(validUser.name);
    await dialog.getByLabel("Email").fill(validUser.email);
    await dialog.getByLabel("Password", { exact: true }).fill(validUser.password);
    await dialog.getByLabel("Confirm password").fill("Different123!");
    await dialog.getByRole("button", { name: "Save" }).click();

    await expect(dialog.getByText("Passwords do not match")).toBeVisible();
    await expect(dialog).toBeVisible();
  });

  test("shows a server error for duplicate emails", async ({
    context,
    page,
    request,
  }) => {
    await createSignedInUser(context, request, "users-duplicate");
    const user = userData("duplicate");
    await createUser(context.request, user);

    await openUsersPage(page);
    await page.getByRole("button", { name: "Add" }).click();
    const dialog = page.getByRole("dialog", { name: "Add user" });
    await fillUserForm(dialog, user);
    await dialog.getByRole("button", { name: "Save" }).click();

    await expect(
      dialog.getByText("User with this email already exists"),
    ).toBeVisible();
    await expect(dialog).toBeVisible();
  });

  test("filters users by search text", async ({ context, page, request }) => {
    await createSignedInUser(context, request, "users-search");
    const matchingUser = userData("search match");
    const hiddenUser = userData("search hidden");

    matchingUser.name = `Northwind ${matchingUser.name}`;
    hiddenUser.name = `Southwind ${hiddenUser.name}`;
    await createUser(context.request, matchingUser);
    await createUser(context.request, hiddenUser);

    await openUsersPage(page);
    await page.getByPlaceholder("Search in table...").fill(matchingUser.name);

    await expectUserVisible(page, matchingUser);
    await expectUserHidden(page, hiddenUser);
  });

  test("paginates long user lists", async ({ context, page, request }) => {
    await createSignedInUser(context, request, "users-pagination");
    const paginationToken = `Pagination ${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    const firstUser = userData("pagination first", {
      name: `${paginationToken} Oldest User`,
    });

    await createUser(context.request, firstUser);

    for (let index = 2; index <= 11; index += 1) {
      const user = userData(`pagination item ${index}`, {
        name: `${paginationToken} User ${String(index).padStart(2, "0")}`,
      });

      await createUser(context.request, user);
    }

    await openUsersPage(page);
    const firstPageResponsePromise = waitForUsersPageResponse(
      page,
      paginationToken,
      1,
    );
    await page.getByPlaceholder("Search in table...").fill(paginationToken);
    const firstPageResponse = await firstPageResponsePromise;
    const firstPage = (await firstPageResponse.json()) as UsersListResponse;

    expect(firstPage.meta.total).toBeGreaterThan(10);
    expect(firstPage.meta.totalPages).toBeGreaterThan(1);
    await expectUserRowVisible(page, firstPage.items[0]);

    const secondPageResponsePromise = waitForUsersPageResponse(
      page,
      paginationToken,
      2,
    );
    await page
      .getByRole("navigation", { name: "Users pages" })
      .getByRole("button", { name: "Next page" })
      .click();
    const secondPageResponse = await secondPageResponsePromise;
    const secondPage = (await secondPageResponse.json()) as UsersListResponse;

    expect(secondPage.items.length).toBeGreaterThan(0);
    await expectUserRowVisible(page, secondPage.items[0]);
  });
});
