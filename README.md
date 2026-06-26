# Markdown Slides

A markdown-first slide studio prototype built with React and TypeScript.

The app is intentionally static-host friendly: browser storage is the first
persistence layer, and the production build uses relative asset paths so it can
be published to GitHub Pages without a backend.

## GitHub Pages

The repository includes a GitHub Pages workflow. Push the app to `main`, enable
Pages with GitHub Actions as the source if prompted, and the workflow deploys
the static `dist/` build.

## Scripts

- `npm run dev` starts the local app.
- `npm run build` typechecks and creates the static build in `dist/`.
- `npm run test` runs core/unit tests.
- `npm run test:e2e` runs Playwright browser flows.
- `npm run validate` runs typecheck, unit tests, and browser flows.
