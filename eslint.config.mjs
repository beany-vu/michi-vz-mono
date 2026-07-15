// Flat ESLint config for the michi-vz monorepo.
// One shared config at the root; each package runs "eslint src" (mirrors the
// per-package "typecheck": "tsc --noEmit" pattern). ESLint resolves this file by
// walking up from each package cwd.
//
// Rollout is intentionally lenient: the suppression-heavy rules are "warn" (not
// "error") so "pnpm lint" exits 0 while the dormant eslint-disable comments in
// the source become meaningful again. Tighten to error + --max-warnings=0 later.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/*.d.ts",
      "**/.vitepress/cache/**",
      "**/storybook-static/**",
    ],
  },

  // Base: all publishable package sources (plain TS plus the one React TSX file).
  {
    files: ["packages/**/*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      "no-console": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },

  // React wrapper: turn the hooks rules back on. rules-of-hooks stays an error
  // (real bug catcher); exhaustive-deps is a warning, which is what the 23
  // existing eslint-disable-next-line comments in src/index.tsx suppress.
  {
    files: ["packages/react/**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-hooks/exhaustive-deps": "warn",
    },
  },

  // Tests: allow the shortcuts test code legitimately takes.
  {
    files: ["packages/*/test/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
    },
  },

  // Must be last: disable stylistic rules that would fight Prettier.
  prettier,
);
