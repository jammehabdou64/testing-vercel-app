import { Action, Auth, Controller, EmailVerification, Inject } from "bun-jcc";

@Inject()
export class VerifyEmailController extends Controller {
  @Action({ params: ["id", "hash"] })
  async verify(_id: string, _hash: string) {
    const current = request();
    const user = await Auth.user(current);
    if (!user || !(await EmailVerification.verify(current, user))) {
      return response().redirect("/email/verify").with("status", "The verification link is invalid.").toResponse();
    }
    return response().redirect("/dashboard").with("status", "Email verified.").toResponse();
  }
}
