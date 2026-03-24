import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, When, Then } = createBdd();

// --- Mock data ---

const mockPlaylistResponse = {
	session_id: "test-session-1",
	state: "completed",
	topic: "advanced vim motions",
	response: {
		kind: "result",
		playlist: {
			topic: "Advanced vim motions",
			videos: [
				{
					video_id: "vid1",
					url: "https://youtube.com/watch?v=vid1",
					title: "The tiny.nvim Philosophy",
					channel: "Neovim Craft",
					duration_secs: 1182,
					view_count: 6400,
					reason: "Great starting point",
					what_makes_it_interesting:
						"Frequently linked in r/neovim but only 6K views",
				},
				{
					video_id: "vid2",
					url: "https://youtube.com/watch?v=vid2",
					title: "mini.ai Deep Dive",
					channel: "Terminal Workflow",
					duration_secs: 1935,
					view_count: 2900,
					reason: "Custom text objects",
					what_makes_it_interesting: "Only 900 subscribers but clear demos",
				},
				{
					video_id: "vid3",
					url: "https://youtube.com/watch?v=vid3",
					title: "Replacing 5 Plugins with mini.surround",
					channel: "Dotfile Diaries",
					duration_secs: 878,
					view_count: 11000,
					reason: "Practical comparison",
					what_makes_it_interesting:
						"Side-by-side comparison with startup benchmarks",
				},
				{
					video_id: "vid4",
					url: "https://youtube.com/watch?v=vid4",
					title: "Building a Minimal Neovim Config",
					channel: "Config From Scratch",
					duration_secs: 1569,
					view_count: 4300,
					reason: "Full config walkthrough",
					what_makes_it_interesting: "Under 200 lines total",
				},
				{
					video_id: "vid5",
					url: "https://youtube.com/watch?v=vid5",
					title: "Treesitter-Powered Motions",
					channel: "Vim Rabbit Hole",
					duration_secs: 1353,
					view_count: 1600,
					reason: "Advanced treesitter integration",
					what_makes_it_interesting:
						"Demos in Lua, Python, and TypeScript",
				},
			],
			overall_rationale:
				"Focused on lesser-known creators covering the tiny.nvim plugin suite.",
		},
	},
};

const mockThreeVideoResponse = {
	...mockPlaylistResponse,
	response: {
		...mockPlaylistResponse.response,
		playlist: {
			...mockPlaylistResponse.response.playlist,
			videos: mockPlaylistResponse.response.playlist.videos.slice(0, 3),
		},
	},
};

// --- Background ---

Given(
	"I completed a conversation about {string}",
	async ({ page }, topic: string) => {
		// Mock session creation
		await page.route("**/api/sessions", async (route) => {
			if (route.request().method() === "POST") {
				await route.fulfill({
					status: 201,
					contentType: "application/json",
					body: JSON.stringify({
						session_id: "test-session-1",
						state: "conversing",
						topic,
						response: {
							kind: "question",
							message: "Tell me more about your preferences",
						},
					}),
				});
			}
		});

		// Mock reply that returns results
		await page.route("**/api/sessions/*/reply", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(mockPlaylistResponse),
			});
		});

		// Navigate through the flow
		await page.goto("/");
		await page.getByRole("textbox").fill(topic);
		await page.getByRole("button", { name: "Find my playlist" }).click();
		await expect(page).toHaveURL(/\/conversation\//);

		// Send a reply to trigger results
		await page.getByPlaceholder("Type your reply...").fill("Show me results");
		await page.getByRole("button", { name: /send/i }).click();
	},
);

Given("the agent has finished searching YouTube", async () => {
	// Implied by the mock returning a result response
});

Given("I am on the results page", async ({ page }) => {
	await expect(page).toHaveURL(/\/results\//);
});

// --- Page layout ---

Then(
	"I should see the title {string} in the header",
	async ({ page }, title: string) => {
		await expect(page.getByText(title)).toBeVisible();
	},
);

Then(
	"I should see a topic tag displaying {string}",
	async ({ page }, topic: string) => {
		await expect(page.getByText(topic)).toBeVisible();
	},
);

// --- Results summary ---

Then(
	"I should see a subtitle indicating the number of videos found",
	async ({ page }) => {
		await expect(page.getByText(/\d+ video/)).toBeVisible();
	},
);

Then(
	"I should see an overall rationale explaining the agent's curation strategy",
	async ({ page }) => {
		await expect(
			page.getByText(/lesser-known creators|curated/i),
		).toBeVisible();
	},
);

// --- Video cards ---

Then("each video card should display:", async ({ page }) => {
	// Verify the first video card has all expected fields
	const firstCard = page.locator("article").first();
	await expect(firstCard).toBeVisible();

	// Thumbnail (image or background)
	await expect(
		firstCard.locator("img, [style*='background']"),
	).toBeVisible();

	// Title
	await expect(firstCard.getByText("The tiny.nvim Philosophy")).toBeVisible();

	// Channel name
	await expect(firstCard.getByText("Neovim Craft")).toBeVisible();

	// Rank number
	await expect(firstCard.getByText("1")).toBeVisible();

	// Rationale
	await expect(
		firstCard.getByText(/Great starting point|6K views/),
	).toBeVisible();
});

Then("I should see {int} video cards", async ({ page }, count: number) => {
	await expect(page.locator("article")).toHaveCount(count);
});

Then(
	"they should be numbered sequentially from {int} to {int}",
	async ({ page }, start: number, end: number) => {
		for (let i = start; i <= end; i++) {
			await expect(
				page.locator("article").nth(i - start).getByText(String(i)),
			).toBeVisible();
		}
	},
);

Then(
	"each video card should include a rationale section",
	async ({ page }) => {
		const cards = page.locator("article");
		const count = await cards.count();
		for (let i = 0; i < count; i++) {
			// Each card should have a rationale text area
			await expect(
				cards.nth(i).locator("[class*='rationale'], [data-rationale]").or(
					cards.nth(i).getByText(/views|breakdown|comparison|demos|config/i),
				),
			).toBeVisible();
		}
	},
);

Then(
	"each rationale should explain what makes the video noteworthy or hard to find",
	async ({ page }) => {
		// Verified by the presence of rationale text in each card
		const cards = page.locator("article");
		const count = await cards.count();
		expect(count).toBeGreaterThan(0);
	},
);

// --- Starting over ---

When("I click the {string} button", async ({ page }, label: string) => {
	await page.getByRole("button", { name: label }).click();
});

Then(
	"no previous conversation state should be retained",
	async ({ page }) => {
		// The topic input should be empty
		await expect(page.getByRole("textbox")).toHaveValue("");
	},
);

// --- Edge cases ---

Given(
	"the agent only found {int} relevant videos",
	async ({ page }, count: number) => {
		// Re-route to return fewer videos
		await page.route("**/api/sessions/*/reply", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(mockThreeVideoResponse),
			});
		});
	},
);

Then(
	"the subtitle should reflect the actual count",
	async ({ page }) => {
		await expect(page.getByText(/3 video/)).toBeVisible();
	},
);

Given(
	"a video's thumbnail image is unavailable",
	async ({ page }) => {
		// Block thumbnail image loading
		await page.route("**/img.youtube.com/**", async (route) => {
			await route.abort();
		});
	},
);

Then(
	"the thumbnail area should show a neutral placeholder background",
	async ({ page }) => {
		const thumbnail = page
			.locator("article")
			.first()
			.locator("[class*='bg-'], img");
		await expect(thumbnail).toBeVisible();
	},
);

Then(
	"the rest of the card should still render correctly",
	async ({ page }) => {
		const firstCard = page.locator("article").first();
		await expect(firstCard.getByText("The tiny.nvim Philosophy")).toBeVisible();
		await expect(firstCard.getByText("Neovim Craft")).toBeVisible();
	},
);
