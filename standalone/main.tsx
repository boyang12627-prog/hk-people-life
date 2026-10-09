/**
 * Standalone entry (GitHub Pages / `npm run dev`). The original hosting platform keeps using
 * src/routes/__root.tsx and src/routes/index.tsx with its own router; this file is not used there.
 * The one route is "/", which renders LifeApp, so no router is needed here.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { LifeApp } from "@/components/life/LifeApp";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PreviewHostBridge />
    <AuthProvider>
      <LifeApp />
    </AuthProvider>
  </StrictMode>,
);
