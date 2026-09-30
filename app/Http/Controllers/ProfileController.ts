import { Action, Auth, Controller, Hash, Inject, Inertia } from "bun-jcc";
import { DeleteAccountRequest } from "../Requests/DeleteAccountRequest";
import { PasswordUpdateRequest } from "../Requests/PasswordUpdateRequest";
import { ProfileUpdateRequest } from "../Requests/ProfileUpdateRequest";

@Inject()
export class ProfileController extends Controller {
  @Action()
  edit() {
    return Inertia.render("Profile/Edit");
  }

  @Action()
  async update(request: ProfileUpdateRequest) {
    const data = await request.validated();
    const user = await Auth.user(request);
    if (!user) {
      return response().redirect("/login").toResponse();
    }
    const email = String(data.email);
    const changed = email !== String(user.getAttribute("email") ?? "");
    user.setAttribute("name", String(data.name));
    user.setAttribute("email", email);
    if (changed) {
      user.setAttribute("email_verified_at", null);
    }
    await user.save();
    if (changed) {
      await user.sendEmailVerificationNotification();
      return response()
        .redirect("/email/verify")
        .with("status", "Profile updated. Verify the new email address.")
        .toResponse();
    }
    return response().back("/profile").with("status", "Profile updated.").toResponse();
  }

  @Action()
  async password(request: PasswordUpdateRequest) {
    const current = String(await request.validated("current_password"));
    const next = String(await request.validated("password"));
    const user = await Auth.user(request);
    if (!user || !(await Hash.check(current, user.getAuthPassword()))) {
      return (
        await response()
          .back("/profile")
          .withErrors({ current_password: "The password is incorrect." })
      ).toResponse();
    }
    user.setAuthPassword(await Hash.make(next));
    await user.save();
    return response().back("/profile").with("status", "Password updated.").toResponse();
  }

  @Action()
  async destroy(request: DeleteAccountRequest) {
    const password = String(await request.validated("password"));
    const user = await Auth.user(request);
    if (!user || !(await Hash.check(password, user.getAuthPassword()))) {
      return (
        await response()
          .back("/profile")
          .withErrors({ password: "The password is incorrect." })
      ).toResponse();
    }
    await Auth.logout(request);
    await user.delete();
    return response().redirect("/").toResponse();
  }
}
