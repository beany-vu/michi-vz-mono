// No-op production entry: same surface as ./panel, zero behavior, zero DOM, and it
// never enables the core hook. Lets consumers keep a single import site and swap in
//   import("@michi-vz/devtools/production")
// (or alias the subpath in their bundler) for builds where devtools must stay inert.
import type { DevtoolsHandle, MountDevtoolsOptions } from "./panel";

export type { DevtoolsHandle, MountDevtoolsOptions } from "./panel";

export function mountDevtools(_opts: MountDevtoolsOptions = {}): DevtoolsHandle {
  const noop = (): void => {};
  return { open: noop, close: noop, toggle: noop, refresh: noop, destroy: noop, getRoot: () => null };
}
