import { Route } from "bun-jcc";
import { AuthenticatedSessionController } from "@Controllers/AuthenticatedSessionController";
import { DashboardController } from "@Controllers/DashboardController";
import { NewPasswordController } from "@Controllers/NewPasswordController";
import { PasswordResetLinkController } from "@Controllers/PasswordResetLinkController";
import { ProfileController } from "@Controllers/ProfileController";

Route.get("/login", [AuthenticatedSessionController, "create"])
  .middleware("guest")
  .name("login");

Route.post("/login", [AuthenticatedSessionController, "store"]).middleware(
  "guest",
);

Route.get("/forgot-password", [
  PasswordResetLinkController,
  "create",
]).middleware("guest");

Route.post("/forgot-password", [
  PasswordResetLinkController,
  "store",
]).middleware("guest");

Route.get("/reset-password/{token}", [NewPasswordController, "create"])
  .middleware("guest")
  .name("password.reset");

Route.post("/reset-password", [NewPasswordController, "store"]).middleware(
  "guest",
);

Route.post("/logout", [AuthenticatedSessionController, "destroy"]).middleware(
  "auth",
);
Route.get("/dashboard", [DashboardController, "show"]).middleware("auth");
Route.redirect("/home", "/dashboard").middleware("auth");
Route.get("/profile", [ProfileController, "edit"]).middleware("auth");
Route.patch("/profile", [ProfileController, "update"]).middleware("auth");
Route.put("/password", [ProfileController, "password"]).middleware("auth");
Route.delete("/profile", [ProfileController, "destroy"]).middleware("auth");
