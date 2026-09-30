import { Action, Auth, Controller, Inject } from "bun-jcc";

@Inject()
export class EmailVerificationNotificationController extends Controller {
  @Action()
  async store() {
    const user = await Auth.user(request());
    if (user && !user.hasVerifiedEmail()) {
      await user.sendEmailVerificationNotification();
    }
    return response()
      .back("/email/verify")
      .with("status", "A fresh verification link has been sent. The log mailer writes it to the server log.")
      .toResponse();
  }
}
