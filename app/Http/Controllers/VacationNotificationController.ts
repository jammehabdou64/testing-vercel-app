import { Action, Controller, HttpException, Inject, Inertia } from "bun-jcc";
import { currentActor } from "../../Auth/CurrentActor";
import { Personnel } from "../../Models/Personnel";
import { User } from "../../Models/User";
import { VacationNotification } from "../../Models/VacationNotification";
import { VacationNotificationPolicy } from "../../Policies/VacationNotificationPolicy";
import { VacationNotificationService } from "../../Services/VacationNotificationService";
import type { VacationNotificationRow } from "../../Services/VacationNotificationService";
import { VacationWorkflowError } from "../../Services/VacationWorkflowError";
import { StoreVacationNotificationRequest } from "../Requests/StoreVacationNotificationRequest";

@Inject()
export class VacationNotificationController extends Controller {
  @Action()
  async index() {
    const actor = await currentActor(request());
    const service = this.service();
    if (!service.canList(actor)) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    const notifications = await service.visibleTo(actor);
    const officerNames = await officerNameMap(notifications.map((notification) => notification.personnel_id));
    return Inertia.render("Vacation/Index", {
      notifications: notifications.map((notification) => ({
        ...notificationProps(notification),
        officer_name: officerNames.get(notification.personnel_id) ?? "",
      })),
    });
  }

  @Action()
  async create() {
    const actor = await currentActor(request());
    if (
      actor.personnelId === null ||
      !new VacationNotificationPolicy().create(actor, actor.personnelId)
    ) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    return Inertia.render("Vacation/Create");
  }

  @Action()
  async store(form: StoreVacationNotificationRequest) {
    const actor = await currentActor(form);
    const data = await form.validated();

    try {
      await this.service().file(actor, {
        travellingCountry: String(data.travelling_country),
        reason: String(data.reason),
        submittedOn: String(data.submitted_on),
      });
    } catch (error) {
      if (error instanceof VacationWorkflowError) {
        throw new HttpException(422, error.message);
      }
      throw error;
    }

    return response().redirect("/vacation-notifications").toResponse();
  }

  @Action()
  async show(notification: VacationNotification) {
    const actor = await currentActor(request());
    if (!new VacationNotificationPolicy().view(actor, notification)) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    const personnelId = Number(notification.getAttribute("personnel_id"));
    const officerNames = await officerNameMap([personnelId]);
    return Inertia.render("Vacation/Show", {
      notification: {
        id: Number(notification.getAttribute("id")),
        personnel_id: personnelId,
        officer_name: officerNames.get(personnelId) ?? "",
        travelling_country: notification.getAttribute("travelling_country"),
        reason: notification.getAttribute("reason"),
        submitted_on: String(notification.getAttribute("submitted_on")).slice(0, 10),
      },
    });
  }

  private service(): VacationNotificationService {
    return new VacationNotificationService(User.getConnection());
  }
}

async function officerNameMap(personnelIds: number[]): Promise<Map<number, string>> {
  const ids = [...new Set(personnelIds)];
  if (ids.length === 0) {
    return new Map();
  }

  const officers = await Personnel.query().whereIn("id", ids).get();
  return new Map(
    officers.map((officer) => [Number(officer.id), String(officer.getAttribute("full_name") ?? "")]),
  );
}

function notificationProps(notification: VacationNotificationRow) {
  return {
    id: notification.id,
    personnel_id: notification.personnel_id,
    travelling_country: notification.travelling_country,
    reason: notification.reason,
    submitted_on: notification.submitted_on,
  };
}
