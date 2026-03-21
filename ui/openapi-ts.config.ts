import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "../schema/openapi.json",
  output: "src/api/generated",
  plugins: [
    "@hey-api/typescript",
    "@hey-api/sdk",
    "@hey-api/client-fetch",
    "@tanstack/react-query",
  ],
});
