import { AppServiceProvider } from "../app/Providers/AppServiceProvider";
import { RouteServiceProvider } from "../app/Providers/RouteServiceProvider";

/**
 * Application providers.
 * Database, queue, and the other framework services are already registered
 * by the framework's default provider list.
 */
export const providers = [AppServiceProvider, RouteServiceProvider];
