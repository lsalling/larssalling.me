# Playground

Records portfolio clips and stills from the real running products, on a virtual
clock, so output is an exact 60 fps however slow the capture is.

Needs, on localhost: Trawle on `:3000`, Numina's app (`bun run dev`, `:5173`, with
the local Supabase seed) and its marketing site (`bunx astro dev --port 4400` in
`packages/marketing`). Override with `TRAWLE`, `NUMINA_APP` and `NUMINA_SITE`.

```sh
node playground/record.mjs <scene|all>   # masters and stills in playground/out
node playground/encode.mjs [scene]       # 1080p60 mp4 and webp in public/work
node playground/check.mjs <scene>        # numbers, loop quality and a contact sheet
```

To add a clip, add an entry to `scenes/<project>.mjs`: load the page, `rec.freeze()`, then
script it with `rec.move`, `rec.click` and `rec.wait` between `rec.startVideo()`
and `rec.stopVideo()`. End in the state it started in, and it loops by itself.
