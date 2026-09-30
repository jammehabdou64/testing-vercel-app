import { Action, Auth, Controller, Inject, Inertia } from "bun-jcc";
import { LoginRequest } from "../Requests/LoginRequest";

@Inject()
export class AuthenticatedSessionController extends Controller {
  @Action()
  create() {
    return Inertia.render("Auth/Login");
  }

  @Action()
  async store(request: LoginRequest) {
    const email = String(await request.validated("email"));
    const password = String(await request.validated("password"));
    const ok = await Auth.attempt(request, { email, password });

    if (!ok) {
      return (
        await response()
          .back("/login")
          .withErrors({ email: "These credentials do not match our records." })
          .withInput()
      ).toResponse();
    }

    const user = await Auth.user(request);
    if (user && !user.hasVerifiedEmail()) {
      return response().redirect("/email/verify").toResponse();
    }

    return response().intended("/dashboard").toResponse();
  }

  @Action()
  async destroy() {
    await Auth.logout(request());
    return response().redirect("/").toResponse();
  }
}
