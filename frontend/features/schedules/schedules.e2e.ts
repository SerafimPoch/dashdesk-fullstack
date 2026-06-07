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
  createTestUser,
  loginByApi,
  registerAndLoginByApi,
  registerUser,
} from "../../lib/e2e/auth-api";
import type { ScheduleAccent } from "./schedules.types";

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

interface ScheduleSeed {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  accent: ScheduleAccent;
}

function calendarSection(page: Page) {
  return page.locator("section").filter({
    has: page.getByRole("button", { name: "Previous month" }),
  });
}

function calendarHeading(page: Page) {
  return calendarSection(page).getByRole("heading", { level: 2 });
}

function scheduleItem(page: Page, title: string) {
  return page.locator("article").filter({ hasText: title });
}

function scheduleData(
  label: string,
  overrides: Partial<ScheduleSeed> = {},
): ScheduleSeed {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const normalizedLabel = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return {
    title: `Schedule ${normalizedLabel} ${suffix}`,
    date: "2026-05-14",
    startTime: "09:00",
    endTime: "10:00",
    location: `Room ${normalizedLabel}`,
    accent: "GREEN",
    ...overrides,
  };
}

function toScheduleDateTime(date: string, time: string) {
  return `${date}T${time}:00.000Z`;
}

function toDisplayedTime(date: string, time: string) {
  const dateTime = new Date(toScheduleDateTime(date, time));
  const hours = String(dateTime.getHours()).padStart(2, "0");
  const minutes = String(dateTime.getMinutes()).padStart(2, "0");

  return `${hours}.${minutes}`;
}

function displayedScheduleRange(schedule: ScheduleSeed) {
  return `${toDisplayedTime(schedule.date, schedule.startTime)}-${toDisplayedTime(
    schedule.date,
    schedule.endTime,
  )}`;
}

function calendarDateLabel(year: number, monthIndex: number, day: number) {
  return `${monthNames[monthIndex]} ${day}, ${year}`;
}

async function currentVisibleMonthOffset(page: Page) {
  const heading = (await calendarHeading(page).textContent())?.trim();
  const match = heading?.match(/^([A-Za-z]+) (\d{4})$/);

  if (!match) {
    throw new Error(`Unexpected calendar heading: ${heading ?? "empty"}`);
  }

  const monthIndex = monthNames.findIndex((month) => month === match[1]);

  if (monthIndex === -1) {
    throw new Error(`Unexpected calendar month: ${match[1]}`);
  }

  return Number(match[2]) * 12 + monthIndex;
}

async function goToCalendarMonth(
  page: Page,
  year: number,
  monthIndex: number,
) {
  const targetOffset = year * 12 + monthIndex;

  for (let attempt = 0; attempt < 120; attempt += 1) {
    const currentOffset = await currentVisibleMonthOffset(page);

    if (currentOffset === targetOffset) {
      return;
    }

    const buttonName =
      currentOffset > targetOffset ? "Previous month" : "Next month";

    await calendarSection(page).getByRole("button", { name: buttonName }).click();
  }

  throw new Error(`Calendar did not reach ${monthNames[monthIndex]} ${year}`);
}

async function selectCalendarDate(
  page: Page,
  year: number,
  monthIndex: number,
  day: number,
) {
  await goToCalendarMonth(page, year, monthIndex);
  await calendarSection(page)
    .getByRole("button", { name: calendarDateLabel(year, monthIndex, day) })
    .click();
}

async function createSignedInUser(
  context: BrowserContext,
  request: APIRequestContext,
  label: string,
) {
  return registerAndLoginByApi(request, context.request, label);
}

async function createSchedule(
  request: APIRequestContext,
  schedule: ScheduleSeed,
) {
  const response = await request.post(`${backendApiUrl}/schedules`, {
    data: {
      title: schedule.title,
      startsAt: toScheduleDateTime(schedule.date, schedule.startTime),
      endsAt: toScheduleDateTime(schedule.date, schedule.endTime),
      location: schedule.location,
      accent: schedule.accent,
    },
  });

  expect(response.ok(), await response.text()).toBeTruthy();
}

async function expectScheduleVisible(page: Page, schedule: ScheduleSeed) {
  const item = scheduleItem(page, schedule.title);

  await expect(item).toBeVisible();
  await expect(item).toContainText(displayedScheduleRange(schedule));
  await expect(item).toContainText(schedule.location);
}

async function expectScheduleHidden(page: Page, schedule: ScheduleSeed) {
  await expect(scheduleItem(page, schedule.title)).toHaveCount(0);
}

async function openSchedulesPage(page: Page) {
  await page.goto("/schedules");
  await expect(page).toHaveURL("/schedules");
  await expect(
    page.getByRole("heading", { level: 1, name: "Schedules" }),
  ).toBeVisible();
}

async function openCreateScheduleDialog(page: Page) {
  await page.getByRole("button", { name: "Add" }).click();
  const dialog = page.getByRole("dialog", { name: "Add schedule" });

  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Title")).toBeVisible();

  return dialog;
}

async function fillScheduleForm(dialog: Locator, schedule: ScheduleSeed) {
  await dialog.getByLabel("Title").fill(schedule.title);
  await dialog.getByLabel("Date").fill(schedule.date);
  await dialog.getByLabel("Starts").fill(schedule.startTime);
  await dialog.getByLabel("Ends").fill(schedule.endTime);
  await dialog.getByLabel("Location").fill(schedule.location);

  if (schedule.accent === "PURPLE") {
    await dialog.getByRole("button", { name: "Purple" }).click();
  } else {
    await dialog.getByRole("button", { name: "Green" }).click();
  }
}

test.describe("Schedules", () => {
  test("redirects guests from schedules to sign in", async ({ page }) => {
    await page.goto("/schedules");

    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();
  });

  test("shows the schedules workspace to authenticated users", async ({
    context,
    page,
    request,
  }) => {
    await createSignedInUser(context, request, "schedules-page");

    await openSchedulesPage(page);

    await expect(calendarHeading(page)).toHaveText(/^[A-Za-z]+ \d{4}$/);
    await expect(
      calendarSection(page).getByRole("button", { name: "Previous month" }),
    ).toBeVisible();
    await expect(
      calendarSection(page).getByRole("button", { name: "Next month" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Schedules" }))
      .toBeVisible();
    await expect(page.getByRole("button", { name: "Add" })).toBeVisible();
    await expect(page.getByText("No schedules")).toBeVisible();
  });

  test("creates a schedule from the add dialog", async ({
    context,
    page,
    request,
  }) => {
    await createSignedInUser(context, request, "schedules-create");
    const schedule = scheduleData("created", {
      title: "Design Review Schedule",
      location: "Planning room",
      startTime: "11:30",
      endTime: "12:30",
      accent: "PURPLE",
    });

    await openSchedulesPage(page);
    await selectCalendarDate(page, 2026, 4, 14);
    const dialog = await openCreateScheduleDialog(page);

    await fillScheduleForm(dialog, schedule);
    await expect(dialog.getByRole("button", { name: "Purple" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await dialog.getByRole("button", { name: "Save" }).click();

    await expect(dialog).toBeHidden();
    await expectScheduleVisible(page, schedule);
  });

  test("shows only current user schedules", async ({ context, page, request }) => {
    const currentUser = createTestUser("schedules-current-user");
    const otherUser = createTestUser("schedules-other-user");
    const currentSchedule = scheduleData("current user only", {
      title: "Current User Schedule",
    });
    const otherSchedule = scheduleData("other user hidden", {
      title: "Other User Schedule",
    });

    await registerUser(request, currentUser);
    await registerUser(request, otherUser);
    await loginByApi(context.request, currentUser);
    await createSchedule(context.request, currentSchedule);
    await loginByApi(context.request, otherUser);
    await createSchedule(context.request, otherSchedule);
    await loginByApi(context.request, currentUser);

    await openSchedulesPage(page);
    await selectCalendarDate(page, 2026, 4, 14);

    await expectScheduleVisible(page, currentSchedule);
    await expectScheduleHidden(page, otherSchedule);
  });

  test("filters schedules by selected calendar date", async ({
    context,
    page,
    request,
  }) => {
    await createSignedInUser(context, request, "schedules-date-filter");
    const selectedDaySchedule = scheduleData("selected day", {
      title: "Selected Day Schedule",
      date: "2026-05-14",
      startTime: "08:00",
      endTime: "09:00",
    });
    const nextDaySchedule = scheduleData("next day", {
      title: "Next Day Schedule",
      date: "2026-05-15",
      startTime: "08:00",
      endTime: "09:00",
    });
    await createSchedule(context.request, selectedDaySchedule);
    await createSchedule(context.request, nextDaySchedule);

    await openSchedulesPage(page);
    await selectCalendarDate(page, 2026, 4, 14);

    await expectScheduleVisible(page, selectedDaySchedule);
    await expectScheduleHidden(page, nextDaySchedule);

    await selectCalendarDate(page, 2026, 4, 15);

    await expectScheduleVisible(page, nextDaySchedule);
    await expectScheduleHidden(page, selectedDaySchedule);
  });

  test("validates the create schedule form before submit", async ({
    context,
    page,
    request,
  }) => {
    await createSignedInUser(context, request, "schedules-validation");

    await openSchedulesPage(page);
    const dialog = await openCreateScheduleDialog(page);

    await dialog.getByLabel("Date").fill("");
    await dialog.getByLabel("Starts").fill("");
    await dialog.getByLabel("Ends").fill("");
    await dialog.getByRole("button", { name: "Save" }).click();

    await expect(
      dialog.getByText("Title must be at least 2 characters"),
    ).toBeVisible();
    await expect(dialog.getByText("Select a date")).toBeVisible();
    await expect(dialog.getByText("Select a start time")).toBeVisible();
    await expect(dialog.getByText("Select an end time")).toBeVisible();
    await expect(
      dialog.getByText("Location must be at least 2 characters"),
    ).toBeVisible();
    await expect(dialog).toBeVisible();
  });

  test("shows a server error for invalid schedule time range", async ({
    context,
    page,
    request,
  }) => {
    await createSignedInUser(context, request, "schedules-invalid-range");
    const schedule = scheduleData("invalid range", {
      startTime: "16:00",
      endTime: "15:00",
    });

    await openSchedulesPage(page);
    await selectCalendarDate(page, 2026, 4, 14);
    const dialog = await openCreateScheduleDialog(page);

    await fillScheduleForm(dialog, schedule);
    await dialog.getByRole("button", { name: "Save" }).click();

    await expect(
      dialog.getByText("End time must be after start time"),
    ).toBeVisible();
    await expect(dialog).toBeVisible();
  });
});
