// MSW setup is not wired here because msw/node does not work in Vitest
// Browser Mode (it relies on Node.js-only modules like async_hooks).
// API mocking will be done at the QueryClient level or via msw/browser
// with setupWorker if needed in future tasks.
