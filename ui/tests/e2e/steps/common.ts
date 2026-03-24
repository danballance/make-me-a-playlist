import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, When, Then } = createBdd();

// --- Navigation ---

Given("I am on the topic input page", async ({ page }) => {
	await page.goto("/");
});

// --- Generic actions ---

When("I click {string}", async ({ page }, label: string) => {
	await page.getByRole("button", { name: label }).click();
});

// --- Generic assertions ---

Then(
	"I should see the heading {string}",
	async ({ page }, heading: string) => {
		await expect(
			page.getByRole("heading", { name: heading }),
		).toBeVisible();
	},
);

Then("I should be navigated to the topic input page", async ({ page }) => {
	await expect(page).toHaveURL("/");
});

Then("I should see a {string} button", async ({ page }, label: string) => {
	await expect(page.getByRole("button", { name: label })).toBeVisible();
});

export { Given, When, Then };
