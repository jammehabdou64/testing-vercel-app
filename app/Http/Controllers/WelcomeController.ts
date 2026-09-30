import { Controller, Inject, Inertia } from "bun-jcc";

@Inject()
export class WelcomeController extends Controller {
  //
  index() {
    return Inertia.render("Welcome");
  }
}
