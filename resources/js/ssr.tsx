import { createInertiaApp } from "@inertiajs/react";
import createServer from "@inertiajs/react/server";
import ReactDOMServer from "react-dom/server";

createServer((page) =>
  createInertiaApp({
    page,
    render: ReactDOMServer.renderToString,
    resolve: (name) => {
      const pages = import.meta.glob("./Pages/**/*.tsx");
      const load = pages[`./Pages/${name}.tsx`] ?? pages["./Pages/Unbuilt.tsx"];
      if (!load) {
        throw new Error(`Missing Inertia page ${name}.`);
      }
      return load();
    },
    setup: ({ App, props }) => <App {...props} />,
  }),
);
