import { createRoot } from "react-dom/client";
import "@fontsource/archivo-black/400.css";

import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Application root element is missing");
}

const root = createRoot(rootElement);
const entryRecoveryKey = "omenx:entry-module-recovery";

const recoverEntryModule = (error: unknown) => {
  console.error("Failed to load the application entry module", error);

  // A Vite restart can invalidate a timestamped module URL while the preview
  // tab is still open. Reload once so the browser requests the current graph;
  // the guard prevents a persistent network/auth failure from reload-looping.
  if (sessionStorage.getItem(entryRecoveryKey) !== "1") {
    sessionStorage.setItem(entryRecoveryKey, "1");
    window.location.reload();
    return;
  }

  root.render(
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center text-sm text-muted-foreground">
      The preview could not reconnect. Refresh the page to try again.
    </main>,
  );
};

const markEntryLoaded = () => sessionStorage.removeItem(entryRecoveryKey);

// Style-guide preview iframes boot a slim app (no global services, no full page graph).
if (window.location.pathname.startsWith("/style-guide/preview")) {
  import("./pages/StyleGuide/preview/PreviewApp").then(({ default: PreviewApp }) => {
    markEntryLoaded();
    root.render(<PreviewApp />);
  }).catch(recoverEntryModule);
} else {
  import("./App.tsx").then(({ default: App }) => {
    markEntryLoaded();
    root.render(<App />);
  }).catch(recoverEntryModule);
}
