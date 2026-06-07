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

interface TransactionSeed {
  name: string;
  email: string;
  product: string;
  quantity: number;
  totalCents: number;
  date: string;
}

function transactionTable(page: Page) {
  return page.getByRole("table", { name: "Transactions" });
}

function transactionRow(page: Page, name: string) {
  return transactionTable(page).getByRole("row").filter({ hasText: name });
}

function transactionData(
  label: string,
  overrides: Partial<TransactionSeed> = {},
) {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const normalizedLabel = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const name = `Transaction ${normalizedLabel} ${suffix}`;

  return {
    name,
    email: `${normalizedLabel}-${suffix}@example.com`,
    product: `Product ${normalizedLabel}`,
    quantity: 12,
    totalCents: 125000,
    date: "2026-05-15",
    ...overrides,
  };
}

function totalInputValue(transaction: TransactionSeed) {
  return String(transaction.totalCents / 100);
}

async function createSignedInUser(
  context: BrowserContext,
  request: APIRequestContext,
  label: string,
) {
  return registerAndLoginByApi(request, context.request, label);
}

async function createTransaction(
  request: APIRequestContext,
  transaction: TransactionSeed,
) {
  const response = await request.post(`${backendApiUrl}/transactions`, {
    data: transaction,
  });

  expect(response.ok(), await response.text()).toBeTruthy();
}

async function expectTransactionVisible(
  page: Page,
  transaction: TransactionSeed,
) {
  const row = transactionRow(page, transaction.name);

  await expect(row).toBeVisible();
  await expect(row).toContainText(transaction.email);
  await expect(row).toContainText(transaction.product);
  await expect(row).toContainText(`${transaction.quantity} pcs`);
}

async function expectTransactionHidden(page: Page, transaction: TransactionSeed) {
  await expect(transactionRow(page, transaction.name)).toHaveCount(0);
}

async function openTransactionsPage(page: Page) {
  await page.goto("/transaction");
  await expect(page).toHaveURL("/transaction");
  await expect(
    page.getByRole("heading", { name: "Transactions" }),
  ).toBeVisible();
}

async function fillTransactionForm(
  dialog: Locator,
  transaction: TransactionSeed,
) {
  await dialog.getByLabel("Name").fill(transaction.name);
  await dialog.getByLabel("Email").fill(transaction.email);
  await dialog.getByLabel("Product").fill(transaction.product);
  await dialog.getByLabel("Date").fill(transaction.date);
  await dialog.getByLabel("Quantity").fill(String(transaction.quantity));
  await dialog.getByLabel("Total (USD)").fill(totalInputValue(transaction));
}

test.describe("Transactions", () => {
  test("redirects guests from transactions to sign in", async ({ page }) => {
    await page.goto("/transaction");

    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();
  });

  test("shows the transactions workspace to authenticated users", async ({
    context,
    page,
    request,
  }) => {
    await createSignedInUser(context, request, "transactions-page");

    await openTransactionsPage(page);

    await expect(transactionTable(page)).toBeVisible();
    await expect(page.getByPlaceholder("Search in table...")).toBeVisible();
    await expect(page.getByRole("button", { name: "Filter" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add" })).toBeVisible();
    await expect(page.getByText("No transactions found")).toBeVisible();
  });

  test("creates a transaction from the add dialog", async ({
    context,
    page,
    request,
  }) => {
    await createSignedInUser(context, request, "transactions-create");
    const transaction = transactionData("created", {
      product: "Executive Desk",
      quantity: 7,
      totalCents: 249900,
    });

    await openTransactionsPage(page);
    await page.getByRole("button", { name: "Add" }).click();
    const dialog = page.getByRole("dialog", { name: "Add transaction" });
    await expect(dialog).toBeVisible();

    await fillTransactionForm(dialog, transaction);
    await dialog.getByRole("button", { name: "Save" }).click();

    await expect(dialog).toBeHidden();
    await expectTransactionVisible(page, transaction);
    await expect(transactionRow(page, transaction.name)).toContainText("$2,499");
  });

  test("shows only current user transactions", async ({
    context,
    page,
    request,
  }) => {
    const currentUser = createTestUser("transactions-current-user");
    const otherUser = createTestUser("transactions-other-user");
    const currentTransaction = transactionData("current user only", {
      product: "Current User Product",
    });
    const otherTransaction = transactionData("other user hidden", {
      product: "Other User Product",
    });

    await registerUser(request, currentUser);
    await registerUser(request, otherUser);
    await loginByApi(context.request, currentUser);
    await createTransaction(context.request, currentTransaction);
    await loginByApi(context.request, otherUser);
    await createTransaction(context.request, otherTransaction);
    await loginByApi(context.request, currentUser);

    await openTransactionsPage(page);

    await expectTransactionVisible(page, currentTransaction);
    await expectTransactionHidden(page, otherTransaction);
  });

  test("filters transactions by search text", async ({
    context,
    page,
    request,
  }) => {
    await createSignedInUser(context, request, "transactions-search");
    const matchingTransaction = transactionData("search match", {
      name: "Northwind Search Match",
      product: "Searchable Product",
    });
    const hiddenTransaction = transactionData("search hidden", {
      name: "Southwind Hidden Row",
      product: "Hidden Product",
    });
    await createTransaction(context.request, matchingTransaction);
    await createTransaction(context.request, hiddenTransaction);

    await openTransactionsPage(page);
    await expectTransactionVisible(page, matchingTransaction);
    await expectTransactionVisible(page, hiddenTransaction);

    await page.getByPlaceholder("Search in table...").fill("Northwind");

    await expectTransactionVisible(page, matchingTransaction);
    await expectTransactionHidden(page, hiddenTransaction);
  });

  test("applies and clears advanced filters", async ({
    context,
    page,
    request,
  }) => {
    await createSignedInUser(context, request, "transactions-filters");
    const matchingTransaction = transactionData("filter match", {
      product: "Basic Tees",
      quantity: 18,
      totalCents: 180000,
    });
    const hiddenTransaction = transactionData("filter hidden", {
      product: "Premium Hoodie",
      quantity: 3,
      totalCents: 52000,
    });
    await createTransaction(context.request, matchingTransaction);
    await createTransaction(context.request, hiddenTransaction);

    await openTransactionsPage(page);
    await page.getByRole("button", { name: "Filter" }).click();
    let dialog = page.getByRole("dialog", { name: "Filter transactions" });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("Product").fill("Basic");
    await dialog.getByLabel("Min quantity").fill("10");
    await dialog.getByLabel("Max total (USD)").fill("2000");
    await dialog.getByRole("button", { name: "Apply" }).click();

    await expect(dialog).toBeHidden();
    await expectTransactionVisible(page, matchingTransaction);
    await expectTransactionHidden(page, hiddenTransaction);

    await page.getByRole("button", { name: "Filter" }).click();
    dialog = page.getByRole("dialog", { name: "Filter transactions" });
    await dialog.getByRole("button", { name: "Clear" }).click();

    await expect(dialog).toBeHidden();
    await expectTransactionVisible(page, matchingTransaction);
    await expectTransactionVisible(page, hiddenTransaction);
  });

  test("filters transactions by selected date range", async ({
    context,
    page,
    request,
  }) => {
    await createSignedInUser(context, request, "transactions-date-range");
    const mayTransaction = transactionData("may range", {
      name: "May Date Range Transaction",
      date: "2026-05-14",
    });
    const aprilTransaction = transactionData("april range", {
      name: "April Date Range Transaction",
      date: "2026-04-10",
    });
    await createTransaction(context.request, aprilTransaction);
    await createTransaction(context.request, mayTransaction);

    await openTransactionsPage(page);

    await expectTransactionVisible(page, mayTransaction);
    await expectTransactionHidden(page, aprilTransaction);

    await page
      .getByLabel("Transactions period")
      .selectOption({ label: "April 2026" });

    await expectTransactionVisible(page, aprilTransaction);
    await expectTransactionHidden(page, mayTransaction);
  });

  test("validates the create transaction form", async ({
    context,
    page,
    request,
  }) => {
    await createSignedInUser(context, request, "transactions-validation");

    await openTransactionsPage(page);
    await page.getByRole("button", { name: "Add" }).click();
    const dialog = page.getByRole("dialog", { name: "Add transaction" });
    await dialog.getByRole("button", { name: "Save" }).click();

    await expect(dialog.getByText("Name must be at least 2 characters"))
      .toBeVisible();
    await expect(dialog.getByText("Enter a valid email address")).toBeVisible();
    await expect(dialog.getByText("Product must be at least 2 characters"))
      .toBeVisible();
    await expect(dialog.getByText("Select a date")).toBeVisible();
    await expect(dialog.getByText("Enter a quantity")).toBeVisible();
    await expect(dialog.getByText("Enter a total")).toBeVisible();
    await expect(dialog).toBeVisible();
  });

  test("paginates long transaction lists", async ({
    context,
    page,
    request,
  }) => {
    await createSignedInUser(context, request, "transactions-pagination");
    const oldestTransaction = transactionData("pagination oldest", {
      name: "Pagination Oldest Transaction",
    });
    await createTransaction(context.request, oldestTransaction);

    for (let index = 2; index <= 12; index += 1) {
      await createTransaction(
        context.request,
        transactionData(`pagination item ${index}`, {
          name: `Pagination Transaction ${String(index).padStart(2, "0")}`,
        }),
      );
    }

    await openTransactionsPage(page);

    await expectTransactionHidden(page, oldestTransaction);
    await page
      .getByRole("navigation", { name: "Transactions pages" })
      .getByRole("button", { name: "Next page" })
      .click();

    await expectTransactionVisible(page, oldestTransaction);
  });
});
