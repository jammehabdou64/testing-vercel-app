import { ServiceProvider } from "bun-jcc";

export class AppServiceProvider extends ServiceProvider {
  override async register(): Promise<void> {}

  override async boot(): Promise<void> {}
}
