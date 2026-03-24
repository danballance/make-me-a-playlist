import { defineConfig } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

const testDir = defineBddConfig({
	featuresRoot: "tests/e2e/features",
	steps: "tests/e2e/steps/*.ts",
});

export default defineConfig({
	testDir,
	timeout: 30_000,
	retries: 0,
	use: {
		baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
		headless: true,
	},
});
