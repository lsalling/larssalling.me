# larssalling.me

Built with Astro and Tailwind CSS.

```sh
bun install
bun run dev
bun run build
```

Deploys to Vercel, which picks up Bun from `bun.lock` and Node from `engines`.

`/work` is dev-only for now. `playground/` records its clips into `public/work`,
and neither the page nor the assets reach production builds (see
`astro.config.mjs`).
