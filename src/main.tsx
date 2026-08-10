import { createRoot } from "react-dom/client";
import "@fontsource/archivo-black/400.css";

import "./index.css";

const root = createRoot(document.getElementById("root")!);

// Style-guide preview iframes boot a slim app (no global services, no full page graph).
if (window.location.pathname.startsWith("/style-guide/preview")) {
  import("./pages/StyleGuide/preview/PreviewApp").then(({ default: PreviewApp }) => {
    root.render(<PreviewApp />);
  });
} else {
  import("./App.tsx").then(({ default: App }) => {
    root.render(<App />);
  });
}
