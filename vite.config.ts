import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  // tanstackStart() bundles the router's code-splitting/codegen plugin, which
  // must run before any JSX transform (react()) sees the route files —
  // reversing this order breaks `vite build` entirely.
  plugins: [tanstackStart(), react(), tailwindcss(), tsconfigPaths()],
});
