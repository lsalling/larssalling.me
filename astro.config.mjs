import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import { rm } from "node:fs/promises";

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
    {
      // /work and its playground assets in public/work exist in `astro dev` only.
      // To publish, rename src/pages/_work.astro to work.astro and drop this.
      name: "work-unpublished",
      hooks: {
        "astro:config:setup": ({ command, injectRoute }) => {
          if (command === "dev") {
            injectRoute({
              pattern: "/work",
              entrypoint: "./src/pages/_work.astro",
            });
          }
        },
        "astro:build:done": async ({ dir }) => {
          await rm(new URL("work", dir), { recursive: true, force: true });
        },
      },
    },
  ],
  adapter: vercel({
    imageService: true,
  }),
  vite: {
    plugins: [tailwindcss()],
  },
});
