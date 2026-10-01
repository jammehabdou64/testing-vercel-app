# Asset bundling

Vite builds the React entry. Javel’s view engine does not run Vite’s HTML transform, so `@vite` emits the tags itself.

```html
@vite(['resources/js/app.tsx'])
```

`vite.config.ts` uses `laravel-vite-plugin` with that same input, plus Tailwind, `@inertiajs/vite`, and `@vitejs/plugin-react`.

---

## Development

Start Vite with `bun run watch`. It writes the dev server URL to `public/hot`, for example `http://127.0.0.1:5173`.

When that file exists, `@vite` emits:

1. `@vite/client`
2. The React refresh preamble, when an entry ends in `.jsx` or `.tsx`
3. Each entry

The preamble installs `window.$RefreshReg$` before any JSX module runs. `@vitejs/plugin-react` throws if that function is missing. An import of the preamble inside `app.tsx` is too late: Vite prepends eager `import.meta.glob` imports, so `Home.tsx` evaluates first.

CSS imported from the entry is injected by Vite. You do not have to list `app.css` in `@vite` when `app.tsx` imports it.

---

## Production

`bun run vite-build` writes `public/build/manifest.json`. With no `public/hot` file, `@vite` emits the hashed file from the manifest, including CSS the entry imported.

Remove `public/hot` on the server. A leftover hot file sends browsers to a dev server that is not there.

---

## Types

`resources/js/vite-env.d.ts` adds `import.meta.glob` without referencing `vite/client`. A full `vite/client` reference conflicts with Bun’s `ImportMeta` types.
