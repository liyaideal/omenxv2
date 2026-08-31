// A deployed build replaces its hashed chunk filenames. A tab that is still
// running the previous build will 404 when it lazily imports a chunk. Reload
// once (guarded via sessionStorage) so the tab picks up the current graph.
const KEY = "omenx:chunk-recovery";

export function retryChunkImport<T>(loader: () => Promise<T>): Promise<T> {
  return loader().catch((error) => {
    if (typeof window !== "undefined" && sessionStorage.getItem(KEY) !== "1") {
      sessionStorage.setItem(KEY, "1");
      window.location.reload();
      // Never resolves — the page is going away.
      return new Promise<T>(() => {});
    }
    throw error;
  });
}

if (typeof window !== "undefined") {
  window.addEventListener("load", () => sessionStorage.removeItem(KEY));
}
