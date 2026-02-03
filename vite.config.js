import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig(({ mode }) => {
  const config = {
    plugins: [svelte()],

    build: {
      outDir: "dist",
      emptyOutDir: true, // Clean previous builds
    },
  }; // Use proper base path for GitHub Pages deployment
  if (process.env.GITHUB_REPOSITORY_OWNER) {
    config.base = `/ome-ngff-tools/`;
    console.log("[vite] Using GitHub Pages base path:", config.base);
  } else {
    config.base = "./";
  }

  return config;
});
