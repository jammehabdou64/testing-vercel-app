import { env } from "bun-jcc/helpers";

export const app = {
  /*
    |--------------------------------------------------------------------------
    | Application Name
    |--------------------------------------------------------------------------
    |
    | This value is the name of your application, which will be used when the
    | framework needs to place the application's name in a notification or
    | other UI elements where an application name needs to be displayed.
    |
    */
  name: env("APP_NAME", "JCC"),

  /*
    |--------------------------------------------------------------------------
    | Application Environment
    |--------------------------------------------------------------------------
    |
    | This value determines the "environment" your application is currently
    | running in. This may determine how you prefer to configure various
    | services the application utilizes. Set this in your ".env" file.
    |
    */
  env: env("APP_ENV", "local"),

  /*
    |--------------------------------------------------------------------------
    | Application URL
    |--------------------------------------------------------------------------
    |
    | This URL is used by the console to properly generate URLs when using
    | the Artisan command line tool. You should set this to the root of
    | your application so that it is used when running Artisan tasks.
    |
    */
  url: env("APP_URL", "http://localhost"),

  /*
    |--------------------------------------------------------------------------
    | Application Debug Mode
    |--------------------------------------------------------------------------
    |
    | When your application is in debug mode, detailed error messages with
    | stack traces will be shown. However, make sure to turn this off for
    | production environments for security reasons.
    |
    */

  debug: env("APP_DEBUG", false),

  /*
    |--------------------------------------------------------------------------
    | Application Key
    |--------------------------------------------------------------------------
    |
    | This key is used to sign your application's cookies. You should set this
    | to a random, 32 character string, otherwise these encrypted cookies won't
    | be safe. Please do this before deploying your application to production.
    |
    */

  key: env("APP_KEY"),
};
