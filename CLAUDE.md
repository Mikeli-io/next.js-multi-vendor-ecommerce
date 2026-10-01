@AGENTS.md

# Project Instructions

## Component Architecture

- Reuse existing components when appropriate instead of duplicating them.
- Create new reusable components when the UI or functionality requires them.
- Extract repeated UI patterns into shared components.
- Avoid unnecessary abstraction for simple UI that is only used once.

## Local Resource Usage

- You may start, stop, or restart the development server when required for implementation or testing. Reuse an existing development server when practical. Do not leave servers running unnecessarily.

- Do not run production builds repeatedly while implementing or fixing small issues.

- Use typecheck and lint for normal iterative verification.

- Run `npm run build` only at meaningful checkpoints, such as when a feature is complete or before a commit.

- Do not run `npm run build` while a development server is running. If you control the development server, stop it before the build and restart it afterwards only if needed. Avoid running multiple development or production servers simultaneously.

- Do not run multiple resource-intensive operations in parallel.

- Browser testing should use a single browser instance with minimal concurrency.

- Avoid full-page, double-resolution screenshots unless they are specifically necessary. Prefer normal-resolution viewport or cropped screenshots.

- Any browser or temporary process you start must have guaranteed cleanup, including when a test fails.

- At the end of browser testing, verify that no Chrome/Chromium or temporary server processes you started are still running.

- Do not repeatedly run full-project checks after every small edit. Batch related changes and verify them together.

- Git operations are not restricted for the main agent.

- Parallel/sub-agents, when used, should focus on implementation and must not independently start dev servers, production servers, production builds, or browser test suites unless explicitly coordinated by the main agent.

- Preserve the development server state when possible. If the development server was running before you stopped or restarted it for testing, Prisma changes, or a production build, start it again when that operation is finished. Do not leave me responsible for manually restoring the development environment after your work.
