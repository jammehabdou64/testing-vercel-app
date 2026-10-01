import { Action, Controller, HttpException, Inject, Inertia } from "bun-jcc";
import { currentActor } from "../../Auth/CurrentActor";
import type { Actor } from "../../Auth/Actor";
import type { RoleSlug } from "../../Auth/RoleSlug";
import { Mission } from "../../Models/Mission";
import { Personnel } from "../../Models/Personnel";
import { Role } from "../../Models/Role";
import { User } from "../../Models/User";
import { UserPolicy } from "../../Policies/UserPolicy";
import { StoreAccountRequest } from "../Requests/StoreAccountRequest";
import { UpdateAccountRequest } from "../Requests/UpdateAccountRequest";

@Inject()
export class AccountController extends Controller {
  @Action()
  async index() {
    const actor = await currentActor(request());
    if (!new UserPolicy().viewAny(actor)) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    const users = await User.query().orderBy("id").get();
    const roles = await rolesById();
    return Inertia.render("Accounts/Index", {
      accounts: users.map((user) => accountProps(user, roles)),
    });
  }

  @Action()
  async create() {
    const actor = await currentActor(request());
    if (!new UserPolicy().viewAny(actor)) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    return Inertia.render("Accounts/Create", await assignmentChoices());
  }

  @Action()
  async store(form: StoreAccountRequest) {
    const actor = await currentActor(form);
    const assignment = assignmentFrom(await form.validated());
    if (!new UserPolicy().create(actor, assignment)) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    const data = await form.validated();
    const role = await Role.where("slug", assignment.role).first();
    if (!role) {
      throw new HttpException(422, "Unknown role.");
    }

    const user = await User.create({
      name: String(data.name),
      email: String(data.email),
      password: String(data.password),
      role_id: Number(role.id),
      personnel_id: assignment.personnelId,
      mission_id: assignment.missionId,
      email_verified_at: null,
    });

    return response().redirect(`/accounts/${user.id}/edit`).toResponse();
  }

  @Action()
  async edit(user: User) {
    const actor = await currentActor(request());
    if (!new UserPolicy().viewAny(actor)) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    return Inertia.render("Accounts/Edit", {
      account: accountProps(user, await rolesById()),
      ...(await assignmentChoices()),
    });
  }

  @Action()
  async update(user: User, form: UpdateAccountRequest) {
    const actor = await currentActor(form);
    const assignment = assignmentFrom(await form.validated());
    if (!new UserPolicy().update(actor, assignment)) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    const data = await form.validated();
    const role = await Role.where("slug", assignment.role).first();
    if (!role) {
      throw new HttpException(422, "Unknown role.");
    }

    user.setAttribute("name", String(data.name));
    user.setAttribute("email", String(data.email));
    user.setAttribute("role_id", Number(role.id));
    user.setAttribute("personnel_id", assignment.personnelId);
    user.setAttribute("mission_id", assignment.missionId);
    await user.save();

    return response().redirect(`/accounts/${user.id}/edit`).toResponse();
  }
}

function assignmentFrom(data: Record<string, unknown>): Actor {
  return {
    role: String(data.role) as RoleSlug,
    personnelId: nullableId(data.personnel_id),
    missionId: nullableId(data.mission_id),
  };
}

function nullableId(value: unknown): number | null {
  if (value == null || value === "") {
    return null;
  }

  const id = Number(value);
  return Number.isFinite(id) ? id : null;
}

type RoleLabel = { slug: string; name: string };

async function rolesById(): Promise<Map<number, RoleLabel>> {
  const roles = await Role.query().get();
  return new Map(
    roles.map((role) => [
      Number(role.id),
      {
        slug: String(role.getAttribute("slug") ?? ""),
        name: String(role.getAttribute("name") ?? ""),
      },
    ]),
  );
}

async function assignmentChoices() {
  const roles = await Role.query().orderBy("id").get();
  const personnel = await Personnel.query().orderBy("full_name").get();
  const missions = await Mission.query().orderBy("name").get();

  return {
    roles: roles.map((role) => ({
      slug: String(role.getAttribute("slug") ?? ""),
      name: String(role.getAttribute("name") ?? ""),
    })),
    personnel: personnel.map((record) => ({
      id: Number(record.id),
      full_name: String(record.getAttribute("full_name") ?? ""),
    })),
    missions: missions.map((mission) => ({
      id: Number(mission.id),
      name: String(mission.getAttribute("name") ?? ""),
    })),
  };
}

function accountProps(user: User, roles: Map<number, RoleLabel>) {
  const roleId = nullableId(user.getAttribute("role_id"));
  const role = roleId === null ? null : roles.get(roleId) ?? null;

  return {
    id: Number(user.getAttribute("id")),
    name: user.getAttribute("name"),
    email: user.getAttribute("email"),
    role: role?.slug ?? null,
    role_name: role?.name ?? null,
    personnel_id: nullableId(user.getAttribute("personnel_id")),
    mission_id: nullableId(user.getAttribute("mission_id")),
  };
}
