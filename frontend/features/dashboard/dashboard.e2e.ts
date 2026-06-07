import {
  expect,
  test,
  type APIRequestContext,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import { registerAndLoginByApi } from "../../lib/e2e/auth-api";
import type { DashboardSummary } from "./dashboard.types";

const numberFormatter = new Intl.NumberFormat("en-US");

function summarySection(page: Page) {
  return page.locator('section[aria-label="Dashboard summary"]');
}

function summaryCard(page: Page, title: string) {
  return summarySection(page).locator("article").filter({ hasText: title });
}

function activitiesSection(page: Page) {
  return page.locator("section").filter({
    has: page.getByRole("heading", { name: "Activities" }),
  });
}

function topProductsSection(page: Page) {
  return page.locator("section").filter({
    has: page.getByRole("heading", { name: "Top products" }),
  });
}

function topProductItem(page: Page, name: string) {
  return topProductsSection(page).locator("article").filter({ hasText: name });
}

function todayScheduleSection(page: Page) {
  return page.locator("section").filter({
    has: page.getByRole("heading", { name: "Today's schedule" }),
  });
}

function dashboardApiResponse(page: Page, path: string, period?: string) {
  return page.waitForResponse((response) => {
    const url = response.url();

    return (
      response.request().method() === "GET" &&
      url.includes(`/api/dashboard/${path}`) &&
      (!period || url.includes(`period=${period}`))
    );
  });
}

async function createSignedInUser(
  context: BrowserContext,
  request: APIRequestContext,
  label: string,
) {
  return registerAndLoginByApi(request, context.request, label);
}

async function openDashboardPage(page: Page) {
  await page.goto("/dashboard");
  await expect(page).toHaveURL("/dashboard");
  await expect(
    page.getByRole("heading", { level: 1, name: "Dashboard" }),
  ).toBeVisible();
}

test.describe("Dashboard", () => {
  test("redirects guests from dashboard to sign in", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();
  });

  test("shows summary metrics to authenticated users", async ({
    context,
    page,
    request,
  }) => {
    await createSignedInUser(context, request, "dashboard-summary");

    const summaryResponsePromise = dashboardApiResponse(page, "summary");
    await openDashboardPage(page);
    const summaryResponse = await summaryResponsePromise;
    const summary = (await summaryResponse.json()) as DashboardSummary;

    await expect(summarySection(page)).toBeVisible();
    await expect(summaryCard(page, "Total Revenues")).toContainText(
      "$2,129,430",
    );
    await expect(summaryCard(page, "Total Transactions")).toContainText("1,520");
    await expect(summaryCard(page, "Total Likes")).toContainText("9,721");
    await expect(summaryCard(page, "Total Users")).toContainText(
      numberFormatter.format(summary.totalUsers),
    );
  });

  test("shows dashboard widgets with default datasets", async ({
    context,
    page,
    request,
  }) => {
    await createSignedInUser(context, request, "dashboard-widgets");

    await openDashboardPage(page);

    await expect(activitiesSection(page)).toBeVisible();
    await expect(page.getByLabel("Activities period")).toHaveValue(
      "last-4-weeks",
    );
    await expect(activitiesSection(page).getByText("Guest")).toBeVisible();
    await expect(activitiesSection(page).getByText("User")).toBeVisible();

    await expect(topProductsSection(page)).toContainText("May - June 2023");
    await expect(topProductItem(page, "Basic Tees")).toContainText("10%");
    await expect(topProductItem(page, "Custom Short Pants")).toContainText(
      "70%",
    );
    await expect(topProductItem(page, "Super Hoodies")).toContainText("20%");

    await expect(todayScheduleSection(page)).toContainText(
      "Meeting with suppliers from Kuta Bali",
    );
    await expect(todayScheduleSection(page)).toContainText(
      "Check operation at Giga Factory 1",
    );
  });

  test("updates the activities dataset when period changes", async ({
    context,
    page,
    request,
  }) => {
    await createSignedInUser(context, request, "dashboard-activities-period");
    await openDashboardPage(page);

    const activitiesResponsePromise = dashboardApiResponse(
      page,
      "activities",
      "last-12-weeks",
    );
    await page.getByLabel("Activities period").selectOption("last-12-weeks");
    const activitiesResponse = await activitiesResponsePromise;

    expect(activitiesResponse.ok(), await activitiesResponse.text())
      .toBeTruthy();
    await expect(page.getByLabel("Activities period")).toHaveValue(
      "last-12-weeks",
    );
    await expect(await activitiesResponse.json()).toMatchObject({
      period: "last-12-weeks",
      series: [
        {
          key: "guest",
          values: [590, 100, 900, 320],
        },
        {
          key: "user",
          values: [420, 150, 450, 180],
        },
      ],
    });
  });

  test("updates the top products dataset when period changes", async ({
    context,
    page,
    request,
  }) => {
    await createSignedInUser(context, request, "dashboard-products-period");
    await openDashboardPage(page);

    const topProductsResponsePromise = dashboardApiResponse(
      page,
      "top-products",
      "last-8-weeks",
    );
    await page.getByLabel("Top products period").selectOption("last-8-weeks");
    const topProductsResponse = await topProductsResponsePromise;

    expect(topProductsResponse.ok(), await topProductsResponse.text())
      .toBeTruthy();
    await expect(topProductsSection(page)).toContainText("May - June 2022");
    await expect(topProductItem(page, "Basic Tees")).toContainText("40%");
    await expect(topProductItem(page, "Custom Short Pants")).toContainText(
      "30%",
    );
    await expect(topProductItem(page, "Super Hoodies")).toContainText("30%");
  });
});
