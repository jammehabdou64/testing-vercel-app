import { Action, Auth, Controller, Inject, Inertia } from "bun-jcc";
import { User } from "../../Models/User";
import { RegisterRequest } from "../Requests/RegisterRequest";

@Inject()
export class RegisteredUserController extends Controller {
  @Action()
  create() {
    return Inertia.render("Auth/Register");
  }

  @Action()
  async store(request: RegisterRequest) {
    const data = await request.validated();
    const user = await User.create({
      name: String(data.name),
      email: String(data.email),
      password: String(data.password),
    });
    await Auth.login(request, user);
    await user.sendEmailVerificationNotification();
    return response().redirect("/email/verify").toResponse();
  }
}
