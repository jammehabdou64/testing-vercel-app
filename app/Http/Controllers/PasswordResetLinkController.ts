import { Action, Controller, Inject, Inertia, Password } from "bun-jcc";
import { ForgotPasswordRequest } from "../Requests/ForgotPasswordRequest";

@Inject()
export class PasswordResetLinkController extends Controller {
  @Action()
  create() {
    return Inertia.render("Auth/ForgotPassword");
  }

  @Action()
  async store(request: ForgotPasswordRequest) {
    const email = String(await request.validated("email"));
    const status = await Password.sendResetLink(email);
    if (status === "passwords.sent") {
      return response()
        .back("/forgot-password")
        .with("status", "We have emailed your password reset link. The log mailer writes it to the server log.")
        .toResponse();
    }
    return response()
      .back("/forgot-password")
      .withErrors({ email: "We can't find a user with that email address." })
      .toResponse();
  }
}
