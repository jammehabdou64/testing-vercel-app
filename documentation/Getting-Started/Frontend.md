# Frontend

Javel’s browser UI is [Inertia](https://inertiajs.com/) with React. The server still owns the route and the props. The client renders a page component.

For the protocol, shared props, and SSR, see [Inertia](../The%20Basics/Inertia.md). For `@vite` and the React refresh preamble, see [Asset bundling](../The%20Basics/Asset-bundling.md).

---

## Root view

`resources/views/app.html` is the document the first visit returns:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
    @vite(['resources/js/app.tsx'])
    @inertiaHead
  </head>
  <body>
    @inertia
  </body>
</html>
```

`@inertia` writes a JSON script tag and `<div id="app">`. `@inertiaHead` writes server-rendered head tags when SSR is on.

---

## Client entry

`resources/js/app.tsx` boots Inertia and loads every page under `Pages/`:

```tsx
import { createInertiaApp } from "@inertiajs/react";
import { createRoot } from "react-dom/client";
import "../css/app.css";

createInertiaApp({
  resolve: (name) => {
    const pages = import.meta.glob("./Pages/**/*.tsx", { eager: true });
    return pages[`./Pages/${name}.tsx`];
  },
  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />);
  },
});
```

`import.meta.glob` is typed in `resources/js/vite-env.d.ts`. Do not pull in the full `vite/client` types; they clash with Bun’s `ImportMeta`.

A page is a default export:

```tsx
export default function Welcome() {
  return <h1>Javel</h1>;
}
```

Render it from a controller:

```typescript
return Inertia.render("Welcome", {});
```

---

## Styles

`resources/css/app.css` is the Tailwind v4 entry. Import it from `app.tsx` so the Vite client injects it. The `@vite` call in the root view only lists the TypeScript entry; the CSS rides along because the entry imports it.

---

## Dev servers

Two processes:

```bash
bun run dev      # Javel on http://127.0.0.1:8000
bun run watch    # Vite on http://127.0.0.1:5173
```

`vite.config.ts` registers `laravel-vite-plugin`, `@inertiajs/vite`, Tailwind, and `@vitejs/plugin-react`. The Laravel plugin’s input is `resources/css/app.css` and `resources/js/app.tsx`.
