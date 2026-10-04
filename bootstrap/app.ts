import {
  AddQueuedCookiesToResponse,
  Application,
  EncryptCookies,
  StartSession,
  VerifyCsrfToken,
} from "bun-jcc";
import { HandleInertiaRequests } from "../app/Http/Middleware/HandleInertiaRequests";
import { config } from "../config";
import { providers } from "./providers";
import { Logger } from "app/Http/Middleware/Logger";

const app = Application.create();

await app
  .withConfig(config)
  .withMiddleware((middleware) => {
    middleware.alias();
    middleware.web([
      HandleInertiaRequests,
      VerifyCsrfToken,
      StartSession,
      AddQueuedCookiesToResponse,
      EncryptCookies,
    ]);
    middleware.global([Logger]);
  })
  .providers(providers);

export { app };
