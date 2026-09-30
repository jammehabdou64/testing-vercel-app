import { Action, Controller, Inject, Inertia, Password } from "bun-jcc";
import { ResetPasswordRequest } from "../Requests/ResetPasswordRequest";

@Inject()
export class NewPasswordController extends Controller {
  @Action({ params: ["token"] })
  create(token: string) {
    return Inertia.render("Auth/ResetPassword", {
      token,
      email: String(request().query("email", "")),
    });
  }

  @Action()
  async store(request: ResetPasswordRequest) {
    const data = await request.validated();
    const status = await Password.reset({
      email: String(data.email),
      token: String(data.token),
      password: String(data.password),
    });
    if (status !== "passwords.reset") {
      return response()
        .back("/forgot-password")
        .withErrors({ email: "This password reset token is invalid." })
        .toResponse();
    }
    return response().redirect("/login").with("status", "Your password has been reset.").toResponse();
  }
}
