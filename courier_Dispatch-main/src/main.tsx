import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import { APP_BUILD_ID } from "@/lib/build";

async function ensureLatestBuild() {
  try {
    const res = await fetch(`/version.json?ts=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return;

    const data = (await res.json()) as { buildId?: string };
    if (!data?.buildId) return;

    // If the server reports a newer build than the one this JS bundle belongs to,
    // force a navigation to a cache-busted URL.
    if (data.buildId !== APP_BUILD_ID) {
      const url = new URL(window.location.href);
      const currentV = url.searchParams.get("v");
      if (currentV !== data.buildId) {
        url.searchParams.set("v", data.buildId);
        window.location.replace(url.toString());
      }
    }
  } catch {
    // Ignore update check failures to avoid blocking app boot.
  }
}

const rootEl = document.getElementById("root")!;

ensureLatestBuild().finally(() => {
  createRoot(rootEl).render(<App />);
});
