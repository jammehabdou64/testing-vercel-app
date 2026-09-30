import { DatabaseServiceProvider } from "bun-jcc";
import { AppServiceProvider } from "../app/Providers/AppServiceProvider";
import { RouteServiceProvider } from "../app/Providers/RouteServiceProvider";

export const providers = [DatabaseServiceProvider, AppServiceProvider, RouteServiceProvider];
