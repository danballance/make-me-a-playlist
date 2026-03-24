import { defineConfig } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

const testDir = defineBddConfig({
	paths: ["tests/e2e/features/**/*.feature"],
	require: ["tests/e2e/steps/**/*.ts"],
	outputDir: ".features-gen",
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
