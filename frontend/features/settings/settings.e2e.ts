import { expect, test } from "@playwright/test";
import {
  loginByApi,
  registerUser,
  createTestUser,
} from "../../lib/e2e/auth-api";

test.describe("Settings", () => {
  test("redirects guests from settings to sign in", async ({ page }) => {
    await page.goto("/settings");

    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();
  });

  test("shows the settings shell to authenticated users", async ({
    context,
    page,
    request,
  }) => {
    const user = createTestUser("settings-page");
    await registerUser(request, user);
    await loginByApi(context.request, user);

    await page.goto("/settings");

    await expect(page).toHaveURL("/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Profile", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Account", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Security", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Danger Zone" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Account settings" }),
    ).toBeHidden();
    await expect(page.getByText(user.email)).toBeVisible();
    await expect(page.getByRole("link", { name: "Settings" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("updates profile details", async ({ context, page, request }) => {
    const user = createTestUser("settings-profile");
    await registerUser(request, user);
    await loginByApi(context.request, user);

    await page.goto("/settings");
    const profileCard = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: "Profile" }) });

    await profileCard.getByLabel("First Name").fill("Grace");
    await profileCard.getByLabel("Last Name").fill("Hopper");
    await profileCard.getByLabel("Date of Birth").fill("1906-12-09");
    await profileCard.getByLabel("Phone Number").fill("+1283716291");
    await profileCard
      .getByLabel("Address")
      .fill("323 Fifth Ave. Canandaigua, NY");
    const profileResponsePromise = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/settings/profile") &&
        response.request().method() === "PATCH",
    );
    await profileCard.getByRole("button", { name: "Save profile" }).click();

    const profileResponse = await profileResponsePromise;
    expect(profileResponse.request().postDataJSON()).toMatchObject({
      firstName: "Grace",
      lastName: "Hopper",
      dateOfBirth: "1906-12-09",
      phoneNumber: "+1283716291",
      address: "323 Fifth Ave. Canandaigua, NY",
    });
    expect(profileResponse.ok(), await profileResponse.text()).toBeTruthy();
    await expect(profileResponse.json()).resolves.toMatchObject({
      firstName: "Grace",
      lastName: "Hopper",
      dateOfBirth: "1906-12-09",
      phoneNumber: "+1283716291",
      address: "323 Fifth Ave. Canandaigua, NY",
    });
    await expect(page.getByText("Profile saved")).toBeVisible();

    await page.reload();

    const reloadedProfileCard = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: "Profile" }) });

    await expect(reloadedProfileCard.getByLabel("First Name")).toHaveValue(
      "Grace",
    );
    await expect(reloadedProfileCard.getByLabel("Last Name")).toHaveValue(
      "Hopper",
    );
    await expect(reloadedProfileCard.getByLabel("Date of Birth")).toHaveValue(
      "1906-12-09",
    );
    await expect(reloadedProfileCard.getByLabel("Phone Number")).toHaveValue(
      "+1283716291",
    );
    await expect(reloadedProfileCard.getByLabel("Address")).toHaveValue(
      "323 Fifth Ave. Canandaigua, NY",
    );
  });

  test("uploads a profile avatar", async ({ context, page, request }) => {
    const user = createTestUser("settings-avatar");
    await registerUser(request, user);
    await loginByApi(context.request, user);

    await page.goto("/settings");
    const profileCard = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: "Profile" }) });

    await profileCard.getByLabel("Avatar image").setInputFiles({
      name: "avatar.png",
      mimeType: "image/png",
      buffer: Buffer.from("avatar"),
    });

    await expect(page.getByText("Avatar uploaded")).toBeVisible();
  });
});
