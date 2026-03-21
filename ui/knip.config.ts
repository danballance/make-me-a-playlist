import type { KnipConfig } from "knip";

const config: KnipConfig = {
  ignore: ["src/components/ui/**"],
  ignoreUnresolved: ["@/api/generated/.*", "./routeTree.gen"],
  entry: [
    "src/routes/**/*.tsx",
    "tests/e2e/**/*.ts",
    "tests/mocks/**/*.ts",
  ],
  ignoreDependencies: [
    "@biomejs/biome",
    "@hey-api/typescript",
    "@hey-api/sdk",
    "@hey-api/client-fetch",
    "msw",
  ],
};

export default config;
