// Import an OPTIONAL peer dependency at runtime, returning null if it is absent.
// The specifier is a variable (not a string literal) so neither tsc nor the bundler
// tries to resolve it at build time — these deps (Transformers.js, WebLLM, DuckDB-Wasm)
// are never installed/bundled unless the consumer opts in. Every caller falls back.
export async function optionalImport<T = unknown>(spec: string): Promise<T | null> {
  try {
    return (await import(/* @vite-ignore */ spec)) as T;
  } catch {
    return null;
  }
}
