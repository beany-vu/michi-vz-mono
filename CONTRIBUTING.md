# Contributing to @michi-vz

Thanks for your interest in michi-vz. It is a free and open source, framework-agnostic
charting library: a plain-TypeScript engine, native web components, and thin React, Vue,
Svelte, and Angular wrappers. Contributions of all sizes are welcome, from typo fixes to
new chart types.

## Ways to contribute

- **Report a bug or request a feature** by opening an issue.
- **Ask a question or share what you built** in Discussions.
- **Improve the docs** in `apps/docs`.
- **Add or improve a chart** in the core engine and wrappers.

## Getting started

This is a pnpm monorepo (pnpm via corepack).

```bash
pnpm install             # install workspace dependencies
pnpm build               # build all packages (ESM + CJS + DTS)
pnpm typecheck           # type-check every package
pnpm test                # run the vitest suite in @michi-vz/core
pnpm verify:playground   # headless Playwright checks
```

Run any app (such as the docs site) with Docker rather than starting it directly.

```bash
pnpm --filter docs build   # build the VitePress docs site
```

## Pull request flow

1. Branch off `main`.
2. Make your change. Keep the tree green: `pnpm test`, `pnpm typecheck`, and
   `pnpm verify:playground` should all pass.
3. Add tests for any new behavior, and update the docs when you change public API.
4. For any change to a published package, add a changeset: `pnpm changeset`.
5. Open a pull request with a clear description of the what and the why.

## Adding a chart

A new chart touches several places: the core engine and its chart context, the web
component, the four framework wrappers, examples, and the docs. Keep behavior consistent
across the SVG and canvas renderers, and add tests for both. Follow the pattern of the
existing charts.

## Translations

The docs site ships in English, French, Dutch, and Vietnamese. The English pages
live in `apps/docs/`, and each locale mirrors them under `apps/docs/fr/`,
`apps/docs/nl/`, and `apps/docs/vi/`. UI strings (nav, sidebar, footer, chart names)
live in `apps/docs/.vitepress/i18n.ts`.

Help is very welcome here, whether you want to improve an existing translation or add
a new language:

- **Fix or refine** a translated page: edit the matching file under `apps/docs/<lang>/`
  and open a pull request. Keep code blocks, component tags, and frontmatter keys
  unchanged; translate only the prose, and keep internal links prefixed with the
  locale (for example `/fr/guide/why`).
- **Add a language**: open an issue or a Discussion first so we can add the locale to
  `i18n.ts` and `config.ts`, then translate `apps/docs/<lang>/` from the English source.

Not a developer? Opening an issue with corrections in plain text is just as helpful.

## Code style

- Match the style of the surrounding code.
- Keep colors the consumer's contract: `core.css` does layout only and never sets
  `fill` or `stroke`.

## Conduct

Please be respectful and constructive. We want michi-vz to be a welcoming project for
everyone.
