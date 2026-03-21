import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api", () => {
    return HttpResponse.json([
      { title: "Buy groceries", done: false },
      { title: "Walk the dog", done: true },
    ]);
  }),

  http.post("/api", async ({ request }) => {
    const newItem = await request.json();
    return HttpResponse.json(
      [
        { title: "Buy groceries", done: false },
        { title: "Walk the dog", done: true },
        newItem,
      ],
      { status: 201 },
    );
  }),

  http.put("/api/:itemTitle", async ({ request }) => {
    const updated = await request.json();
    return HttpResponse.json([updated, { title: "Walk the dog", done: true }]);
  }),
];
