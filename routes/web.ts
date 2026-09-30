import { Route } from "bun-jcc";
import { AuthenticatedSessionController } from "@Controllers/AuthenticatedSessionController";
import { DashboardController } from "@Controllers/DashboardController";
import { EmailVerificationNotificationController } from "@Controllers/EmailVerificationNotificationController";
import { EmailVerificationPromptController } from "@Controllers/EmailVerificationPromptController";
import { NewPasswordController } from "@Controllers/NewPasswordController";
import { PasswordResetLinkController } from "@Controllers/PasswordResetLinkController";
import { ProfileController } from "@Controllers/ProfileController";
import { RegisteredUserController } from "@Controllers/RegisteredUserController";
import { VerifyEmailController } from "@Controllers/VerifyEmailController";
import { WelcomeController } from "@Controllers/WelcomeController";

Route.get("/", [WelcomeController, "index"]);

Route.get("/login", [AuthenticatedSessionController, "create"])
  .middleware("guest")
  .name("login");
Route.post("/login", [AuthenticatedSessionController, "store"]).middleware(
  "guest",
);
Route.get("/register", [RegisteredUserController, "create"]).middleware(
  "guest",
);
Route.post("/register", [RegisteredUserController, "store"]).middleware(
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
Route.get("/email/verify", [
  EmailVerificationPromptController,
  "show",
]).middleware("auth");
Route.get("/email/verify/{id}/{hash}", [VerifyEmailController, "verify"])
  .middleware("auth")
  .name("verification.verify");
Route.post("/email/verification-notification", [
  EmailVerificationNotificationController,
  "store",
]).middleware("auth");

Route.get("/dashboard", [DashboardController, "show"]).middleware("verified");
Route.redirect("/home", "/dashboard").middleware("verified");
Route.get("/profile", [ProfileController, "edit"]).middleware("verified");
Route.patch("/profile", [ProfileController, "update"]).middleware("verified");
Route.put("/password", [ProfileController, "password"]).middleware("verified");
Route.delete("/profile", [ProfileController, "destroy"]).middleware("verified");
