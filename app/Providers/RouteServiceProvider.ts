import { ServiceProvider } from "bun-jcc";
import { UrlGenerator } from "bun-jcc/Routing/UrlGenerator";
import { setRouteRouter } from "bun-jcc/Support/Facades/Route";
import { setUrlGenerator } from "bun-jcc/Support/Facades/URL";

export class RouteServiceProvider extends ServiceProvider {
  override async register(): Promise<void> {
    const router = this.app.router();
    setRouteRouter(router);
    setUrlGenerator(
      new UrlGenerator(router, String(this.app.config("app.url", "http://localhost"))),
    );
  }

  override async boot(): Promise<void> {
    await this.mapApiRoutes();
    await this.mapWebRoutes();
  }

  private async mapApiRoutes() {
    await this.app
      .router()
      .prefix("api")
      .middleware("api")
      .group(async () => {
        await import("../../routes/api");
      });
  }

  private async mapWebRoutes() {
    await this.app
      .router()
      .middleware("web")
      .group(async () => {
        await import("../../routes/web");
      });
  }
}
