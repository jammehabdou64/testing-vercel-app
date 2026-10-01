import { Route } from "bun-jcc";
import { AccountController } from "@Controllers/AccountController";
import { CorrespondenceController } from "@Controllers/CorrespondenceController";
import { ForeignDiplomaticDependentController } from "@Controllers/ForeignDiplomaticDependentController";
import { ForeignDiplomaticMissionController } from "@Controllers/ForeignDiplomaticMissionController";
import { ForeignDiplomaticStaffController } from "@Controllers/ForeignDiplomaticStaffController";
import { ForeignDiplomaticStaffPhotographController } from "@Controllers/ForeignDiplomaticStaffPhotographController";
import { ForeignDirectoryExportController } from "@Controllers/ForeignDirectoryExportController";
import { LeaveController } from "@Controllers/LeaveController";
import { MissionController } from "@Controllers/MissionController";
import { PersonnelController } from "@Controllers/PersonnelController";
import { PersonnelDependentController } from "@Controllers/PersonnelDependentController";
import { PersonnelPhotographController } from "@Controllers/PersonnelPhotographController";
import { PostingController } from "@Controllers/PostingController";
import { VacationNotificationController } from "@Controllers/VacationNotificationController";
import { WelcomeController } from "@Controllers/WelcomeController";

Route.get("/", [WelcomeController, "index"]);

await import("./auth");

Route.get("/accounts", [AccountController, "index"]).middleware("auth");
Route.get("/accounts/create", [AccountController, "create"]).middleware("auth");
Route.post("/accounts", [AccountController, "store"]).middleware("auth");
Route.get("/accounts/{user}/edit", [AccountController, "edit"]).middleware(
  "auth",
);
Route.put("/accounts/{user}", [AccountController, "update"]).middleware("auth");

Route.get("/personnel", [PersonnelController, "index"]).middleware("auth");
Route.get("/personnel/create", [PersonnelController, "create"]).middleware(
  "auth",
);
Route.post("/personnel", [PersonnelController, "store"]).middleware("auth");
Route.get("/personnel/{personnel}", [PersonnelController, "show"]).middleware(
  "auth",
);
Route.get("/personnel/{personnel}/edit", [
  PersonnelController,
  "edit",
]).middleware("auth");
Route.put("/personnel/{personnel}", [PersonnelController, "update"]).middleware(
  "auth",
);

Route.post("/personnel/{personnel}/dependents", [
  PersonnelDependentController,
  "store",
]).middleware("auth");
Route.put("/personnel/{personnel}/dependents/{dependent}", [
  PersonnelDependentController,
  "update",
]).middleware("auth");
Route.delete("/personnel/{personnel}/dependents/{dependent}", [
  PersonnelDependentController,
  "destroy",
]).middleware("auth");

Route.post("/personnel/{personnel}/photograph", [
  PersonnelPhotographController,
  "store",
]).middleware("auth");

Route.get("/personnel/{personnel}/postings", [
  PostingController,
  "index",
]).middleware("auth");
Route.post("/personnel/{personnel}/postings", [
  PostingController,
  "store",
]).middleware("auth");

Route.get("/leave", [LeaveController, "index"]).middleware("auth");
Route.get("/leave/create", [LeaveController, "create"]).middleware("auth");
Route.post("/leave", [LeaveController, "store"]).middleware("auth");
Route.post("/leave/{application}/approve", [
  LeaveController,
  "approve",
]).middleware("auth");
Route.post("/leave/{application}/reject", [
  LeaveController,
  "reject",
]).middleware("auth");

Route.get("/correspondence", [CorrespondenceController, "index"]).middleware(
  "auth",
);
Route.get("/correspondence/create", [
  CorrespondenceController,
  "create",
]).middleware("auth");
Route.post("/correspondence", [CorrespondenceController, "store"]).middleware(
  "auth",
);
Route.get("/correspondence/{correspondence}/pdf", [
  CorrespondenceController,
  "pdf",
]).middleware("auth");

Route.get("/missions", [MissionController, "index"]).middleware("auth");
Route.get("/missions/create", [MissionController, "create"]).middleware("auth");
Route.post("/missions", [MissionController, "store"]).middleware("auth");
Route.get("/missions/{mission}/edit", [MissionController, "edit"]).middleware(
  "auth",
);
Route.put("/missions/{mission}", [MissionController, "update"]).middleware(
  "auth",
);

Route.get("/vacation-notifications", [
  VacationNotificationController,
  "index",
]).middleware("auth");
Route.get("/vacation-notifications/create", [
  VacationNotificationController,
  "create",
]).middleware("auth");
Route.post("/vacation-notifications", [
  VacationNotificationController,
  "store",
]).middleware("auth");
Route.get("/vacation-notifications/{notification}", [
  VacationNotificationController,
  "show",
]).middleware("auth");

Route.get("/foreign-missions", [
  ForeignDiplomaticMissionController,
  "index",
]).middleware("auth");
Route.get("/foreign-missions/create", [
  ForeignDiplomaticMissionController,
  "create",
]).middleware("auth");
Route.post("/foreign-missions", [
  ForeignDiplomaticMissionController,
  "store",
]).middleware("auth");
Route.get("/foreign-missions/export", [
  ForeignDirectoryExportController,
  "show",
]).middleware("auth");
Route.get("/foreign-missions/{mission}/edit", [
  ForeignDiplomaticMissionController,
  "edit",
]).middleware("auth");
Route.put("/foreign-missions/{mission}", [
  ForeignDiplomaticMissionController,
  "update",
]).middleware("auth");

Route.get("/foreign-missions/{mission}/staff", [
  ForeignDiplomaticStaffController,
  "index",
]).middleware("auth");
Route.get("/foreign-missions/{mission}/staff/create", [
  ForeignDiplomaticStaffController,
  "create",
]).middleware("auth");
Route.post("/foreign-missions/{mission}/staff", [
  ForeignDiplomaticStaffController,
  "store",
]).middleware("auth");
Route.get("/foreign-missions/{mission}/staff/{staff}", [
  ForeignDiplomaticStaffController,
  "show",
]).middleware("auth");
Route.get("/foreign-missions/{mission}/staff/{staff}/edit", [
  ForeignDiplomaticStaffController,
  "edit",
]).middleware("auth");
Route.put("/foreign-missions/{mission}/staff/{staff}", [
  ForeignDiplomaticStaffController,
  "update",
]).middleware("auth");
Route.post("/foreign-missions/{mission}/staff/{staff}/photograph", [
  ForeignDiplomaticStaffPhotographController,
  "store",
]).middleware("auth");

Route.post("/foreign-missions/{mission}/staff/{staff}/dependents", [
  ForeignDiplomaticDependentController,
  "store",
]).middleware("auth");
Route.put("/foreign-missions/{mission}/staff/{staff}/dependents/{dependent}", [
  ForeignDiplomaticDependentController,
  "update",
]).middleware("auth");
Route.delete(
  "/foreign-missions/{mission}/staff/{staff}/dependents/{dependent}",
  [ForeignDiplomaticDependentController, "destroy"],
).middleware("auth");
