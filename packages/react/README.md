# @michi-vz/react

React wrappers for michi-vz charts.

Part of the [**@michi-vz**](https://www.npmjs.com/org/michi-vz) framework-agnostic
data-visualization library - a plain-TS engine, native web components, and thin
React/Vue/Svelte/Angular wrappers. Every chart emits an LLM-ready `ChartContext`.

```bash
npm i @michi-vz/react
```

## Framework packages

Pick the package for your stack - they all render the same charts from the same engine:

| Package | For |
| --- | --- |
| [@michi-vz/core](https://www.npmjs.com/package/@michi-vz/core) | Framework-agnostic engine, no framework deps |
| [@michi-vz/wc](https://www.npmjs.com/package/@michi-vz/wc) | Native web components (Lit, light DOM) |
| **[@michi-vz/react](https://www.npmjs.com/package/@michi-vz/react)** (this package) | React 18+ |
| [@michi-vz/vue](https://www.npmjs.com/package/@michi-vz/vue) | Vue 3 |
| [@michi-vz/svelte](https://www.npmjs.com/package/@michi-vz/svelte) | Svelte |
| [@michi-vz/angular](https://www.npmjs.com/package/@michi-vz/angular) | Angular |

Full usage, the chart gallery, and the light-DOM colour contract are in the
[monorepo README](https://github.com/beany-vu/michi-vz-mono) and the
[live docs](https://michi-vz.netlify.app/).

## For AI assistants

The whole library is documented in one machine-readable file: [llms-full.txt](https://michi-vz.netlify.app/llms-full.txt) (compact index: [llms.txt](https://michi-vz.netlify.app/llms.txt)). Point a coding agent at it for correct props, usage per framework, and the ChartContext shape.

## License

MIT © Beany Vu
