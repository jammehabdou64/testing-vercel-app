import type { MiddlewareContext } from "bun-jcc/Http/type";

export class Logger {
  async handle({ request, next }: MiddlewareContext) {
    const start = performance.now();

    const response = await next();

    const duration = performance.now() - start;

    const method = request.method();

    const url = request.url().pathname;

    console.log(
      `${method} ${url} ${statusOf(response)} ${duration.toFixed(2)} ms`,
    );
    return response;
  }
}

function statusOf(response: unknown): number {
  if (response instanceof Response) {
    return response.status;
  }

  if (
    response !== null &&
    typeof response === "object" &&
    "getStatus" in response &&
    typeof response.getStatus === "function"
  ) {
    return response.getStatus();
  }

  return 200;
}
