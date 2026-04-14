import { defineConfig } from "tsup";
import { cp, mkdir } from "node:fs/promises";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "es2020",
  external: ["react", "react-dom"],
  // Inline @consiliency/* workspace deps so the published artifact
  // is self-contained and installable from a single git ref.
  noExternal: [/^@consiliency\//],
  async onSuccess() {
    await mkdir("dist/styles", { recursive: true });
    await cp("src/styles/panel.css", "dist/styles/panel.css");
  },
});
