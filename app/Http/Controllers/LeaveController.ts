import { Action, Controller, HttpException, Inject, Inertia } from "bun-jcc";
import { currentActor } from "../../Auth/CurrentActor";
import { leave } from "../../../config/leave";
import { LeaveApplication } from "../../Models/LeaveApplication";
import { Personnel } from "../../Models/Personnel";
import { User } from "../../Models/User";
import { LeaveApplicationPolicy } from "../../Policies/LeaveApplicationPolicy";
import { dueBackOn } from "../../Services/LeaveDates";
import { LeaveService } from "../../Services/LeaveService";
import type { LeaveType } from "../../Services/LeaveService";
import { LeaveWorkflowError } from "../../Services/LeaveWorkflowError";
import { QueueLeaveSubmitted } from "../../Services/QueueLeaveSubmitted";
import { StoreLeaveRequest } from "../Requests/StoreLeaveRequest";

@Inject()
export class LeaveController extends Controller {
  @Action()
  async index() {
    const actor = await currentActor(request());
    const policy = new LeaveApplicationPolicy();
    const ownPersonnelId =
      actor.personnelId !== null && policy.create(actor, actor.personnelId)
        ? actor.personnelId
        : null;

    if (!policy.viewAny(actor) && ownPersonnelId === null) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    const query = LeaveApplication.query().orderBy("id");
    const records = ownPersonnelId === null || policy.viewAny(actor)
      ? await query.get()
      : await query.where("personnel_id", ownPersonnelId).get();
    const personnelIds = [
      ...new Set(records.map((record) => Number(record.getAttribute("personnel_id")))),
    ];
    const officers =
      personnelIds.length === 0
        ? []
        : await Personnel.query().whereIn("id", personnelIds).get();
    const officerNames = new Map(
      officers.map((officer) => [
        Number(officer.id),
        String(officer.getAttribute("full_name") ?? ""),
      ]),
    );

    return Inertia.render("Leave/Index", {
      applications: records.map((record) => ({
        ...leaveProps(record),
        officer_name:
          officerNames.get(Number(record.getAttribute("personnel_id"))) ?? "",
      })),
    });
  }

  @Action()
  async create() {
    const actor = await currentActor(request());
    if (
      actor.personnelId === null ||
      !new LeaveApplicationPolicy().create(actor, actor.personnelId)
    ) {
      throw new HttpException(403, "This action is unauthorized.");
    }

    return Inertia.render("Leave/Create", { personnelId: actor.personnelId });
  }

  @Action()
  async store(form: StoreLeaveRequest) {
    const actor = await currentActor(form);
    const data = await form.validated();

    try {
      await this.service().submit(actor, {
        personnelId: Number(data.personnel_id),
        leaveType: String(data.leave_type) as LeaveType,
        startsOn: String(data.starts_on),
        endsOn: String(data.ends_on),
      });
    } catch (error) {
      this.rethrowWorkflow(error);
    }

    return response().redirect("/leave").toResponse();
  }

  @Action()
  async approve(application: LeaveApplication) {
    try {
      await this.service().approve(await currentActor(request()), Number(application.id));
    } catch (error) {
      this.rethrowWorkflow(error);
    }

    return response().redirect("/leave").toResponse();
  }

  @Action()
  async reject(application: LeaveApplication) {
    try {
      await this.service().reject(await currentActor(request()), Number(application.id));
    } catch (error) {
      this.rethrowWorkflow(error);
    }

    return response().redirect("/leave").toResponse();
  }

  private service(): LeaveService {
    return new LeaveService(User.getConnection(), {
      refuseSecondPending: leave.refuseSecondPending,
      notify: new QueueLeaveSubmitted(),
    });
  }

  private rethrowWorkflow(error: unknown): never {
    if (error instanceof LeaveWorkflowError) {
      throw new HttpException(422, error.message);
    }
    throw error;
  }
}

function leaveProps(record: LeaveApplication) {
  const endsOn = String(record.getAttribute("ends_on")).slice(0, 10);
  const status = String(record.getAttribute("status"));

  return {
    id: Number(record.getAttribute("id")),
    personnel_id: Number(record.getAttribute("personnel_id")),
    leave_type: record.getAttribute("leave_type"),
    starts_on: String(record.getAttribute("starts_on")).slice(0, 10),
    ends_on: endsOn,
    status,
    due_back: status === "approved" ? dueBackOn(endsOn) : null,
  };
}
