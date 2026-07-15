/**
 * Lazily loads pdf.js (pdfjs-dist) so the ~1.5MB library only downloads when a
 * user actually opens a PDF. Mirrors the dynamic-import pattern used for
 * Excalidraw (`ExcalidrawCanvas.tsx`) rather than Desmos's script-tag injection,
 * since pdfjs-dist is a real npm package with a bundler-friendly ESM build.
 */

let modPromise: Promise<typeof import('pdfjs-dist')> | null = null

export async function loadPdfJs(): Promise<typeof import('pdfjs-dist')> {
  if (!modPromise) {
    modPromise = import('pdfjs-dist').then((mod) => {
      // A leading slash would resolve against the filesystem root under a
      // file:// origin (packaged/production loadFile), not the app directory —
      // use a relative path, same trick as EXCALIDRAW_ASSET_PATH in main.tsx.
      mod.GlobalWorkerOptions.workerSrc = new URL('pdf/pdf.worker.min.mjs', window.location.href).href
      return mod
    })
  }
  return modPromise
}
