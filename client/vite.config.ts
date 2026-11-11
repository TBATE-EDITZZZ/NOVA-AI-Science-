import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const clientRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: clientRoot,
  plugins: [react()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  publicDir: "public",
  server: { host: "0.0.0.0", port: 3000, strictPort: true },
  build: { outDir: "dist", emptyOutDir: true, sourcemap: false },
});
