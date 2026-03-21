import { test, expect } from "@playwright/test";

test.describe("Todo App", () => {
  test.beforeEach(async ({ request, baseURL }) => {
    const response = await request.delete(`${baseURL}/api/`);
    expect(response.ok()).toBeTruthy();
  });

  test("full happy path: add, toggle, and filter todos", async ({ page }) => {
    await page.goto("/");

    // Page loads with empty state
    await expect(page.getByText("No todos yet")).toBeVisible();

    // Add a todo
    await page.getByPlaceholder("Add a new todo...").fill("Buy groceries");
    await page.getByRole("button", { name: "Add" }).click();

    // Todo appears in the list
    await expect(page.getByText("Buy groceries")).toBeVisible();

    // Add another todo
    await page.getByPlaceholder("Add a new todo...").fill("Walk the dog");
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText("Walk the dog")).toBeVisible();

    // Toggle first todo as done
    const checkboxes = page.getByRole("checkbox");
    await checkboxes.first().click();

    // Filter to done only
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await expect(page.getByText("Buy groceries")).toBeVisible();
    await expect(page.getByText("Walk the dog")).not.toBeVisible();

    // Filter to not done only
    await page.getByRole("button", { name: "Not Done" }).click();
    await expect(page.getByText("Walk the dog")).toBeVisible();
    await expect(page.getByText("Buy groceries")).not.toBeVisible();

    // Back to all
    await page.getByRole("button", { name: "All" }).click();
    await expect(page.getByText("Buy groceries")).toBeVisible();
    await expect(page.getByText("Walk the dog")).toBeVisible();
  });
});
