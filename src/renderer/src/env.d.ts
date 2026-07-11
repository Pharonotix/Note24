/// <reference types="vite/client" />

// nerdamer's `all.min` bundle (core + Algebra + Calculus + Solve in one module)
// ships no types for this subpath; declare the minimal shape we use.
declare module 'nerdamer/all.min' {
  const nerdamer: (expr: string, subs?: Record<string, unknown>) => { toString(): string }
  export default nerdamer
}
