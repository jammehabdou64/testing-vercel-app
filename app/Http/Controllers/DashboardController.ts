import { Action, Controller, Inject, Inertia } from "bun-jcc";

@Inject()
export class DashboardController extends Controller {
  @Action()
  show() {
    return Inertia.render("Dashboard");
  }
}
